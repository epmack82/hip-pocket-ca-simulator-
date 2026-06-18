export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, userMsg } = req.body;

  if (!systemPrompt || !userMsg) {
    return res.status(400).json({ error: 'Missing systemPrompt or userMsg' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: userMsg }],
        system: systemPrompt
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || 'Claude API error' });
    }

    if (!data.content[0]) {
      return res.status(500).json({ error: 'No response from Claude' });
    }

    const text = data.content[0].text;

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: 'Could not parse AI response' });
    }
  } catch (error) {
    console.error('Error calling Claude:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
