import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
                                                            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
                                                                const prompt = `
                                                                      You are an expert e-commerce and brand strategist for 'Artisan Haven', a marketplace for unique, handcrafted goods.
                                                                            An artisan needs a comprehensive analysis of their product listing.

                                                                                  Product Name: "${name}"
                                                                                        Product Price: ₹${price}
                                                                                              Product Description: "${description}"
                                                                                                    Current Performance: ${sales || 0} sales, ${views || 0} views in the last 30 days.

                                                                                                          Your task is to provide a detailed, actionable analysis covering several key areas to help the artisan succeed.
                                                                                                                Your response MUST be in a valid JSON format. Do not include any text, titles, or markdown outside of the JSON structure.
                                                                                                                      The JSON object should have the following structure:
                                                                                                                            {
                                                                                                                                    "pricingAnalysis": "Analyze the price. Is it appropriate? Suggest a potential price range and justify it based on perceived value and craftsmanship.",
                                                                                                                                            "descriptionSuggestion": "Provide one concrete suggestion to make the description more compelling and emotionally resonant. Focus on storytelling.",
                                                                                                                                                    "marketingIdea": "Offer one simple, creative marketing idea an artisan can use on social media to promote this specific product.",
                                                                                                                                                            "idealCustomerPersona": "Generate a brief profile of the ideal customer for this product. Include their interests and what they value in a handcrafted item.",
                                                                                                                                                                    "seoKeywords": [
                                                                                                                                                                              "keyword 1",
                                                                                                                                                                                        "keyword 2",
                                                                                                                                                                                                  "keyword 3",
                                                                                                                                                                                                            "keyword 4",
                                                                                                                                                                                                                      "keyword 5"
                                                                                                                                                                                                                              ],
                                                                                                                                                                                                                                      "photographyTips": "Based on the product description, provide two actionable tips for lifestyle photography. For example, if it's 'rustic pottery', suggest 'photograph it on a dark wood table with natural side lighting'."
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                `;

                                                                                                                                                                                                                                                    const result = await model.generateContent(prompt);
                                                                                                                                                                                                                                                        const responseText = result.response.text();
                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                // A more robust way to extract the JSON from the AI's response.
                                                                                                                                                                                                                                                                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                                                                                                                                                                                                                                                                        if (!jsonMatch) {
                                                                                                                                                                                                                                                                              console.error("Could not find a valid JSON object in the AI response:", responseText);
                                                                                                                                                                                                                                                                                    throw new Error("AI returned an invalid format. Please try again.");
                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                            const jsonString = jsonMatch[0];
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

