import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Server configuration error: Missing API Key." }, { status: 500 });
  }

  const { productName, productDescription } = await request.json();

  if (!productName || !productDescription) {
    return NextResponse.json({ error: "Product name and description are required." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // THE FIX: Use the Gemini model which works with our API key
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `Generate a single, professional, high-quality lifestyle photograph for an e-commerce marketplace. The product is a handcrafted item. Do not include any text or logos in the image.
    Product Name: "${productName}"
    Description: "${productDescription}"
    The image should be well-lit, visually appealing, and show the product in a realistic, attractive setting with a clean, minimalist aesthetic. For example, if it's pottery, place it on a rustic wooden table. If it's jewelry, place it on a soft fabric.`;
    
    // Generate the image from the text prompt
    const result = await model.generateContent([prompt]);
    
    const response = await result.response;
    // THE FIX: Correctly access the image data from the Gemini response
    const imageParts = response.candidates?.[0]?.content?.parts.filter(part => part.inlineData) as Part[];
    
    if (!imageParts || imageParts.length === 0 || !imageParts[0].inlineData?.data) {
        console.error("No image data found in Gemini response:", response.text());
        throw new Error("The AI failed to generate a valid image. Please try again.");
    }
    
    const imageBase64 = imageParts[0].inlineData.data;

    return NextResponse.json({
      imageData: `data:image/png;base64,${imageBase64}`,
    });
    
  } catch (error) {
    console.error("Error calling Gemini API for image generation:", error);
    return NextResponse.json(
      { error: "Failed to generate AI image." },
      { status: 500 }
    );
  }
}

