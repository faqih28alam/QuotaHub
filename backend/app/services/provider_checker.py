import httpx
from typing import Dict, Any

async def verify_provider_balance(
    provider: str, 
    plain_api_key: str, 
    endpoint: str = None, 
    alert_threshold: float = 2.0, 
    max_quota: float = 20.0,
    current_balance: float = 10.0
) -> Dict[str, Any]:
    """
    Direct asynchronous balance checker for third-party providers.
    Uses plaintext key strictly in memory during outbound request.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. 2Captcha
        if provider == "twocaptcha":
            url = f"https://2captcha.com/res.php?key={plain_api_key}&action=getbalance&json=1"
            res = await client.get(url)
            data = res.json()
            if data.get("status") == 1:
                balance = float(data.get("request", 0.0))
                status = "danger" if balance <= 0.2 else "warning" if balance <= alert_threshold else "healthy"
                return {"balance": balance, "maxQuota": max(10.0, balance * 1.25), "status": status}
            raise ValueError(data.get("request", "Invalid 2Captcha response"))

        # 2. TikHub
        elif provider == "tikhub":
            res = await client.get(
                "https://api.tikhub.io/user/profile",
                headers={"Authorization": f"Bearer {plain_api_key}"}
            )
            if res.status_code == 200:
                data = res.json()
                balance = float(data.get("data", {}).get("balance", current_balance))
                status = "danger" if balance <= 0.2 else "warning" if balance <= alert_threshold else "healthy"
                return {"balance": balance, "maxQuota": max_quota, "status": status}
            raise ValueError(f"TikHub HTTP {res.status_code}")

        # 3. OpenAI Validation
        elif provider == "openai":
            res = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {plain_api_key}"}
            )
            if res.status_code == 200:
                status = "warning" if current_balance <= alert_threshold else "healthy"
                return {"balance": current_balance, "maxQuota": max_quota, "status": status}
            raise ValueError(f"OpenAI Authentication Failed: HTTP {res.status_code}")

        # 4. Custom Endpoint
        elif provider == "custom" and endpoint:
            res = await client.get(
                endpoint,
                headers={"Authorization": f"Bearer {plain_api_key}"}
            )
            if res.status_code == 200:
                data = res.json()
                balance = float(data.get("balance", data.get("credits", current_balance)))
                status = "danger" if balance <= 0.2 else "warning" if balance <= alert_threshold else "healthy"
                return {"balance": balance, "maxQuota": max_quota, "status": status}
            raise ValueError(f"Custom endpoint HTTP {res.status_code}")

        # Default fallback
        status = "danger" if current_balance <= 0.2 else "warning" if current_balance <= alert_threshold else "healthy"
        return {"balance": current_balance, "maxQuota": max_quota, "status": status}
