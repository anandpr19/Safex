from datetime import datetime, timezone
import logging
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from app.api.schemas import ExtensionReportResponse
from app.services.analyzer import analyze_buffer_zip
from app.services.ai_analyzer import analyze_with_ai
from app.services.formatter import format_findings_for_users
from app.db.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", response_model=ExtensionReportResponse)
async def upload_extension(
    file: UploadFile = File(...),
    extensionId: str = Form(None)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    contents = await file.read()
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="Uploaded file is too small or corrupt")
        
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Maximum file size limit is 50MB")

    ext_id = extensionId or file.filename.replace(".crx", "").replace(".zip", "")
    logger.info(f"📤 Upload request processing: filename='{file.filename}', size={len(contents)} bytes")

    try:
        analysis = await analyze_buffer_zip(contents)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to unpack or analyze uploaded package: {e}")

    extension_name = analysis["manifest"].get("name") or ext_id
    if extension_name.startswith("__MSG_"):
        extension_name = ext_id

    ai_analysis = await analyze_with_ai(
        analysis["manifest"],
        analysis["findings"],
        None,
        extension_name
    )

    report = format_findings_for_users(analysis["findings"], analysis["score"])
    now = datetime.now(timezone.utc)

    saved_to_db = False
    db = get_database()
    if db is not None:
        try:
            doc = {
                "extensionId": ext_id[:32],
                "name": extension_name,
                "version": analysis["manifest"].get("version", "1.0.0"),
                "manifest": analysis["manifest"],
                "score": analysis["score"],
                "findings": analysis["findings"],
                "embeddedUrls": analysis["embeddedUrls"],
                "aiAnalysis": ai_analysis,
                "scannedAt": now
            }
            await db["extensions"].insert_one(doc)
            saved_to_db = True
        except Exception as e:
            logger.warning(f"⚠️ DB save warning on file upload: {e}")

    return ExtensionReportResponse(
        success=True,
        cached=False,
        extensionId=ext_id,
        name=extension_name,
        version=analysis["manifest"].get("version", "1.0.0"),
        report=report,
        rawData={
            "manifest": analysis["manifest"],
            "score": analysis["score"],
            "findings": analysis["findings"],
            "embeddedUrls": analysis["embeddedUrls"]
        },
        storeMetadata=None,
        aiAnalysis=ai_analysis,
        savedToDb=saved_to_db,
        timestamp=now.isoformat()
    )
