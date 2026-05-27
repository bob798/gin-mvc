# MD / HTML 在线预览(PC 端)

Python (FastAPI) 后端 + Vue 3 + Vite 前端的本地预览工具。支持 `.md` / `.html` 文件的实时双栏预览。

## 目录

```
backend/        FastAPI 服务(静态托管 + 文件上传接口)
frontend/       Vue 3 + Vite 前端
```

## 功能

- 📂 打开本地文件 / 拖拽文件到窗口
- 🔀 编辑 / 预览 / 分栏三种视图,分栏支持鼠标拖拽调宽
- 🎨 GitHub 风格 Markdown 渲染 + `highlight.js` 代码高亮
- 🛡 HTML 在沙箱 `iframe` 中预览,Markdown 用 DOMPurify 过滤
- ⬇ 导出渲染结果为完整 HTML / 打印或另存为 PDF
- 🌙 暗 / 亮主题切换

## 运行

### 1) 启动后端

```bash
cd backend
python -m venv .venv
source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2) 启动前端(开发模式)

```bash
cd frontend
npm install
npm run dev
```

打开 http://localhost:5173 即可使用。Vite 已配置将 `/api/*` 代理到 `http://127.0.0.1:8000`。

### 3) 生产构建(单端口部署)

```bash
cd frontend && npm run build      # 产物输出到 frontend/dist
cd ../backend && uvicorn main:app --port 8000
```

FastAPI 会自动挂载 `frontend/dist`,访问 http://localhost:8000 即为完整站点。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/ping` | 健康检查 |
| POST | `/api/upload` | 上传 `.md` / `.html` / `.txt`,返回文本内容(≤ 5 MB) |
