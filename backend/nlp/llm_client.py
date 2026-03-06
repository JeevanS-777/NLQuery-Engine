import os
import openai
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

class LLMClient:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL")
        # Start with what's in .env, but allow override
        self.model = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")
        self.client = None

        if self.api_key:
            self.client = openai.OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
            # DYNAMIC RESOLUTION: Check if model works, if not, find one.
            self.ensure_valid_model()
        else:
            print("WARNING: No API Key found.")

    def ensure_valid_model(self):
        """
        Queries the provider for available models and updates self.model
        if the configured one is missing or deprecated.
        """
        try:
            # 1. Fetch list of available models from Groq
            available_models = self.client.models.list()
            valid_ids = [m.id for m in available_models.data]

            # 2. Check if our configured model exists
            if self.model in valid_ids:
                print(f"✅ Model confirmed: {self.model}")
                return

            # 3. Smart Fallback: Find the first "llama" & "8b" model
            print(f"⚠️ Model '{self.model}' not found. Auto-selecting best alternative...")
            for m_id in valid_ids:
                if "llama" in m_id.lower() and "8b" in m_id.lower():
                    self.model = m_id
                    print(f"🔄 Switched to: {self.model}")
                    return

            # 4. Desperation Fallback: Just take the first one
            self.model = valid_ids[0]
            print(f"⚠️ Switched to generic fallback: {self.model}")

        except Exception as e:
            print(f"Model Discovery Failed: {e}. using default.")

    def generate_response(self, prompt: str, system_role: str = "You are a helpful assistant.", history: list = None) -> str:
        if not self.client:
            return "MOCK RESPONSE: No API Key set."

        # ARCHITECTURAL CHANGE: Build the message array with history
        messages = [{"role": "system", "content": system_role}]

        if history:
            # We append the history safely
            messages.extend(history)

        messages.append({"role": "user", "content": prompt})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0, # Keep it deterministic for SQL
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"ERROR: AI Service failed. ({str(e)})"

llm_client = LLMClient()
