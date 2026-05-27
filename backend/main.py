import secrets
import sqlite3
import string
import time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"
DATA_DIR = BASE_DIR / "backend" / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DATA_DIR / "shares.db"

ALLOWED_EXT = {".md", ".markdown", ".html", ".htm", ".txt"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_SHARE_CHARS = 200_000
CODE_ALPHABET = string.ascii_letters + string.digits
EXPIRY_MAP = {
    "5m": 5 * 60,
    "1h": 3600,
    "1d": 86400,
    "7d": 7 * 86400,
    "30d": 30 * 86400,
    "never": None,
}

app = FastAPI(title="MD/HTML Preview", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS shares (
                code        TEXT PRIMARY KEY,
                mode        TEXT NOT NULL,
                content     TEXT NOT NULL,
                name        TEXT,
                created_at  INTEGER NOT NULL,
                expires_at  INTEGER,
                views       INTEGER NOT NULL DEFAULT 0
            )
            """
        )
        c.commit()


init_db()


def gen_code(n: int = 8) -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(n))


def now_ts() -> int:
    return int(time.time())


def purge_expired():
    with db() as c:
        c.execute(
            "DELETE FROM shares WHERE expires_at IS NOT NULL AND expires_at < ?",
            (now_ts(),),
        )
        c.commit()


class ShareCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=MAX_SHARE_CHARS)
    mode: str
    name: Optional[str] = Field(default=None, max_length=120)
    expiry: str = "7d"


@app.get("/api/ping")
def ping():
    return {"message": "pong"}


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"unsupported file type: {suffix}")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="file too large (max 5 MB)")
    text = data.decode("utf-8", errors="replace")
    mode = "html" if suffix in {".html", ".htm"} else "md"
    return {"name": file.filename, "mode": mode, "size": len(data), "content": text}


@app.post("/api/share")
def create_share(body: ShareCreate):
    if body.mode not in ("md", "html"):
        raise HTTPException(status_code=400, detail="mode must be md or html")
    if body.expiry not in EXPIRY_MAP:
        raise HTTPException(status_code=400, detail="invalid expiry")

    purge_expired()
    created = now_ts()
    ttl = EXPIRY_MAP[body.expiry]
    expires_at = created + ttl if ttl is not None else None

    with db() as c:
        for _ in range(8):
            code = gen_code()
            try:
                c.execute(
                    "INSERT INTO shares(code, mode, content, name, created_at, expires_at) "
                    "VALUES (?, ?, ?, ?, ?, ?)",
                    (code, body.mode, body.content, body.name, created, expires_at),
                )
                c.commit()
                break
            except sqlite3.IntegrityError:
                continue
        else:
            raise HTTPException(status_code=500, detail="could not allocate short code")

    return {"code": code, "expires_at": expires_at, "created_at": created}


@app.get("/api/share/{code}")
def read_share(code: str):
    if not code.isalnum() or len(code) > 32:
        raise HTTPException(status_code=400, detail="bad code")

    with db() as c:
        row = c.execute("SELECT * FROM shares WHERE code = ?", (code,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="not found")
        if row["expires_at"] is not None and row["expires_at"] < now_ts():
            c.execute("DELETE FROM shares WHERE code = ?", (code,))
            c.commit()
            raise HTTPException(status_code=410, detail="expired")
        c.execute("UPDATE shares SET views = views + 1 WHERE code = ?", (code,))
        c.commit()

    return {
        "code": row["code"],
        "mode": row["mode"],
        "content": row["content"],
        "name": row["name"],
        "created_at": row["created_at"],
        "expires_at": row["expires_at"],
        "views": row["views"] + 1,
    }


if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def spa(full_path: str):
        target = DIST_DIR / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(DIST_DIR / "index.html")
