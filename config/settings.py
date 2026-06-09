import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_API_BASE = "https://generativelanguage.googleapis.com/v1beta/openai"
    MODEL_NAME = "gemini-flash-lite-latest"
    TEMPERATURE = 0.7

    
settings = Settings()
