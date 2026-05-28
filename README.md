# md-preview

MD / HTML 在线预览工具。Python(FastAPI)+ Vue 3 + Vite。支持 Markdown / HTML 文件预览,以及短链分享。

## 功能

- 📂 打开本地文件 / 拖拽到窗口
- 🔀 左右双栏实时预览
- 🛡 HTML 在沙箱 `iframe` 中渲染
- 🔗 短链分享(5m / 1h / 1d / 7d / 30d / 永久)
- ⧉ 复制渲染后 HTML / ⬇ 导出 HTML

## 目录

```
backend/   FastAPI + SQLite,提供 /api/share 接口和静态托管
frontend/  Vue 3 + Vite 单页应用
Dockerfile / docker-compose.yml
```

## 上线(推荐方式)

```bash
docker compose up -d --build
# 打开 http://服务器IP:8000
```

SQLite 数据持久化到 `./data/shares.db`。

## 本地开发

```bash
# 后端
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 前端(另开终端)
cd frontend
npm install
npm run dev   # http://localhost:5173,/api 已代理到 8000
```

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET  | `/api/ping`         | 健康检查 |
| POST | `/api/upload`       | 上传文件,返回文本(≤ 5 MB) |
| POST | `/api/share`        | 创建短链 `{ content, mode, expiry }`,返回 `{ code, expires_at }` |
| GET  | `/api/share/{code}` | 取出分享内容,已过期返回 410 |

短码 8 位 alnum;内容上限 200 KB。
