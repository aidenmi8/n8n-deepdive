const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: text }],
    });
    res.status(200).json({ summary: resp.choices[0].message.content });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to summarize" });
  }
};
