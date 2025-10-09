import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server configuration error: Missing API Key." },
      { status: 500 }
    );
  }

  const { messages, imageData } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    // Use a multimodal model that can understand text and images
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    // The system instruction defines the AI's personality
    const systemInstruction = "You are a friendly and helpful shopping assistant for 'Artisan Haven', an e-commerce marketplace for unique handcrafted goods. Your knowledge is limited to the products and artisans on this platform. Be polite, enthusiastic, and help users find products, get gift ideas, and learn about the artisans. If a user provides an image, analyze it and try to find similar products. Do not answer questions unrelated to the marketplace.";

    const lastUserMessage = messages[messages.length - 1];
    
    // Build the prompt for the AI, including the image if it exists
    const promptParts: (string | Part)[] = [
      systemInstruction,
      ...messages.slice(0, -1).map((msg: { content: string }) => msg.content), // Add previous context
      lastUserMessage.content
    ];

    if (imageData) {
      promptParts.push({
        inlineData: {
          mimeType: 'image/jpeg', // Assuming jpeg, can be adapted
          data: imageData,
        },
      });
    }

    const result = await model.generateContent(promptParts);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
    
  } catch (error) {
    console.error("Error calling Gemini API for multimodal chat:", error);
    return NextResponse.json(
      { error: "Failed to get a response from the AI assistant." },
      { status: 500 }
    );
  }
}

