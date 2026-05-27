from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"

ALLOWED_EXT = {".md", ".markdown", ".html", ".htm", ".txt"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

app = FastAPI(title="MD/HTML Preview", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ping")
def ping():
    return {"message": "pong"}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {suffix}")

    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="file too large (max 5 MB)")

    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        text = data.decode("utf-8", errors="replace")

    mode = "html" if suffix in {".html", ".htm"} else "md"
    return {"name": file.filename, "mode": mode, "size": len(data), "content": text}


if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        target = DIST_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST_DIR / "index.html")
