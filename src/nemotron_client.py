import httpx
import json
import logging
from typing import List, Dict, Any

from config.settings import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NemotronClient:
    def __init__(self):
        self.api_key = settings.OPENROUTER_API_KEY
        self.api_base = settings.OPENROUTER_API_BASE
        self.model_name = settings.MODEL_NAME
        self.temperature = settings.TEMPERATURE

        if not self.api_key:
            logger.error("OPENROUTER_API_KEY not found in environment variables.")
            raise ValueError("OPENROUTER_API_KEY is not set.")

    async def generate_text(self, prompt: str, max_tokens: int = 1024) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": self.temperature,
            "max_tokens": max_tokens,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(f"{self.api_base}/chat/completions", headers=headers, json=payload, timeout=60.0)
                response.raise_for_status()  # Raise an exception for HTTP errors
                response_data = response.json()
                return response_data["choices"][0]["message"]["content"].strip()
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
                raise
            except httpx.RequestError as e:
                logger.error(f"An error occurred while requesting {e.request.url!r}: {e}")
                raise
            except json.JSONDecodeError:
                logger.error(f"Failed to decode JSON from response: {response.text}")
                raise
            except KeyError:
                logger.error(f"Unexpected response structure: {response_data}")
                raise
            except Exception as e:
                logger.error(f"An unexpected error occurred: {e}")
                raise

if __name__ == "__main__":
    # Example usage (for testing purposes)
    import asyncio

    async def test_nemotron_client():
        client = NemotronClient()
        try:
            # This will likely fail without a real API key set in .env
            response = await client.generate_text("Write a short paragraph about the benefits of AI.")
            print("Generated Text:", response)
        except Exception as e:
            print(f"Error during test: {e}")

    asyncio.run(test_nemotron_client())
