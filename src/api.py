from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
import logging

from src.pipeline import HumanizationPipeline

router = APIRouter()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

humanization_pipeline = HumanizationPipeline()

class HumanizeRequest(BaseModel):
    text: str
    language: Literal["vi", "en", "zh", "ja"]

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

@router.post("/humanize")
async def humanize_text_endpoint(request: HumanizeRequest):
    try:
        logger.info(f"Received humanize request for language: {request.language}")
        humanized_text = await humanization_pipeline.humanize_text(request.text, request.language)
        return {"humanized_text": humanized_text}
    except Exception as e:
        logger.error(f"Error during humanization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat_endpoint(messages: list[ChatMessage]):
    # This is a placeholder for a more complex chat interface if needed.
    # For now, it can just echo or use Nemotron for a simple response.
    # The main focus is on the /humanize endpoint.
    try:
        last_message = messages[-1].content if messages else ""
        if not last_message:
            raise HTTPException(status_code=400, detail="No message content provided.")
        
        # Example: Use Nemotron to respond to a chat message (simplified)
        # In a real chat, you'd manage conversation history and more complex prompts.
        prompt = f"You are a helpful AI assistant. Respond to the following user message: {last_message}"
        chat_response = await humanization_pipeline.nemotron_client.generate_text(prompt)
        
        return {"reply": chat_response}
    except Exception as e:
        logger.error(f"Error during chat processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))
