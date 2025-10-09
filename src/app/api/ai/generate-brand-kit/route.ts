import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  const { brandName, brandDescription } = await request.json();

  if (!brandName || !brandDescription) {
    return NextResponse.json(
      { error: "Brand name and description are required." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    // IMPORTANT: Use a model that supports JSON output
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert brand strategist for a marketplace of handcrafted goods.
      Based on the following artisan brand information, generate a complete brand kit.
      
      Brand Name: "${brandName}"
      Brand Description: "${brandDescription}"

      Your response MUST be in a valid JSON format. Do not include any text outside of the JSON structure.
      The JSON object should have the following structure:
      {
        "missionStatement": "A short, inspiring mission statement (1-2 sentences).",
        "tagline": "A catchy and memorable tagline.",
        "colorPalette": [
          { "name": "Primary", "hex": "#RRGGBB" },
          { "name": "Secondary", "hex": "#RRGGBB" },
          { "name": "Accent", "hex": "#RRGGBB" },
          { "name": "Neutral", "hex": "#RRGGBB" }
        ],
        "fontPairing": {
          "headline": { "name": "Name of a Google Font for headlines", "weight": "e.g., 600" },
          "body": { "name": "Name of a Google Font for body text", "weight": "e.g., 400" }
        },
        "logoIdeas": [
          "A simple, text-based logo concept.",
          "Another creative, descriptive logo idea."
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up the response to ensure it's valid JSON
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse the JSON string into an object
    const brandKit = JSON.parse(jsonString);

    return NextResponse.json(brandKit);
    
  } catch (error) {
    console.error("Error calling Gemini API for brand kit:", error);
    return NextResponse.json(
      { error: "Failed to generate AI brand kit." },
      { status: 500 }
    );
  }
}
