import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, context } = await req.json();
    
    let systemInstruction = "Você é um assistente especialista em Meta Ads. ";
    
    if (type === 'summary') {
      systemInstruction += "Gere um resumo executivo semanal conciso e profissional em português. ";
      systemInstruction += "Analise os dados fornecidos e destaque os pontos positivos, oportunidades de melhoria e recomendações de orçamento. ";
      systemInstruction += "Use Markdown para formatar o texto.";
    } else {
      systemInstruction += "Responda as perguntas do usuário sobre sua performance no dashboard. ";
      systemInstruction += "Seja direto, técnico e use o contexto dos dados atuais quando relevante. ";
      systemInstruction += "Responda em português.";
    }

    const fullPrompt = `Contexto do Dashboard: ${JSON.stringify(context)}\n\nUsuário: ${prompt}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
      },
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
