import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_API_BASE = "https://generativelanguage.googleapis.com/v1beta/openai"
    MODEL_NAME = "gemma-4-26b-a4b-it"
    TEMPERATURE = 0.7

    
settings = Settings()
