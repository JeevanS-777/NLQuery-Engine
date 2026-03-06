from backend.nlp.llm_client import llm_client

print("Testing LLM Connection...")
response = llm_client.generate_response("Say 'System Operational' if you can hear me.")
print(f"Response: {response}")