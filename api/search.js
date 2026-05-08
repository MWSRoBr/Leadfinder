export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { apiKey, prompt } = req.body;
    if (!apiKey || !prompt) return res.status(400).json({ error: 'Missing apiKey or prompt' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();

    // Extract all text blocks and return as debug info
    const textBlocks = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text);

    const allText = textBlocks.join('\n');

    return res.status(200).json({
      ...data,
      _debug: {
        stopReason: data.stop_reason,
        blockTypes: (data.content || []).map(b => b.type),
        textBlockCount: textBlocks.length,
        rawText: allText,
        rawTextLength: allText.length
      }
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
