import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  // We will pass more data like views and sales in the future
  const { name, description, price } = await request.json();

  if (!name || !description || !price) {
    return NextResponse.json(
      { error: "Product name, description, and price are required." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      You are an expert e-commerce consultant for a marketplace that sells unique, handcrafted goods.
      An artisan needs advice on how to improve one of their product listings.
      
      Product Name: "${name}"
      Product Price: ₹${price}
      Product Description: "${description}"
      Current Performance: 0 sales, 0 views (new product)

      Your task is to provide a concise, actionable analysis in three specific areas:
      1.  **Pricing Strategy:** Is the price appropriate? Suggest a potential price range and justify it.
      2.  **Description Enhancement:** Provide one concrete suggestion to make the description more compelling and emotionally resonant.
      3.  **Marketing Tip:** Offer one simple, creative marketing idea an artisan can use on social media to promote this specific product.

      Your response MUST be in a valid JSON format. Do not include any text, titles, or markdown outside of the JSON structure.
      The JSON object should have the following structure:
      {
        "pricingAnalysis": "Your analysis and price range suggestion here.",
        "descriptionSuggestion": "Your specific suggestion for improving the description here.",
        "marketingIdea": "Your creative marketing tip here."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const analysis = JSON.parse(jsonString);

    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error("Error calling Gemini API for product analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate AI analysis." },
      { status: 500 }
    );
  }
}
