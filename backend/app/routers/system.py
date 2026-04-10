from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter(tags=["system"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/version")
async def version():
    return {"version": get_settings().app_version}


@router.get("/status")
async def status():
    return {"status": "ok", "env": get_settings().app_env}
