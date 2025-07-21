// api/summarize.ts

import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" field in request body' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: `Resume este texto en español en un párrafo claro y conciso: ${text}`,
        },
      ],
    });

    const summary = completion.choices[0]?.message?.content || '';

    return res.status(200).json({ summary });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
