from datetime import datetime, timezone, timedelta
import logging
from fastapi import APIRouter, HTTPException, Request, Response
from app.api.schemas import ScanRequest, ExtensionReportResponse
from app.services.crx_fetcher import fetch_extension_crx, extract_extension_id
from app.services.store_scraper import scrape_store_metadata
from app.services.analyzer import analyze_buffer_zip
from app.services.policy_engine import evaluate_policies
from app.services.ai_analyzer import analyze_with_ai
from app.services.formatter import format_findings_for_users
from app.db.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", response_model=ExtensionReportResponse)
async def scan_extension(req: ScanRequest):
    input_str = req.extensionId or req.url
    if not input_str:
        raise HTTPException(
            status_code=400,
            detail="Missing input. Provide either 'extensionId' or 'url'"
        )

    try:
        parsed_id = extract_extension_id(input_str)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    logger.info(f"\n📥 API Scan request: {input_str} (Parsed ID: {parsed_id})")

    db = get_database()
    now = datetime.now(timezone.utc)
    twenty_four_hours_ago = now - timedelta(hours=24)

    # ── 1. Check 24-Hour MongoDB Cache ──
    if db is not None and not req.force:
        try:
            cached_doc = await db["extensions"].find_one({
                "extensionId": parsed_id,
                "scannedAt": {"$gte": twenty_four_hours_ago}
            }, sort=[("scannedAt", -1)])

            if cached_doc:
                logger.info("📦 Returning cached result from MongoDB")
                cached_doc["_id"] = str(cached_doc["_id"])
                
                # Run AI if missing from cache
                ai_analysis = cached_doc.get("aiAnalysis")
                if not ai_analysis:
                    ext_name = cached_doc.get("name") or "Chrome Extension"
                    ai_analysis = await analyze_with_ai(
                        cached_doc.get("manifest", {}),
                        cached_doc.get("findings", []),
                        cached_doc.get("storeMetadata"),
                        ext_name
                    )
                    if ai_analysis:
                        await db["extensions"].update_one(
                            {"_id": cached_doc["_id"]},
                            {"$set": {"aiAnalysis": ai_analysis}}
                        )

                report = format_findings_for_users(
                    cached_doc.get("findings", []),
                    cached_doc.get("score", 100)
                )

                return ExtensionReportResponse(
                    success=True,
                    cached=True,
                    extensionId=parsed_id,
                    name=cached_doc.get("name", "Unknown Extension"),
                    version=cached_doc.get("version", "1.0.0"),
                    report=report,
                    rawData={
                        "manifest": cached_doc.get("manifest", {}),
                        "score": cached_doc.get("score", 100),
                        "findings": cached_doc.get("findings", []),
                        "embeddedUrls": cached_doc.get("embeddedUrls", [])
                    },
                    storeMetadata=cached_doc.get("storeMetadata"),
                    aiAnalysis=ai_analysis,
                    savedToDb=True,
                    timestamp=now.isoformat()
                )
        except Exception as cache_err:
            logger.warning(f"⚠️ Cache read warning: {cache_err}")

    # ── 2. Scrape Store Metadata ──
    store_meta = await scrape_store_metadata(parsed_id)
    extension_name = store_meta.get("name") if store_meta and store_meta.get("name") else f"Extension ({parsed_id[:8]})"
    ext_category = store_meta.get("category") if store_meta else None

    # ── 3. Download CRX Package ──
    try:
        ext_id, crx_bytes = await fetch_extension_crx(input_str)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to download extension CRX: {e}"
        )

    # ── 4. Unpack & Analyze ──
    try:
        analysis = await analyze_buffer_zip(crx_bytes, category=ext_category)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to unpack or analyze extension archive: {e}"
        )

    # Update name from manifest if metadata scraper missed it
    if extension_name.startswith("Extension ("):
        manifest_name = analysis["manifest"].get("name")
        if manifest_name and not manifest_name.startswith("__MSG_"):
            extension_name = manifest_name

    # ── 5. Run AI Analysis ──
    ai_analysis = await analyze_with_ai(
        analysis["manifest"],
        analysis["findings"],
        store_meta,
        extension_name,
        categorized_urls=analysis.get("categorizedUrls")
    )

    report = format_findings_for_users(analysis["findings"], analysis["score"])

    # ── 6. Save to Database ──
    saved_to_db = False
    if db is not None:
        try:
            doc = {
                "extensionId": parsed_id,
                "name": extension_name,
                "version": analysis["manifest"].get("version", "1.0.0"),
                "manifest": analysis["manifest"],
                "score": analysis["score"],
                "findings": analysis["findings"],
                "embeddedUrls": analysis["embeddedUrls"],
                "categorizedUrls": analysis.get("categorizedUrls", []),
                "storeMetadata": store_meta,
                "aiAnalysis": ai_analysis,
                "scannedAt": now
            }
            await db["extensions"].update_one(
                {"extensionId": parsed_id},
                {"$set": doc},
                upsert=True
            )
            logger.info(f"💾 Saved/Updated scan record for {parsed_id} in MongoDB")
            saved_to_db = True
        except Exception as db_err:
            logger.warning(f"⚠️ Database save failed: {db_err}")

    return ExtensionReportResponse(
        success=True,
        cached=False,
        extensionId=parsed_id,
        name=extension_name,
        version=analysis["manifest"].get("version", "1.0.0"),
        report=report,
        rawData={
            "manifest": analysis["manifest"],
            "score": analysis["score"],
            "findings": analysis["findings"],
            "embeddedUrls": analysis["embeddedUrls"],
            "categorizedUrls": analysis.get("categorizedUrls", [])
        },
        storeMetadata=store_meta,
        aiAnalysis=ai_analysis,
        savedToDb=saved_to_db,
        timestamp=now.isoformat()
    )
