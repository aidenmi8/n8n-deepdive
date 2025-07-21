import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).send('Missing "text" in request body');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: text }],
    });

    const summary = completion.choices[0].message.content;
    res.status(200).json({ summary });
  } catch (error: any) {
    console.error('OpenAI error:', error.message);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
}
