import re
import logging
import httpx

logger = logging.getLogger(__name__)

CHROME_VERSION = "131.0.6778.86"

def extract_extension_id(input_str: str) -> str:
    input_str = input_str.strip()
    
    if re.match(r"^[a-z]{32}$", input_str):
        return input_str
        
    # Match ID in Chrome store URL or chrome-extension://
    match = re.search(r"([a-z]{32})(?:\?|/|$)", input_str)
    if match:
        return match.group(1)
        
    ext_match = re.search(r"chrome-extension://([a-z]{32})", input_str)
    if ext_match:
        return ext_match.group(1)
        
    raise ValueError(
        f"Invalid Extension ID or Web Store URL. Expected a 32-letter lowercase string. Got: {input_str}"
    )

async def fetch_from_google_store(extension_id: str) -> bytes:
    url = f"https://clients2.google.com/service/update2/crx?response=redirect&acceptformat=crx2,crx3&x=id%3D{extension_id}%26installsource%3Dondemand%26uc&prodversion={CHROME_VERSION}"
    logger.info(f"🔗 Fetching CRX from Google Web Store: {extension_id}")
    
    headers = {
        "User-Agent": f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/{CHROME_VERSION} Safari/537.36",
        "Accept": "application/octet-stream, */*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
        resp = await client.get(url, headers=headers)
        if resp.status_code == 200 and len(resp.content) > 100:
            logger.info(f"✅ Downloaded {len(resp.content)} bytes from Google")
            return resp.content
        raise Exception(f"Google Store response status: {resp.status_code}, length: {len(resp.content)}")

async def fetch_from_mirrors(extension_id: str) -> bytes:
    mirrors = [
        f"https://crx.dam.io/{extension_id}.crx",
        f"https://chrome-extension-downloader.com/{extension_id}.crx"
    ]
    
    headers = {
        "User-Agent": f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/{CHROME_VERSION} Safari/537.36",
        "Accept": "application/octet-stream"
    }
    
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0) as client:
        for mirror_url in mirrors:
            try:
                logger.info(f"🔄 Trying mirror: {mirror_url}")
                resp = await client.get(mirror_url, headers=headers)
                if resp.status_code == 200 and len(resp.content) > 1000:
                    logger.info(f"✅ Downloaded from mirror ({len(resp.content)} bytes)")
                    return resp.content
            except Exception as e:
                logger.warning(f"⚠️ Mirror failed: {e}")
                
    raise Exception("All CRX download mirrors failed")

async def fetch_extension_crx(input_str: str) -> tuple[str, bytes]:
    extension_id = extract_extension_id(input_str)
    try:
        content = await fetch_from_google_store(extension_id)
        return extension_id, content
    except Exception as e:
        logger.warning(f"⚠️ Google Web Store fetch failed: {e}. Trying mirrors...")
        content = await fetch_from_mirrors(extension_id)
        return extension_id, content
