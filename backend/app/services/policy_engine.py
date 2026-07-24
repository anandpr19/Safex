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

def evaluate_policies(manifest: dict, files: dict[str, str]) -> tuple[int, list[dict]]:
    score = 100
    findings = []
    
    permissions = set()
    if isinstance(manifest.get("permissions"), list):
        permissions.update(manifest["permissions"])
    if isinstance(manifest.get("optional_permissions"), list):
        permissions.update(manifest["optional_permissions"])
    if isinstance(manifest.get("host_permissions"), list):
        permissions.update(manifest["host_permissions"])
        
    matched_perms = set()
    for perm in permissions:
        perm_lower = str(perm).lower()
        
        for key, risk in RISKY_PERMISSIONS.items():
            if key.lower() in perm_lower and key not in matched_perms:
                matched_perms.add(key)
                findings.append({
                    "type": "permission",
                    "severity": risk["severity"],
                    "permission": key,
                    "description": risk["desc"]
                })
                score -= risk["penalty"]
                
        if perm_lower in ["<all_urls>", "*://*/*", "*://*"]:
            findings.append({
                "type": "host-permission",
                "severity": "high",
                "permission": perm,
                "description": "Has access to read/modify data across all websites"
            })
            score -= 12

    # Check permission combinations
    perm_list = [str(p).lower() for p in permissions]
    if "webrequest" in perm_list and "webrequestblocking" in perm_list:
        findings.append({
            "type": "permission-combo",
            "severity": "high",
            "permission": "webRequest + webRequestBlocking",
            "description": "Can intercept and modify live web requests in real-time"
        })
        score -= 15

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
        score = min(score, 45) # Cap at 45 instead of 25
    elif has_high:
        score = min(score, 70) # Cap at 70 instead of 50
        
    score = max(0, min(100, score))
    
    if not findings:
        findings.append({
            "type": "info",
            "severity": "good",
            "description": "No security risks detected during static manifest analysis"
        })
        
    return score, findings
