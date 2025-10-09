import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  const { story } = await request.json();

  if (!story) {
    return NextResponse.json(
      { error: "Story text is required." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const prompt = `
      You are an expert storyteller and copywriter for an e-commerce marketplace that sells unique, handcrafted goods.
      An artisan has written a story about their personal journey and craft.
      Your task is to rewrite this story to be more emotive, engaging, and professional for an "About the Artisan" page.
      Retain the core message and the artisan's authentic voice, but elevate the language and narrative flow.

      Original Story: "${story}"

      Enhanced Story:`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return NextResponse.json({ enhancedStory: responseText });
    
  } catch (error) {
    console.error("Error calling Gemini API for story enhancement:", error);
    return NextResponse.json(
      { error: "Failed to generate AI-enhanced story." },
      { status: 500 }
    );
  }
}
