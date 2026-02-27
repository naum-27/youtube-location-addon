import OpenAI from "openai";

export default async function handler(req, res) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey || apiKey === 'undefined') {
        return res.status(401).json({ error: 'OPENAI_API_KEY is not configured in Vercel settings' });
    }

    // CORS Configuration
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    try {
        const openai = new OpenAI({ apiKey });

        const prompt = `Analyze this YouTube video info and return ONLY a JSON object with keys "city", "country", and "confidence_score". Title: ${title} Description: ${description || ''}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that detects geographical locations from video metadata. You must return only valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const resultText = response.choices[0].message.content;

        if (!resultText) {
            return res.status(500).json({ error: 'Empty response from AI' });
        }

        try {
            const resultJson = JSON.parse(resultText);
            return res.status(200).json(resultJson);
        } catch (parseError) {
            console.error('JSON Parse Error. Content was:', resultText);
            return res.status(200).json({
                city: null,
                country: resultText.substring(0, 50),
                confidence_score: 0,
                raw_response: resultText
            });
        }
    } catch (error) {
        console.error('Internal Function Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
