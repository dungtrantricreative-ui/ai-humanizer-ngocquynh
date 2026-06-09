from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from src.api import router as api_router

app = FastAPI(
    title="AI Text Humanizer Chatbot",
    description="A web chatbot to humanize AI-generated text using Nemotron via OpenRouter API."
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include API router
app.include_router(api_router)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    index_html_path = Path("static") / "index.html"
    if not index_html_path.exists():
        return HTMLResponse(content="<h1>Error: index.html not found!</h1>", status_code=404)
    with open(index_html_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

