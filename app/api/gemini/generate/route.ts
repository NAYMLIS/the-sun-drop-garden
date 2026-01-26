import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { city, venue } = await request.json();

    if (!(city && venue)) {
      return NextResponse.json(
        { error: "City and venue are required" },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            description: { type: SchemaType.STRING },
            lat: { type: SchemaType.NUMBER },
            lng: { type: SchemaType.NUMBER },
          },
          required: ["description", "lat", "lng"],
        },
      },
    });

    const prompt = `Generate data for a music concert taking place in ${city} at ${venue}.
    1. Write a very short, poetic, and ethereal one-sentence description (max 20 words). The artist's vibe is "Sundrop Garden" - organic, light, nature, dreams.
    2. Provide the approximate latitude and longitude coordinates for ${city}.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error("No response from Gemini");
    }

    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Gemini generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate tour info" },
      { status: 500 }
    );
  }
}
