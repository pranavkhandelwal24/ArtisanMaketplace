import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const tools = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description: "Searches the marketplace's product database based on a user's query about what they are looking for.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "A detailed search query describing the product. e.g., 'handcrafted ceramic mug', 'blue silk scarf', 'wooden gift'."
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

// This function now safely searches the database
async function searchProducts(query: string) {
    console.log(`AI is searching for products with query: "${query}"`);
    const productsRef = db.collection('products');
    const snapshot = await productsRef.where('isVerified', '==', true).get();
    
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const lowerCaseQuery = query.toLowerCase();
    
    // THE FIX: Safely check for the existence of each property before calling toLowerCase()
    const results = allProducts.filter(product => 
        (product.name || '').toLowerCase().includes(lowerCaseQuery) ||
        (product.description || '').toLowerCase().includes(lowerCaseQuery) ||
        (product.category || '').toLowerCase().includes(lowerCaseQuery)
    );
    
    console.log(`Found ${results.length} products.`);
    return { products: results.slice(0, 3) };
}


export async function POST(request: Request) {
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    return NextResponse.json({ error: "Server configuration error: Missing API Key." }, { status: 500 });
  }

  const { messages } = await request.json();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest", tools });
    
    const systemInstruction = `You are a friendly, expert shopping assistant for 'Artisan Haven', an e-commerce marketplace for unique handcrafted goods. Your primary goal is to help users discover products they will love.

    Here are your instructions:
    1.  Engage the user in a natural, conversational manner.
    2.  Use the 'searchProducts' tool whenever a user asks to find an item.
    3.  If the 'searchProducts' tool returns a list of products, your text response should present them to the user.
    4.  **CRITICAL RULE: If the 'searchProducts' tool returns an empty list, you MUST ask a clarifying question to help the user. Your text response should also include a few helpful, clickable suggestions.**
    5.  Your entire response to the user must be a single, valid JSON object.
    6.  If you are asking a clarifying question, the format is: {"reply": "Your conversational question here...", "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]}.
    7.  If you are just having a normal conversation or presenting products, return a JSON object with an empty suggestions array like this: {"reply": "Your normal text here...", "suggestions": []}.
    8.  Do not answer questions unrelated to shopping on Artisan Haven.`;

    const history = messages.map((msg: { role: 'user' | 'assistant', content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    })).slice(0, -1);
    
    if (history.length > 0 && history[0].role === 'model') {
        history.shift();
    }

    const chat = model.startChat({ 
        history,
        systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }
    });
    
    const userMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(userMessage);
    const call = result.response.functionCalls()?.[0];

    const parseAIResponse = (responseText: string) => {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("Could not find a valid JSON object in the AI response:", responseText);
            return { reply: "I'm sorry, I had a little trouble formatting my thoughts. Could you try rephrasing that?", suggestions: [] };
        }
        return JSON.parse(jsonMatch[0]);
    };

    if (call?.name === 'searchProducts') {
        const { products } = await searchProducts(call.args.query);

        const result2 = await chat.sendMessage([
            { functionResponse: { name: 'searchProducts', response: { products } } },
        ]);
        const responseText = result2.response.text();
        const responseJson = parseAIResponse(responseText);
        return NextResponse.json({ ...responseJson, products });
    }

    const responseText = result.response.text();
    const responseJson = parseAIResponse(responseText);
    return NextResponse.json(responseJson);
    
  } catch (error) {
    console.error("Error with Conversational AI Assistant:", error);
    return NextResponse.json({ error: "Failed to get a response from the AI." }, { status: 500 });
  }
}

