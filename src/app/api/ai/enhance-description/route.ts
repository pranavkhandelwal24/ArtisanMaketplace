import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// The function must be named POST to handle POST requests.
export async function POST(request: Request) {
  // Check for the API key first for a better error message
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.error("Missing Google Gemini API Key");
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  const { productName, description } = await request.json();

  if (!productName || !description) {
    return NextResponse.json(
      { error: "Product name and description are required." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    // Use the latest recommended model name to fix the "Not Found" error
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `You are an expert e-commerce copywriter for a marketplace selling handcrafted goods.
    Rewrite the following product description to be more warm, evocative, and appealing to customers.
    Focus on the craftsmanship and unique qualities. Keep it concise (2-3 sentences).

    Product Name: "${productName}"
    Original Description: "${description}"

    Enhanced Description:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ enhancedDescription: text });
    
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return NextResponse.json(
      { error: "Failed to generate AI description." },
      { status: 500 }
    );
  }
}

