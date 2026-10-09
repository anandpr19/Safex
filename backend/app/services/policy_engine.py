import re
import logging

logger = logging.getLogger(__name__)

# Permission risk definitions with calibrated non-punitive penalties
RISKY_PERMISSIONS = {
    # Critical Permissions
    "camera": {"penalty": 15, "severity": "critical", "desc": "Access to webcam - privacy risk"},
    "microphone": {"penalty": 15, "severity": "critical", "desc": "Access to microphone - privacy risk"},
    "management": {"penalty": 15, "severity": "critical", "desc": "Can manage other installed extensions"},
    "debugger": {"penalty": 15, "severity": "critical", "desc": "Can debug and inspect browser runtime"},
    
    # High Risk Permissions
    "history": {"penalty": 10, "severity": "high", "desc": "Reads browsing history"},
    "webRequestBlocking": {"penalty": 12, "severity": "high", "desc": "Intercepts and blocks network requests"},
    "cookies": {"penalty": 10, "severity": "high", "desc": "Access to browser cookies"},
    "clipboardRead": {"penalty": 10, "severity": "high", "desc": "Reads data copied to clipboard"},
    "webRequest": {"penalty": 8, "severity": "high", "desc": "Monitors network traffic"},
    "proxy": {"penalty": 10, "severity": "high", "desc": "Controls proxy network routing"},
    "webNavigation": {"penalty": 8, "severity": "high", "desc": "Tracks page navigation"},
    "downloads": {"penalty": 8, "severity": "high", "desc": "Can download files"},
    "privacy": {"penalty": 8, "severity": "high", "desc": "Modifies browser privacy settings"},
    "identity": {"penalty": 6, "severity": "high", "desc": "Accesses OAuth identity tokens"},
    "bookmarks": {"penalty": 6, "severity": "high", "desc": "Accesses bookmarks"},
    
    # Medium Risk Permissions
    "clipboardWrite": {"penalty": 6, "severity": "medium", "desc": "Modifies clipboard contents"},
    "geolocation": {"penalty": 8, "severity": "medium", "desc": "Accesses physical location"},
    "notifications": {"penalty": 4, "severity": "medium", "desc": "Displays desktop notifications"},
    "unlimitedStorage": {"penalty": 4, "severity": "medium", "desc": "Stores large amounts of local data"},
    "contextMenus": {"penalty": 2, "severity": "medium", "desc": "Adds context menu items"},
    
    # Low Risk Permissions
    "tabs": {"penalty": 5, "severity": "low", "desc": "Access to open tab titles and URLs"},
    "activeTab": {"penalty": 2, "severity": "low", "desc": "Accesses active tab on click"},
    "storage": {"penalty": 2, "severity": "low", "desc": "Stores extension settings locally"}
}

CODE_PATTERNS = [
    {
        "key": "hardcoded-credentials",
        "regex": r"(?:password|api_?key|secret_?key)\s*[:=]\s*['\"][A-Za-z0-9_\-]{16,}['\"]",
        "penalty": 20,
        "severity": "critical",
        "desc": "Hardcoded credentials or secret token detected in code"
    },
    {
        "key": "eval-usage",
        "regex": r"\beval\s*\(",
        "penalty": 12,
        "severity": "high",
        "desc": "Uses eval() - dynamic code execution risk"
    },
    {
        "key": "weak-crypto-md5",
        "regex": r"\bmd5\s*\(",
        "penalty": 10,
        "severity": "high",
        "desc": "Uses deprecated MD5 hashing algorithm"
    },
    {
        "key": "insecure-http",
        "regex": r"http://[a-zA-Z0-9.-]+\.(com|org|net|io)",
        "penalty": 6,
        "severity": "medium",
        "desc": "Communicates over unencrypted HTTP"
    },
    {
        "key": "innerHTML-assignment",
        "regex": r"\.innerHTML\s*=",
        "penalty": 4,
        "severity": "medium",
        "desc": "Direct innerHTML assignment - potential XSS vector"
    }
]

SENSITIVE_DOMAINS = [
    "chase", "bankofamerica", "wellsfargo", "citibank", "paypal",
    "venmo", "stripe", "coinbase", "binance", "metamask",
    "google", "facebook", "github", "gmail"
]

CATEGORY_JUSTIFIED_PERMISSIONS = {
    "Security & Privacy": {
        "webRequest", "webRequestBlocking", "storage", "unlimitedStorage", "proxy",
        "privacy", "tabs", "activeTab", "cookies", "<all_urls>", "*://*/*", "declarativeNetRequest"
    },
    "Developer Tools": {
        "scripting", "activeTab", "tabs", "debugger", "storage", "devtools",
        "management", "<all_urls>", "*://*/*", "webNavigation"
    },
    "Productivity": {
        "storage", "activeTab", "tabs", "contextMenus", "notifications",
        "cookies", "clipboardRead", "clipboardWrite", "identity", "bookmarks", "alarms"
    },
    "Shopping & Deals": {
        "storage", "tabs", "activeTab", "cookies", "webRequest", "notifications", "contextMenus"
    },
    "Social & Communication": {
        "storage", "notifications", "activeTab", "tabs", "cookies", "clipboardWrite", "audio"
    },
    "General & Utilities": {
        "storage", "activeTab", "contextMenus", "notifications"
    }
}

from urllib.parse import urlparse

def analyze_embedded_urls(urls: list[str], manifest: dict = None, category: str = None) -> list[dict]:
    categorized = []
    
    # Extract declared target host permissions and homepage from manifest
    target_domains = set()
    if manifest:
        # Host permissions & match patterns
        perm_list = (manifest.get("permissions", []) or []) + (manifest.get("host_permissions", []) or [])
        for item in perm_list:
            if isinstance(item, str) and ("://" in item or "*." in item or item.startswith("*")):
                cleaned = item.replace("*://", "").replace("https://", "").replace("http://", "").replace("/*", "").replace("*.", "").strip()
                if cleaned and len(cleaned) > 2 and cleaned not in ["<all_urls>", "*"]:
                    target_domains.add(cleaned.lower())
        
        # Content scripts match patterns
        for cs in manifest.get("content_scripts", []) or []:
            if isinstance(cs, dict):
                for match in cs.get("matches", []) or []:
                    cleaned = match.replace("*://", "").replace("https://", "").replace("http://", "").replace("/*", "").replace("*.", "").strip()
                    if cleaned and len(cleaned) > 2 and cleaned not in ["<all_urls>", "*"]:
                        target_domains.add(cleaned.lower())
        
        # Developer homepage URL
        homepage = manifest.get("homepage_url")
        if homepage and isinstance(homepage, str):
            try:
                parsed_home = urlparse(homepage).netloc.lower()
                if parsed_home:
                    target_domains.add(parsed_home)
            except Exception:
                pass

    official_web_standards = [
        "google.com", "googleapis.com", "w3.org", "schema.org", 
        "mozilla.org", "chrome.google.com", "microsoft.com", "github.com",
        "gstatic.com", "githubusercontent.com"
    ]
    known_cdns_telemetry = [
        "sentry.io", "segment.io", "mixpanel.com", "cloudfront.net", 
        "amazonaws.com", "unpkg.com", "jsdelivr.net", "cdnjs.cloudflare.com",
        "google-analytics.com", "googletagmanager.com", "bugsnag.com", "posthog.com"
    ]

    for url in urls[:25]:
        url_lower = url.lower()
        try:
            parsed = urlparse(url)
            netloc = parsed.netloc.lower() or url_lower
        except Exception:
            netloc = url_lower

        # 1. Check if domain matches declared target permissions / extension homepage
        is_target_related = any(dom in netloc or dom in url_lower for dom in target_domains if dom)

        if is_target_related:
            cat_type = "Legit: Extension Target Service Endpoint"
            risk = "minimal"
            relevance = "directly_relevant"
            explanation = "URL domain matches extension declared host permissions, target API, or developer site."
        elif any(dom in netloc or dom in url_lower for dom in official_web_standards):
            cat_type = "Legit: Web Standard / Platform API"
            risk = "minimal"
            relevance = "platform_standard"
            explanation = "Official web platform, documentation schema, or browser API standard."
        elif any(cdn in netloc or cdn in url_lower for cdn in known_cdns_telemetry):
            cat_type = "Infrastructure: Telemetry / CDN"
            risk = "low"
            relevance = "infrastructure"
            explanation = "Standard dependency for crash reporting, telemetry, or UI asset distribution."
        else:
            cat_type = "Irrelevant / Third-Party External Domain"
            risk = "medium"
            relevance = "irrelevant_external"
            explanation = "External domain not declared in extension target permissions or primary functionality."

        categorized.append({
            "url": url,
            "domain": netloc,
            "type": cat_type,
            "risk": risk,
            "relevance": relevance,
            "explanation": explanation
        })
        
    return categorized

def evaluate_policies(manifest: dict, files: dict[str, str], category: str = None) -> tuple[int, list[dict]]:
    score = 100
    findings = []
    
    permissions = set()
    if isinstance(manifest.get("permissions"), list):
        permissions.update(manifest["permissions"])
    if isinstance(manifest.get("optional_permissions"), list):
        permissions.update(manifest["optional_permissions"])
    if isinstance(manifest.get("host_permissions"), list):
        permissions.update(manifest["host_permissions"])
        
    justified_perms = CATEGORY_JUSTIFIED_PERMISSIONS.get(category, set()) if category else set()

    matched_perms = set()
    for perm in permissions:
        perm_lower = str(perm).lower()
        
        for key, risk in RISKY_PERMISSIONS.items():
            if key.lower() in perm_lower and key not in matched_perms:
                matched_perms.add(key)
                
                # Category-Aware Scoring Adjustment
                is_justified = category and (key in justified_perms or perm_lower in justified_perms)
                if is_justified:
                    # Waive 70% of penalty for category-justified permissions
                    effective_penalty = int(risk["penalty"] * 0.3)
                    score -= effective_penalty
                    findings.append({
                        "type": "permission",
                        "severity": "low",
                        "permission": key,
                        "description": f"{risk['desc']} (Justified & expected for {category} extensions - penalty reduced from {risk['penalty']} to {effective_penalty} pts)"
                    })
                else:
                    # Apply full penalty for unexpected permissions
                    score -= risk["penalty"]
                    findings.append({
                        "type": "permission",
                        "severity": risk["severity"],
                        "permission": key,
                        "description": f"{risk['desc']}" + (f" - Unexpected for {category} category" if category else "")
                    })
                
        if perm_lower in ["<all_urls>", "*://*/*", "*://*"]:
            if category in ["Security & Privacy", "Developer Tools"]:
                score -= 4 # Reduced penalty for justified host access
                findings.append({
                    "type": "host-permission",
                    "severity": "medium",
                    "permission": perm,
                    "description": f"Has broad host access across all websites (Justified for {category} core functionality)"
                })
            else:
                score -= 12
                findings.append({
                    "type": "host-permission",
                    "severity": "high",
                    "permission": perm,
                    "description": "Has access to read/modify data across all websites (Broad host privilege)"
                })

    # Check permission combinations
    perm_list = [str(p).lower() for p in permissions]
    if "webrequest" in perm_list and "webrequestblocking" in perm_list:
        if category == "Security & Privacy":
            score -= 5 # Waived heavy penalty for Adblocker/VPN privacy tools
            findings.append({
                "type": "permission-combo",
                "severity": "medium",
                "permission": "webRequest + webRequestBlocking",
                "description": "Intercepts and blocks network requests (Expected for Content Blockers / Privacy tools)"
            })
        else:
            score -= 15
            findings.append({
                "type": "permission-combo",
                "severity": "high",
                "permission": "webRequest + webRequestBlocking",
                "description": "Can intercept and modify live web requests in real-time"
            })

    # Check Content Security Policy
    csp = manifest.get("content_security_policy")
    if csp:
        csp_str = str(csp)
        if "'unsafe-eval'" in csp_str:
            findings.append({
                "type": "csp",
                "severity": "high",
                "value": "unsafe-eval",
                "description": "CSP allows dynamic JS evaluation ('unsafe-eval')"
            })
            score -= 10

    # Scan code patterns (stripping comments first)
    for filename, content in files.items():
        if not filename.lower().endswith((".js", ".html", ".json", ".ts", ".jsx", ".tsx")):
            continue
            
        # Strip comments
        stripped_content = re.sub(r"//.*$", "", content, flags=re.MULTILINE)
        stripped_content = re.sub(r"/\*[\s\S]*?\*/", "", stripped_content)
        
        for pattern in CODE_PATTERNS:
            if re.search(pattern["regex"], stripped_content, re.IGNORECASE):
                findings.append({
                    "type": "code-pattern",
                    "severity": pattern["severity"],
                    "pattern": pattern["key"],
                    "file": filename,
                    "description": pattern["desc"]
                })
                score -= pattern["penalty"]

    # Calibrated Caps (Prevents scores from dropping unfairly to 0 for safe extensions)
    has_critical = any(f["severity"] == "critical" for f in findings)
    has_high = any(f["severity"] == "high" for f in findings)
    
    if has_critical:
        score = min(score, 50)
    elif has_high:
        score = min(score, 75)
        
    score = max(0, min(100, score))
    
    if not findings:
        findings.append({
            "type": "info",
            "severity": "good",
            "description": "No security risks detected during static manifest analysis"
        })
        
    return score, findings
