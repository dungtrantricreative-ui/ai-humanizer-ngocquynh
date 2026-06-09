import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
    MODEL_NAME = "nvidia/nemotron-3-ultra-550b-a55b:free"
    TEMPERATURE = 0.7
    
settings = Settings()
