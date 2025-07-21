// pages/api/summarize.ts

import { Configuration, OpenAIApi } from "openai";
import type { NextApiRequest, NextApiResponse } from "next";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing 'text' in request body" });
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Summarize this government tender in Spanish and English for WhatsApp. Include title, deadline, and value if mentioned.",
        },
        { role: "user", content: text },
      ],
    });

    const summary = response.data.choices[0].message.content;
    return res.status(200).json({ summary });
  } catch (error: any) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to summarize text" });
  }
}
