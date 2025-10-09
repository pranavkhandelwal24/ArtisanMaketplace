import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  const { name, description, price, views, sales } = await request.json();

  if (!name || !description || !price) {
    return NextResponse.json(
      { error: "Product name, description, and price are required." },
      { status: 400 }
    );
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // THE FIX: The prompt now strictly defines the 'idealCustomerPersona' as an object.
    const prompt = `
      You are an expert e-commerce and brand strategist for 'Artisan Haven'.
      An artisan needs a comprehensive analysis of their product listing.

      Product Name: "${name}"
      Product Price: ₹${price}
      Product Description: "${description}"
      Current Performance: ${sales || 0} sales, ${views || 0} views in the last 30 days.

      Your task is to provide a detailed, actionable analysis.
      Your response MUST be a valid JSON object with the following structure:
      {
        "pricingAnalysis": "Analyze the price. Is it appropriate? Suggest a potential price range and justify it.",
        "descriptionSuggestion": "Provide one concrete suggestion to make the description more compelling.",
        "marketingIdea": "Offer one simple, creative marketing idea for social media.",
        "idealCustomerPersona": {
            "name": "A catchy name for the persona, e.g., 'The Mindful Decorator'",
            "age_range": "e.g., 25-40",
            "interests": "A brief summary of their interests.",
            "values": "What this persona values in a product."
        },
        "seoKeywords": ["keyword 1", "keyword 2", "keyword 3"],
        "photographyTips": "Provide two actionable tips for lifestyle photography for this product."
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI returned an invalid format.");
    }

    const jsonString = jsonMatch[0];
    const analysis = JSON.parse(jsonString);

    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error("Full error object from Google AI:", JSON.stringify(error, null, 2));
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return NextResponse.json(
      { error: `Failed to generate AI analysis: ${errorMessage}` },
      { status: 500 }
    );
  }
}

