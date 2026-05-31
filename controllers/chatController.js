const handleChat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: 'Please provide a message.' });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json({
        reply: "I'm the AutoServe AI Assistant! My AI brain is not configured yet. Please add a GROQ_API_KEY to the .env file and restart the server. Get a free key at console.groq.com."
      });
    }

    const systemInstruction = `You are the AutoServe AI Assistant, a helpful and knowledgeable customer service chatbot for AutoServe, an Egyptian car service center in Cairo. You help customers with: booking services, understanding car maintenance (oil changes, brake checks, tyre rotation, coolant flush, etc.), mileage packages (10k, 20k, 30k up to 100k km services), detailing, repairs, and pricing. Always be concise, friendly, and helpful. Do not use markdown headers or bullet points heavily. Keep answers short and practical. If someone asks about pricing, tell them prices depend on their car model and to check the booking page.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user',   content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error('Groq API Error:', data.error);
      const msg = data.error.message || '';
      if (msg.includes('Invalid API Key') || msg.includes('auth')) {
        return res.status(200).json({ reply: '⚠️ The API key is invalid. Please check your GROQ_API_KEY in the .env file.' });
      }
      if (data.error.code === 'rate_limit_exceeded') {
        return res.status(200).json({ reply: '⚠️ The AI is temporarily busy. Please wait a moment and try again.' });
      }
      return res.status(200).json({ reply: 'Sorry, the AI encountered an error. Please try again.' });
    }

    const replyText = data.choices?.[0]?.message?.content || "I'm not sure how to respond to that.";
    res.status(200).json({ reply: replyText });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ reply: 'An error occurred. Please try again.' });
  }
};

module.exports = { handleChat };
