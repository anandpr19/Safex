import re
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a Senior Extension Security Specialist for Safex, an automated security analyzer for Chrome Extensions.
Analyze the provided Chrome extension details, permissions, security findings, embedded URLs, and declared Web Store category.

Evaluate whether the requested permissions and host access align with the extension's stated category and functionality (Permission-to-Category Correlation).

Your response MUST be concise (under 180 words) and strictly follow this 3-part layout:

Risk Level: <Critical|High|Medium|Low|Minimal>
[CONTEXT & JUSTIFICATION]: <1-2 sentences explaining if requested permissions (e.g. cookies, webRequest, <all_urls>) are typical and justified for this extension's category (e.g., Productivity, Developer Tools, Security) or if they present unnecessary exposure.>
[ACTIONABLE RECOMMENDATION]: <Direct recommendation for users/admins (e.g., "Safe to install for personal use", "Audit host permissions before deploying in enterprise environments", or "Avoid installing due to excessive unneeded privileges").>
"""

async def analyze_with_ai(manifest: dict, findings: list[dict], store_metadata: dict | None, extension_name: str, categorized_urls: list[dict] | None = None) -> dict | None:
    api_key = settings.AI_API_KEY
    if not api_key:
        logger.info("ℹ️ AI_API_KEY is not set - skipping AI contextual analysis")
        return None
        
    base_url = settings.AI_BASE_URL.rstrip("/")
    model = settings.AI_MODEL
    if not model:
        if "openrouter" in base_url:
            model = "meta-llama/llama-3.3-70b-instruct"
        elif "together" in base_url:
            model = "meta-llama/Llama-3.3-70B-Instruct-Turbo"
        elif "openai" in base_url:
            model = "gpt-4o-mini"
        else:
            model = "llama-3.3-70b-versatile" # Default for Groq

    prompt = f"Analyze Chrome Extension: {extension_name}\n"
    prompt += f"Manifest Version: {manifest.get('manifest_version', 'Unknown')}\n"
    prompt += f"Permissions: {', '.join(manifest.get('permissions', [])) or 'None'}\n"
    if store_metadata:
        prompt += f"Category: {store_metadata.get('category', 'Unknown')}, Users: {store_metadata.get('users', 'Unknown')}\n"
    
    if categorized_urls:
        prompt += f"Embedded Hardcoded URLs ({len(categorized_urls)} total sample):\n"
        for item in categorized_urls[:8]:
            prompt += f"- [{item.get('type', 'External')}]: {item.get('url', '')} (Relevance: {item.get('relevance', 'unknown')})\n"

    prompt += f"Security Findings ({len(findings)} total):\n"
    for f in findings:
        prompt += f"- [{f.get('severity', 'info').upper()}]: {f.get('description', '')}\n"

    try:
        logger.info(f"🤖 Sending AI analysis request ({model} via {base_url})...")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3,
            "max_tokens": 400
        }
        
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(f"{base_url}/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if text:
                    risk_match = re.search(r"Risk Level:\s*(Critical|High|Medium|Low|Minimal)", text, re.IGNORECASE)
                    risk_level = risk_match.group(1).capitalize() if risk_match else "Medium"
                    logger.info(f"✅ AI analysis complete. Risk level: {risk_level}")
                    return {
                        "summary": text,
                        "riskLevel": risk_level
                    }
            logger.warning(f"⚠️ AI API returned status {resp.status_code}: {resp.text[:150]}")
            return None
    except Exception as e:
        logger.warning(f"⚠️ AI analysis call failed: {e}")
        return None
