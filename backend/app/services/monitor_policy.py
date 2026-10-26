import ipaddress
import re
from urllib.parse import urlparse

class TargetRejected(Exception):
    def __init__(self, code: str):
        self.code = code
        super().__init__(code)


_BLOCKED_HOSTS = {
    "localhost",
    "metadata",
    "metadata.google.internal",
    "metadata.internal",
    "host.docker.internal",
    "kubernetes",
    "kubernetes.default",
    "kubernetes.default.svc",
}

_CGNAT = ipaddress.ip_network("100.64.0.0/10")
_TAILSCALE_V6 = ipaddress.ip_network("fd7a:115c:a1e0::/48")
_NUMERIC_HOST = re.compile(r"^[0-9.]+$")


def parse_http_target(url: str):
    cleaned = url.strip()
    if not cleaned or len(cleaned) > 500:
        raise TargetRejected("invalid_url")
    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise TargetRejected("invalid_url")
    if parsed.username or parsed.password:
        raise TargetRejected("invalid_url")
    host = parsed.hostname.rstrip(".").lower()
    if host in _BLOCKED_HOSTS or host.endswith(".localhost"):
        raise TargetRejected("address_not_allowed")
    try:
        port = parsed.port
    except ValueError:
        raise TargetRejected("invalid_url") from None
    if port is not None and not 1 <= port <= 65535:
        raise TargetRejected("invalid_url")
    if _NUMERIC_HOST.fullmatch(host):
        try:
            ipaddress.ip_address(host)
        except ValueError:
            raise TargetRejected("address_not_allowed") from None
    return parsed


def address_allowed(raw_ip: str, route: str) -> bool:
    try:
        ip = ipaddress.ip_address(raw_ip)
    except ValueError:
        return False
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped

    if ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_unspecified:
        return False

    if ip in _CGNAT or ip in _TAILSCALE_V6 or ip.is_private:
        return route == "tailscale"
    return True
