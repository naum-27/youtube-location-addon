export default async function handler(req, res) {
    // CORS Configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', 'https://www.youtube.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, description } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }

    const apiKey = process.env.AI_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'AI_KEY not configured' });
    }

    const prompt = `Analyze this YouTube video info and return ONLY a JSON object with keys "city", "country", and "confidence_score". Title: ${title} Description: ${description || ''}`;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }],
                        },
                    ],
                    generationConfig: {
                        response_mime_type: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return res.status(response.status).json({ error: 'AI request failed', details: errorData });
        }

        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            return res.status(500).json({ error: 'Invalid response from AI' });
        }

        // Parse the JSON string from Gemini
        const resultJson = JSON.parse(resultText);
        return res.status(200).json(resultJson);
    } catch (error) {
        console.error('Error in /api/guess:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
