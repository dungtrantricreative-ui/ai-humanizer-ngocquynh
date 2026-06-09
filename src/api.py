from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Literal, AsyncGenerator
import logging
import json

from src.pipeline import HumanizationPipeline

router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

humanization_pipeline = HumanizationPipeline()

# Khai báo cấu trúc dữ liệu gửi lên qua phương thức POST
class HumanizeRequest(BaseModel):
    text: str
    language: Literal["vi", "en", "zh", "ja"]

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

async def event_generator(text: str, language: str) -> AsyncGenerator[str, None]:
    try:
        async for event in humanization_pipeline.humanize_text_stream(text, language):
            yield f"data: {json.dumps(event)}\n\n"
    except Exception as e:
        logger.error(f"Error in event stream: {e}")
        yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

# ĐỔI THÀNH POST để hỗ trợ văn bản dài vô hạn
@router.post("/humanize", response_class=StreamingResponse)
async def humanize_text_stream_endpoint(request: HumanizeRequest):
    logger.info(f"Received streaming humanize request for language: {request.language}")
    
    # CẤU HÌNH QUAN TRỌNG CHO RENDER.COM:
    # 'X-Accel-Buffering': 'no' ngăn chặn proxy giữ lại dữ liệu stream (buffering)
    headers = {
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
    }
    return StreamingResponse(
        event_generator(request.text, request.language), 
        media_type="text/event-stream",
        headers=headers
    )

@router.post("/chat")
async def chat_endpoint(messages: list[ChatMessage]):
    try:
        last_message = messages[-1].content if messages else ""
        if not last_message:
            raise HTTPException(status_code=400, detail="No message content provided.")
        
        prompt = f"You are a helpful AI assistant. Respond to the following user message: {last_message}"
        chat_response = await humanization_pipeline.nemotron_client.generate_text(prompt)
        
        return {"reply": chat_response}
    except Exception as e:
        logger.error(f"Error during chat processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))