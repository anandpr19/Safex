from typing import Any, Optional
from pydantic import BaseModel, Field

class ScanRequest(BaseModel):
    extensionId: Optional[str] = None
    url: Optional[str] = None
    force: Optional[bool] = False

class ExtensionReportResponse(BaseModel):
    success: bool
    cached: bool
    extensionId: str
    name: str
    version: str
    report: dict
    rawData: dict
    storeMetadata: Optional[dict] = None
    aiAnalysis: Optional[dict] = None
    savedToDb: bool
    timestamp: str

class PaginatedHistoryResponse(BaseModel):
    success: bool
    page: int
    limit: int
    total: int
    totalPages: int
    items: list[dict]

class DashboardStatsResponse(BaseModel):
    success: bool
    stats: dict
