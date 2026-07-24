import io
import re
import json
import zipfile
import logging
from app.services.policy_engine import evaluate_policies

logger = logging.getLogger(__name__)

URL_FILTER_PATTERNS = [
    "chromium.org", "w3.org", "schema.org", "googleapis.com",
    "fonts.gstatic.com", "developer.mozilla.org", "developer.chrome.com",
    "github.com/nicedoc", "webpack.js.org", "babeljs.io", "reactjs.org"
]

URL_REGEX = re.compile(r"https?://[^\s'\"<>)\]\},;]+")

def strip_crx_header(buf: bytes) -> bytes:
    """
    Strips Chrome Extension CRX header (CRXv2 or CRXv3) to yield pure PK ZIP bytes.
    """
    if len(buf) >= 4 and buf[:4] == b"Cr24":
        logger.info("📦 CRX header detected (Cr24)")
        if len(buf) >= 16:
            version = int.from_bytes(buf[4:8], "little")
            logger.info(f"CRX Version: {version}")
            
            header_size = 16
            if version == 2:
                pub_key_len = int.from_bytes(buf[8:12], "little")
                sig_len = int.from_bytes(buf[12:16], "little")
                header_size = 16 + pub_key_len + sig_len
            elif version == 3:
                header_len = int.from_bytes(buf[8:12], "little")
                header_size = 12 + header_len
                
            pk_magic = b"PK\x03\x04"
            zip_idx = buf.find(pk_magic)
            if zip_idx != -1 and zip_idx < len(buf) - 100:
                header_size = zip_idx
                
            return buf[header_size:]
            
    # Check if already a pure ZIP file
    pk_idx = buf.find(b"PK\x03\x04")
    if pk_idx != -1:
        return buf[pk_idx:]
        
    raise ValueError("File is not a valid CRX or ZIP archive")

def extract_urls(files: dict[str, str]) -> list[str]:
    url_set = set()
    for filename, content in files.items():
        if not filename.lower().endswith((".js", ".html", ".json", ".css", ".ts", ".jsx", ".tsx")):
            continue
        matches = URL_REGEX.findall(content)
        for url in matches:
            cleaned = re.sub(r"[.,;:!?)\}\]]+$", "", url)
            if len(cleaned) > 10 and not any(p in cleaned.lower() for p in URL_FILTER_PATTERNS):
                url_set.add(cleaned)
    return sorted(list(url_set))

async def analyze_buffer_zip(raw_buf: bytes) -> dict:
    zip_bytes = strip_crx_header(raw_buf)
    
    files = {}
    manifest = None
    
    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        for info in zf.infolist():
            if info.is_dir():
                continue
            name = info.filename
            
            # Zip bomb safeguard: skip overly large files
            if info.file_size > 15 * 1024 * 1024:
                logger.warning(f"⚠️ Skipping oversized file in zip: {name} ({info.file_size} bytes)")
                continue
                
            try:
                content_bytes = zf.read(info)
                # Decode text files
                text = content_bytes.decode("utf-8", errors="ignore")
                files[name] = text
                
                if name == "manifest.json" or name.endswith("/manifest.json"):
                    manifest = json.loads(text)
            except Exception as e:
                pass # Binary files ignored
                
    if not manifest:
        raise ValueError("manifest.json not found in Chrome Extension archive")
        
    embedded_urls = extract_urls(files)
    score, findings = evaluate_policies(manifest, files)
    
    return {
        "manifest": manifest,
        "files": files,
        "score": score,
        "findings": findings,
        "embeddedUrls": embedded_urls
    }
