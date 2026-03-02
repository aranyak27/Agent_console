import OpenAI from "openai";

export function getOpenAiClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "placeholder",
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  });
}
