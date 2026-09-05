from fastapi import APIRouter
from .token import router as token_router
from .verify import router as verify_router
from .middleware import validate_csrf

api_router = APIRouter()

api_router.include_router(token_router, prefix="/token", tags=["CSRF"])
api_router.include_router(verify_router, prefix="/verify", tags=["CSRF"])