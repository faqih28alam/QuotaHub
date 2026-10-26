import asyncio
import ipaddress
import socket
import time
from dataclasses import dataclass

import httpx

from app.core.config import settings
from app.services.monitor_policy import TargetRejected, address_allowed, parse_http_target


@dataclass
class CheckResult:
    status: str
    status_code: int | None = None
    latency_ms: int | None = None
    error: str | None = None


def _default_port(parsed) -> int:
    if parsed.port:
        return parsed.port
    return 443 if parsed.scheme == "https" else 80


def _literal_ip(hostname: str) -> str | None:
    try:
        return str(ipaddress.ip_address(hostname))
    except ValueError:
        return None


async def ensure_target_allowed(url: str, route: str) -> str:
    parsed = parse_http_target(url)
    host = parsed.hostname.rstrip(".").lower()
    literal = _literal_ip(host)
    if literal is not None:
        if not address_allowed(literal, route):
            raise TargetRejected("address_not_allowed")
        return url.strip()

    port = _default_port(parsed)
    loop = asyncio.get_running_loop()
    try:
        infos = await loop.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        if route == "tailscale" and (host.endswith(".ts.net") or "." not in host):
            return url.strip()
        raise TargetRejected("resolve_failed") from None

    addresses = {item[4][0] for item in infos}
    if not addresses or any(not address_allowed(ip, route) for ip in addresses):
        raise TargetRejected("address_not_allowed")
    return url.strip()


async def run_check(url: str, route: str, expected_status: int, timeout_seconds: float) -> CheckResult:
    try:
        target = await ensure_target_allowed(url, route)
    except TargetRejected as exc:
        return CheckResult(status="down", error=exc.code)

    proxy = None
    if route == "tailscale":
        proxy = settings.TAILSCALE_SOCKS_PROXY.strip() or None
        if proxy is None:
            return CheckResult(status="down", error="tailscale_unavailable")

    timeout = httpx.Timeout(timeout_seconds)
    started = time.perf_counter()
    try:
        client_kwargs = {"timeout": timeout, "follow_redirects": False}
        if proxy:
            client_kwargs["proxy"] = proxy
        async with httpx.AsyncClient(**client_kwargs) as client:
            async with client.stream("GET", target) as response:
                status_code = response.status_code
    except httpx.TimeoutException:
        return CheckResult(status="down", error="timeout")
    except httpx.RequestError:
        if route == "tailscale":
            return CheckResult(status="down", error="tailscale_unavailable")
        return CheckResult(status="down", error="connection_failed")

    latency_ms = int((time.perf_counter() - started) * 1000)
    if status_code == expected_status:
        return CheckResult(status="up", status_code=status_code, latency_ms=latency_ms)
    return CheckResult(
        status="down",
        status_code=status_code,
        latency_ms=latency_ms,
        error="unexpected_status",
    )
