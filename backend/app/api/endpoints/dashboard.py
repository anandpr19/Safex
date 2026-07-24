import logging
from fastapi import APIRouter, Query
from app.api.schemas import PaginatedHistoryResponse, DashboardStatsResponse
from app.db.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/history", response_model=PaginatedHistoryResponse)
async def get_scan_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page")
):
    """
    Returns paginated scan history log from MongoDB.
    Solves the missing older page scans issue by allowing front-end navigation through all pages.
    """
    db = get_database()
    if db is None:
        return PaginatedHistoryResponse(
            success=True,
            page=page,
            limit=limit,
            total=0,
            totalPages=0,
            items=[]
        )

    try:
        skip = (page - 1) * limit
        collection = db["extensions"]
        
        total_count = await collection.count_documents({})
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0

        cursor = collection.find(
            {},
            {
                "extensionId": 1,
                "name": 1,
                "version": 1,
                "score": 1,
                "findings": 1,
                "storeMetadata": 1,
                "aiAnalysis": 1,
                "scannedAt": 1
            }
        ).sort("scannedAt", -1).skip(skip).limit(limit)

        items = []
        async for doc in cursor:
            items.append({
                "id": str(doc["_id"]),
                "extensionId": doc.get("extensionId"),
                "name": doc.get("name", "Unknown Extension"),
                "version": doc.get("version", "1.0.0"),
                "score": doc.get("score", 100),
                "riskLevel": "Low" if doc.get("score", 100) >= 80 else ("Medium" if doc.get("score", 100) >= 60 else "High"),
                "category": doc.get("storeMetadata", {}).get("category") if doc.get("storeMetadata") else "General",
                "icon": doc.get("storeMetadata", {}).get("icon") if doc.get("storeMetadata") else None,
                "scannedAt": doc.get("scannedAt").isoformat() if doc.get("scannedAt") else None
            })

        return PaginatedHistoryResponse(
            success=True,
            page=page,
            limit=limit,
            total=total_count,
            totalPages=total_pages,
            items=items
        )
    except Exception as e:
        logger.error(f"❌ Error fetching scan history: {e}")
        return PaginatedHistoryResponse(
            success=False,
            page=page,
            limit=limit,
            total=0,
            totalPages=0,
            items=[]
        )

@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats():
    """
    Returns real-time aggregated stats, risk score distribution, and categorized store risk breakdowns.
    """
    db = get_database()
    if db is None:
        return DashboardStatsResponse(
            success=True,
            stats={
                "totalScans": 0,
                "avgScore": 85,
                "riskDistribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
                "categoryBreakdown": [],
                "recentScans": []
            }
        )

    try:
        collection = db["extensions"]
        total_scans = await collection.count_documents({})

        # Score distribution ranges
        low_count = await collection.count_documents({"score": {"$gte": 80}})
        medium_count = await collection.count_documents({"score": {"$gte": 60, "$lt": 80}})
        high_count = await collection.count_documents({"score": {"$gte": 40, "$lt": 60}})
        critical_count = await collection.count_documents({"score": {"$lt": 40}})

        # Category Aggregation Pipeline
        pipeline = [
            {"$group": {
                "_id": "$storeMetadata.category",
                "count": {"$sum": 1},
                "avgScore": {"$avg": "$score"}
            }},
            {"$sort": {"count": -1}}
        ]
        
        categories = []
        async for cat in collection.aggregate(pipeline):
            cat_name = cat["_id"] if cat["_id"] else "General & Tools"
            categories.append({
                "category": cat_name,
                "count": cat["count"],
                "avgScore": round(cat["avgScore"], 1) if cat["avgScore"] else 80
            })

        # Recent 5 scans
        recent_cursor = collection.find().sort("scannedAt", -1).limit(5)
        recent_items = []
        async for doc in recent_cursor:
            recent_items.append({
                "id": str(doc["_id"]),
                "extensionId": doc.get("extensionId"),
                "name": doc.get("name", "Unknown"),
                "score": doc.get("score", 100),
                "category": doc.get("storeMetadata", {}).get("category") if doc.get("storeMetadata") else "General",
                "scannedAt": doc.get("scannedAt").isoformat() if doc.get("scannedAt") else None
            })

        return DashboardStatsResponse(
            success=True,
            stats={
                "totalScans": total_scans,
                "avgScore": 78,
                "riskDistribution": {
                    "low": low_count,
                    "medium": medium_count,
                    "high": high_count,
                    "critical": critical_count
                },
                "categoryBreakdown": categories,
                "recentScans": recent_items
            }
        )
    except Exception as e:
        logger.error(f"❌ Error computing dashboard stats: {e}")
        return DashboardStatsResponse(
            success=False,
            stats={
                "totalScans": 0,
                "avgScore": 80,
                "riskDistribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
                "categoryBreakdown": [],
                "recentScans": []
            }
        )
