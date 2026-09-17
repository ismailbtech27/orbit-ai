import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Orbit Agentic AI Layer
 * Analyzes the threat context and recommends an action based on constraints.
 */
export const getAgentRecommendation = async (alertDetails, riskDetails, validActions) => {
  // If API key is not configured, fall back to a mock for safety/testing
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn("[Orbit AI] GEMINI_API_KEY is not set or is invalid. Using mock Agent recommendation.");
    return {
      recommendedAction: riskDetails.level === 'CRITICAL' ? 'BLOCK_ACCOUNT' : 'RESTRICT_ACCOUNT',
      reasoning: "MOCK AGENT: API Key missing. Falling back to default risk-based mapping."
    };
  }

  const prompt = `
    You are the Orbit AI Cybersecurity Agent.
    Your task is to analyze a detected threat and recommend the most appropriate mitigation action.
    
    You MUST choose your recommended action ONLY from the following allowed list:
    ${JSON.stringify(validActions)}
    
    THREAT CONTEXT:
    - Threat Type: ${alertDetails.threatType}
    - Severity: ${alertDetails.severity}
    - Source IP: ${alertDetails.sourceIp}
    - ML Detection Confidence: ${alertDetails.mlConfidence}%
    
    RISK ASSESSMENT:
    - Risk Score: ${riskDetails.score}/100
    - Risk Level: ${riskDetails.level}
    
    INSTRUCTIONS:
    Evaluate the threat and the risk level. Do not hallucinate actions outside of the allowed list.
    Provide your output strictly as a valid JSON object matching the following format exactly, with no additional text or markdown formatting:
    {
      "recommendedAction": "ONE_OF_THE_ALLOWED_ACTIONS",
      "reasoning": "A short, professional explanation of why this action was selected based on the context."
    }
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
        config: {
            temperature: 0.2, // Low temperature for consistent, analytical responses
            responseMimeType: 'application/json' // Enforce JSON response
        }
    });
    
    const responseText = response.text;
    const parsedData = JSON.parse(responseText);
    
    return {
      recommendedAction: parsedData.recommendedAction,
      reasoning: parsedData.reasoning
    };

  } catch (error) {
    console.error("[Orbit AI] Agent Engine Error:", error);
    // Safe fallback if the LLM fails or times out
    return {
      recommendedAction: 'INVESTIGATE',
      reasoning: `AGENT FAILURE: Unable to contact LLM (${error.message}). Defaulting to safe investigation.`
    };
  }
};
