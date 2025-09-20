import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// --- Define the "Tool" the AI can use (with updated schema syntax) ---
const tools = [
  {
    functionDeclarations: [
      {
        name: "searchProducts",
        description: "Searches the marketplace's product database based on a user's query about what they are looking for. Returns a list of products that match the query.",
        parameters: {
          type: "OBJECT",
          properties: {
            query: {
              type: "STRING",
              description: "A detailed search query describing the product the user is looking for. For example: 'handcrafted ceramic mug', 'blue silk scarf', 'wooden gift for a wedding'."
            },
          },
          required: ["query"],
        },
      },
    ],
  },
];

// --- The actual function that searches the database ---
async function searchProducts(query: string) {
    console.log(`AI is searching for products with query: "${query}"`);
    const productsRef = db.collection('products');
    const snapshot = await productsRef.where('isVerified', '==', true).get();
    
    const allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const lowerCaseQuery = query.toLowerCase();
    const results = allProducts.filter(product => 
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        product.description.toLowerCase().includes(lowerCaseQuery) ||
        product.category?.toLowerCase().includes(lowerCaseQuery)
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

    const history = messages.map((msg: { role: 'user' | 'assistant', content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
    })).slice(0, -1);

    // THE FIX: Ensure the history sent to the AI starts with a 'user' message.
    // This removes the initial assistant greeting from the history payload.
    if (history.length > 0 && history[0].role === 'model') {
        history.shift(); // Removes the first element (the assistant's greeting)
    }

    const chat = model.startChat({ history });
    
    const userMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(userMessage);
    const call = result.response.functionCalls()?.[0];

    if (call?.name === 'searchProducts') {
        const { products } = await searchProducts(call.args.query);

        const result2 = await chat.sendMessage([
            {
                functionResponse: {
                    name: 'searchProducts',
                    response: { products },
                },
            },
        ]);
        const responseText = result2.response.text();
        return NextResponse.json({ reply: responseText, products });
    }

    const responseText = result.response.text();
    return NextResponse.json({ reply: responseText });
    
  } catch (error) {
    console.error("Error with Conversational AI Assistant:", error);
    return NextResponse.json({ error: "Failed to get a response from the AI." }, { status: 500 });
  }
}

