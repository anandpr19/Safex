import logging
from fastapi import APIRouter, Query
from app.api.schemas import PaginatedHistoryResponse, DashboardStatsResponse
from app.db.database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()

def resolve_category(doc: dict) -> str:
    """
    Dynamically determines an extension's category.
    If storeMetadata.category is missing or null, falls back to root category or manifest inspection.
    """
    store_cat = doc.get("storeMetadata", {}).get("category") if isinstance(doc.get("storeMetadata"), dict) else None
    if store_cat and str(store_cat).strip() and str(store_cat).strip().lower() not in ["none", "null"]:
        return str(store_cat).strip()

    root_cat = doc.get("category")
    if root_cat and str(root_cat).strip() and str(root_cat).strip().lower() not in ["none", "null"]:
        return str(root_cat).strip()

    manifest = doc.get("manifest") or {}
    perms = set(manifest.get("permissions", []) + manifest.get("optional_permissions", []))
    name = (doc.get("name") or "").lower()
    ext_id = (doc.get("extensionId") or "").lower()

    if any(p in perms for p in ["webRequest", "webRequestBlocking", "debugger", "proxy", "cookies"]):
        return "Security & Privacy"
    elif any(p in perms for p in ["activeTab", "scripting", "devtools", "management"]):
        return "Developer Tools"
    elif any(k in name or k in ext_id for k in ["translate", "note", "pdf", "word", "office", "mail", "gmail", "docs"]):
        return "Productivity"
    elif any(k in name or k in ext_id for k in ["deal", "coupon", "amazon", "cart", "shop", "price", "honey"]):
        return "Shopping & Deals"
    elif any(k in name or k in ext_id for k in ["chat", "social", "twitter", "whatsapp", "meet", "zoom"]):
        return "Social & Communication"

    return "General & Utilities"


@router.get("/history", response_model=PaginatedHistoryResponse)
async def get_scan_history(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    category: str | None = Query(None, description="Filter history by Web Store category"),
    search: str | None = Query(None, description="Search by name or extension ID")
):
    """
    Returns paginated scan history log from MongoDB with smart category filtering and keyword search.
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
        collection = db["extensions"]
        selected_cat = category.strip() if category and category.strip() else "All"
        search_q = search.strip().lower() if search and search.strip() else ""

        # Fetch all matching candidate docs from MongoDB
        cursor = collection.find(
            {},
            {
                "extensionId": 1,
                "name": 1,
                "version": 1,
                "score": 1,
                "findings": 1,
                "manifest": 1,
                "category": 1,
                "storeMetadata": 1,
                "aiAnalysis": 1,
                "scannedAt": 1
            }
        ).sort("scannedAt", -1)

        all_matching_items = []
        async for doc in cursor:
            doc_cat = resolve_category(doc)
            ext_name = doc.get("name", "Unknown Extension")
            ext_id = doc.get("extensionId", "")

            # Apply category filter
            if selected_cat != "All" and doc_cat.lower() != selected_cat.lower():
                continue

            # Apply search filter
            if search_q and not (
                search_q in ext_name.lower() or
                search_q in ext_id.lower() or
                search_q in doc_cat.lower()
            ):
                continue

            all_matching_items.append({
                "id": str(doc["_id"]),
                "extensionId": ext_id,
                "name": ext_name,
                "version": doc.get("version", "1.0.0"),
                "score": doc.get("score", 100),
                "riskLevel": "Low" if doc.get("score", 100) >= 80 else ("Medium" if doc.get("score", 100) >= 60 else "High"),
                "category": doc_cat,
                "icon": doc.get("storeMetadata", {}).get("icon") if isinstance(doc.get("storeMetadata"), dict) else None,
                "scannedAt": doc.get("scannedAt").isoformat() if doc.get("scannedAt") else None
            })

        total_count = len(all_matching_items)
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0
        skip = (page - 1) * limit
        paginated_items = all_matching_items[skip : skip + limit]

        return PaginatedHistoryResponse(
            success=True,
            page=page,
            limit=limit,
            total=total_count,
            totalPages=total_pages,
            items=paginated_items
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
                "avgScore": 100,
                "riskDistribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
                "categoryBreakdown": [],
                "recentScans": []
            }
        )

    try:
        collection = db["extensions"]
        total_scans = await collection.count_documents({})

        # Overall average score
        avg_score_cursor = collection.aggregate([{"$group": {"_id": None, "avg": {"$avg": "$score"}}}])
        avg_score_list = await avg_score_cursor.to_list(1)
        avg_score = round(avg_score_list[0]["avg"]) if avg_score_list and avg_score_list[0].get("avg") is not None else 100

        # Score distribution ranges
        low_count = await collection.count_documents({"score": {"$gte": 80}})
        medium_count = await collection.count_documents({"score": {"$gte": 60, "$lt": 80}})
        high_count = await collection.count_documents({"score": {"$gte": 40, "$lt": 60}})
        critical_count = await collection.count_documents({"score": {"$lt": 40}})

        # Compute dynamic category breakdown with intelligent category resolution
        cat_map = {}
        async for doc in collection.find({}, {"storeMetadata": 1, "category": 1, "manifest": 1, "name": 1, "extensionId": 1, "score": 1}):
            cat = resolve_category(doc)
            score = doc.get("score", 100)
            if cat not in cat_map:
                cat_map[cat] = {"count": 0, "totalScore": 0}
            cat_map[cat]["count"] += 1
            cat_map[cat]["totalScore"] += score

        categories = []
        for cat_name, data in cat_map.items():
            categories.append({
                "category": cat_name,
                "count": data["count"],
                "avgScore": round(data["totalScore"] / data["count"], 1) if data["count"] > 0 else 80
            })
        categories.sort(key=lambda x: x["count"], reverse=True)

        # Recent 5 scans
        recent_cursor = collection.find().sort("scannedAt", -1).limit(5)
        recent_items = []
        async for doc in recent_cursor:
            recent_items.append({
                "id": str(doc["_id"]),
                "extensionId": doc.get("extensionId"),
                "name": doc.get("name", "Unknown"),
                "score": doc.get("score", 100),
                "category": resolve_category(doc),
                "scannedAt": doc.get("scannedAt").isoformat() if doc.get("scannedAt") else None
            })

        return DashboardStatsResponse(
            success=True,
            stats={
                "totalScans": total_scans,
                "avgScore": avg_score,
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
                "avgScore": 100,
                "riskDistribution": {"low": 0, "medium": 0, "high": 0, "critical": 0},
                "categoryBreakdown": [],
                "recentScans": []
            }
        )
