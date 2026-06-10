import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_API_BASE = "https://openrouter-api.dungtrantricreative.workers.dev"
    MODEL_NAME = "nex-agi/nex-n2-pro:free"
    TEMPERATURE = 0.7

    
settings = Settings()
