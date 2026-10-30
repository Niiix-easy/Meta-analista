import express from 'express';
import { ViteDevServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint for AI-powered insights
app.post('/api/insights', async (req, res) => {
  try {
    const { campaignData } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Analyze these campaign data: ${JSON.stringify(campaignData)}. Provide insights on how to improve ROAS.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          }
        }
      }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Endpoint for Simulation
app.post('/api/simulate', async (req, res) => {
  try {
    const { campaignId, newBudget } = req.body;
    // Simulate prediction based on logic
    res.json({ predictedROAS: (Math.random() * 2 + 3).toFixed(2), newBudget });
  } catch (error) {
    res.status(500).json({ error: 'Simulation failed' });
  }
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist'));
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
