import logging
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None
    connected: bool = False

db_manager = DatabaseManager()

SAMPLE_EXTENSIONS = [
    {
        "extensionId": "cjpalhdlnbpafiamejdnhcphjbkeiagm",
        "name": "uBlock Origin",
        "version": "1.58.0",
        "manifest": {"manifest_version": 3, "permissions": ["storage", "webRequest", "webRequestBlocking", "unlimitedStorage"]},
        "score": 88,
        "findings": [
            {"severity": "high", "description": "Requests webRequestBlocking permission for blocking network tracking.", "permission": "webRequestBlocking"},
            {"severity": "low", "description": "Uses extension storage API.", "permission": "storage"}
        ],
        "embeddedUrls": ["https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt"],
        "storeMetadata": {
            "name": "uBlock Origin",
            "category": "Security & Privacy",
            "rating": 4.8,
            "users": "10,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=ublockorigin.com&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Low",
            "summary": "uBlock Origin is a widely trusted, open-source content blocker. It requests network filtering permissions essential for ad blocking, with low privacy risk."
        },
        "scannedAt": datetime.now(timezone.utc)
    },
    {
        "extensionId": "fmkadmapgofadopljbjfkapdkoienihi",
        "name": "React Developer Tools",
        "version": "5.2.0",
        "manifest": {"manifest_version": 3, "permissions": ["activeTab", "scripting", "storage"]},
        "score": 92,
        "findings": [
            {"severity": "low", "description": "Requests activeTab temporary grant on icon click.", "permission": "activeTab"},
            {"severity": "low", "description": "Uses storage API for preferences.", "permission": "storage"}
        ],
        "embeddedUrls": [],
        "storeMetadata": {
            "name": "React Developer Tools",
            "category": "Developer Tools",
            "rating": 4.6,
            "users": "4,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=react.dev&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Low",
            "summary": "Official React developer inspection extension published by Meta. Safe utility for debugging React component trees."
        },
        "scannedAt": datetime.now(timezone.utc)
    },
    {
        "extensionId": "aapbdbdomjkkjkaonfhkkikfgjllcleb",
        "name": "Google Translate",
        "version": "2.0.12",
        "manifest": {"manifest_version": 3, "permissions": ["storage", "activeTab", "contextMenus"]},
        "score": 90,
        "findings": [
            {"severity": "medium", "description": "Adds option to browser right-click context menu.", "permission": "contextMenus"}
        ],
        "embeddedUrls": ["https://translate.googleapis.com/element/v1/element.js"],
        "storeMetadata": {
            "name": "Google Translate",
            "category": "Productivity",
            "rating": 4.4,
            "users": "10,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=translate.google.com&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Low",
            "summary": "Official Google extension for translating web pages. Low security concern."
        },
        "scannedAt": datetime.now(timezone.utc)
    },
    {
        "extensionId": "kbfkoaehhgfdhhmjffeeikjbeebffmlo",
        "name": "Grammarly: AI Writing Assistance",
        "version": "14.1084.0",
        "manifest": {"manifest_version": 3, "permissions": ["storage", "activeTab", "cookies"]},
        "score": 74,
        "findings": [
            {"severity": "high", "description": "Accesses browser cookie storage for authentication state.", "permission": "cookies"},
            {"severity": "medium", "description": "Injects content scripts to inspect text input fields.", "permission": "content_scripts"}
        ],
        "embeddedUrls": ["https://auth.grammarly.com", "https://api.grammarly.com"],
        "storeMetadata": {
            "name": "Grammarly: AI Writing Assistance",
            "category": "Productivity",
            "rating": 4.5,
            "users": "10,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=grammarly.com&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Medium",
            "summary": "Grammarly inspects text fields across web pages to provide real-time spelling and grammar suggestions. Requires cookie access for account sync."
        },
        "scannedAt": datetime.now(timezone.utc)
    },
    {
        "extensionId": "nngceckbapebfimnlniiiahkandclblb",
        "name": "Bitwarden Password Manager",
        "version": "2024.6.0",
        "manifest": {"manifest_version": 3, "permissions": ["storage", "unlimitedStorage", "clipboardWrite", "idle"]},
        "score": 95,
        "findings": [
            {"severity": "medium", "description": "Modifies clipboard contents when copying passwords.", "permission": "clipboardWrite"}
        ],
        "embeddedUrls": ["https://vault.bitwarden.com/api"],
        "storeMetadata": {
            "name": "Bitwarden Password Manager",
            "category": "Security & Privacy",
            "rating": 4.9,
            "users": "1,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=bitwarden.com&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Minimal",
            "summary": "Open-source end-to-end encrypted password manager vault. Highly rated and audited."
        },
        "scannedAt": datetime.now(timezone.utc)
    },
    {
        "extensionId": "bmnlcjabgnbldmpobfkfoabolnebcacc",
        "name": "PayPal Honey: Automatic Coupons",
        "version": "12.8.2",
        "manifest": {"manifest_version": 3, "permissions": ["storage", "tabs", "cookies"]},
        "score": 68,
        "findings": [
            {"severity": "high", "description": "Monitors shopping site cart URLs and cookies.", "permission": "cookies"},
            {"severity": "medium", "description": "Reads active tab URLs for automatic deal matching.", "permission": "tabs"}
        ],
        "embeddedUrls": ["https://joinhoney.com/api/v1"],
        "storeMetadata": {
            "name": "PayPal Honey: Automatic Coupons",
            "category": "Shopping & Deals",
            "rating": 4.7,
            "users": "10,000,000+ users",
            "icon": "https://www.google.com/s2/favicons?domain=joinhoney.com&sz=128"
        },
        "aiAnalysis": {
            "riskLevel": "Medium",
            "summary": "Honey automatically searches and applies coupon promo codes at checkout. Requires browsing history and tab access to detect e-commerce carts."
        },
        "scannedAt": datetime.now(timezone.utc)
    }
]

async def seed_initial_database():
    try:
        if db_manager.db is None:
            return
        collection = db_manager.db["extensions"]
        count = await collection.count_documents({})
        if count < 3:
            logger.info("🌱 Database has fewer than 3 items. Auto-seeding sample categorized extensions...")
            await collection.insert_many(SAMPLE_EXTENSIONS)
            logger.info(f"✅ Auto-seeded {len(SAMPLE_EXTENSIONS)} extension records into MongoDB!")
    except Exception as e:
        logger.warning(f"⚠️ Auto-seed warning: {e}")

async def connect_to_mongo():
    try:
        logger.info(f"Connecting to MongoDB at {settings.MONGO_URI[:25]}...")
        db_manager.client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        # Verify connection
        await db_manager.client.admin.command('ping')
        
        # Determine database candidates: URI-specified, 'test', 'cyber-trust', 'safex'
        db_name_from_uri = None
        if "/" in settings.MONGO_URI.split("://")[-1]:
            uri_parts = settings.MONGO_URI.split("?")[0].split("/")
            if len(uri_parts) > 1 and uri_parts[-1]:
                db_name_from_uri = uri_parts[-1]

        candidates = [d for d in [db_name_from_uri, "test", "cyber-trust", "safex", "cyber_trust"] if d]
        # Deduplicate candidates preserving order
        seen = set()
        candidates = [x for x in candidates if not (x in seen or seen.add(x))]

        target_db_name = candidates[0]
        max_docs = -1

        for cand in candidates:
            try:
                candidate_db = db_manager.client[cand]
                doc_count = await candidate_db["extensions"].count_documents({})
                logger.info(f"🔍 Inspecting database '{cand}': found {doc_count} documents in 'extensions'")
                if doc_count > max_docs:
                    max_docs = doc_count
                    target_db_name = cand
            except Exception as cand_err:
                logger.debug(f"Could not inspect database {cand}: {cand_err}")

        db_manager.db = db_manager.client[target_db_name]
        db_manager.connected = True
        logger.info(f"✅ Connected to MongoDB database: '{target_db_name}' ({max_docs} extensions ready)")

        # Create indexes
        extensions_collection = db_manager.db["extensions"]
        await extensions_collection.create_index([("extensionId", 1), ("scannedAt", -1)])
        await extensions_collection.create_index([("scannedAt", -1)])
        await extensions_collection.create_index([("score", 1)])

        # Auto-seed database if empty
        if max_docs == 0:
            await seed_initial_database()
        
    except Exception as e:
        logger.warning(f"⚠️ MongoDB connection unavailable ({e}). Running in memory/fallback mode.")
        db_manager.connected = False

async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()
        logger.info("MongoDB connection closed.")

def get_database():
    return db_manager.db
