import logging
import asyncio
from typing import Dict

from src.nemotron_client import NemotronClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HumanizationPipeline:
    def __init__(self):
        self.nemotron_client = NemotronClient()
        self.translation_languages = {
            "vi": "Vietnamese",
            "en": "English",
            "zh": "Chinese",
            "ja": "Japanese"
        }

    async def _rewrite_text(self, text: str, language: str, attempt: int = 1) -> str:
        prompt = f"Rewrite the following {language} text to make it sound more human, natural, and less like AI-generated content. Focus on varied sentence structure, idiomatic expressions, and a conversational tone. Ensure it would pass AI detection. Text: {text}"
        try:
            logger.info(f"Attempt {attempt} for Nemotron rewrite in {language}...")
            rewritten_text = await self.nemotron_client.generate_text(prompt)
            logger.info(f"Nemotron rewrite {attempt} successful.")
            return rewritten_text
        except Exception as e:
            logger.error(f"Nemotron rewrite attempt {attempt} failed: {e}")
            if attempt < 3:  # Retry up to 3 times
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
                return await self._rewrite_text(text, language, attempt + 1)
            raise

    async def _translate_hop(self, text: str, source_lang_code: str, target_lang_code: str, attempt: int = 1) -> str:
        source_lang_name = self.translation_languages.get(source_lang_code, source_lang_code)
        target_lang_name = self.translation_languages.get(target_lang_code, target_lang_code)

        # Translate to target language
        prompt_to_target = f"Translate the following {source_lang_name} text to {target_lang_name}. Text: {text}"
        try:
            logger.info(f"Attempt {attempt} for translating from {source_lang_name} to {target_lang_name}...")
            translated_to_target = await self.nemotron_client.generate_text(prompt_to_target)
            logger.info(f"Translation to {target_lang_name} successful.")
        except Exception as e:
            logger.error(f"Translation to {target_lang_name} attempt {attempt} failed: {e}")
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)
                return await self._translate_hop(text, source_lang_code, target_lang_code, attempt + 1)
            raise

        # Translate back to source language
        prompt_back_to_source = f"Translate the following {target_lang_name} text back to {source_lang_name}. Text: {translated_to_target}"
        try:
            logger.info(f"Attempt {attempt} for translating back to {source_lang_name}...")
            translated_back_to_source = await self.nemotron_client.generate_text(prompt_back_to_source)
            logger.info(f"Translation back to {source_lang_name} successful.")
            return translated_back_to_source
        except Exception as e:
            logger.error(f"Translation back to {source_lang_name} attempt {attempt} failed: {e}")
            if attempt < 3:
                await asyncio.sleep(2 ** attempt)
                return await self._translate_hop(text, source_lang_code, target_lang_code, attempt + 1)
            raise

    async def humanize_text(self, text: str, language: str) -> str:
        logger.info(f"Starting humanization pipeline for {language} text.")
        processed_text = text

        # Step 1: Nemotron rewrite #1
        processed_text = await self._rewrite_text(processed_text, language)
        logger.info("Step 1 (Nemotron rewrite #1) completed.")

        # Step 2: Nemotron rewrite #2
        processed_text = await self._rewrite_text(processed_text, language)
        logger.info("Step 2 (Nemotron rewrite #2) completed.")

        # Determine a different language for translation hops
        # For simplicity, let's hardcode to English if input is Vietnamese, else Vietnamese
        # In a real scenario, this could be more dynamic or user-selected
        hop_lang1 = "en" if language == "vi" else "vi"
        hop_lang2 = "zh" if language != "zh" else "en" # Use Chinese for second hop if not already Chinese, else English

        # Step 3: Translation hop #1
        processed_text = await self._translate_hop(processed_text, language, hop_lang1)
        logger.info(f"Step 3 (Translation hop #1 via {hop_lang1}) completed.")

        # Step 4: Translation hop #2
        processed_text = await self._translate_hop(processed_text, language, hop_lang2)
        logger.info(f"Step 4 (Translation hop #2 via {hop_lang2}) completed.")

        logger.info("Humanization pipeline completed.")
        return processed_text

if __name__ == "__main__":
    # Example usage (for testing purposes)
    import os
    os.environ["OPENROUTER_API_KEY"] = "sk-YOUR_OPENROUTER_API_KEY" # Replace with your actual key for testing

    async def test_pipeline():
        pipeline = HumanizationPipeline()
        sample_text_en = "The rapid advancement of artificial intelligence has led to significant breakthroughs in various fields, including natural language processing and computer vision. These developments promise to revolutionize industries and improve daily life."
        sample_text_vi = "Sự phát triển nhanh chóng của trí tuệ nhân tạo đã dẫn đến những đột phá đáng kể trong nhiều lĩnh vực, bao gồm xử lý ngôn ngữ tự nhiên và thị giác máy tính. Những phát triển này hứa hẹn sẽ cách mạng hóa các ngành công nghiệp và cải thiện cuộc sống hàng ngày."

        print("\n--- Testing English Text ---")
        try:
            humanized_en = await pipeline.humanize_text(sample_text_en, "en")
            print("Original English:\n", sample_text_en)
            print("Humanized English:\n", humanized_en)
        except Exception as e:
            print(f"Error humanizing English text: {e}")

        print("\n--- Testing Vietnamese Text ---")
        try:
            humanized_vi = await pipeline.humanize_text(sample_text_vi, "vi")
            print("Original Vietnamese:\n", sample_text_vi)
            print("Humanized Vietnamese:\n", humanized_vi)
        except Exception as e:
            print(f"Error humanizing Vietnamese text: {e}")

    asyncio.run(test_pipeline())
