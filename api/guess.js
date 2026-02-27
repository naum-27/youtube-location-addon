import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    const apiKey = process.env.AI_KEY;
    if (!apiKey || apiKey === 'undefined') {
        return res.status(401).json({ error: 'AI_KEY is not configured in Vercel settings' });
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
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this YouTube video info and return ONLY a JSON object with keys "city", "country", and "confidence_score". Title: ${title} Description: ${description || ''}`;

        let result;
        try {
            result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    response_mime_type: "application/json",
                },
            });
        } catch (aiError) {
            console.error('CRITICAL: Gemini SDK generateContent failed:', aiError.message);
            console.error('Full Error Object:', JSON.stringify(aiError, null, 2));
            return res.status(502).json({
                error: 'Failed to connect to AI service',
                message: aiError.message
            });
        }

        let resultText = result.response.text();

        if (!resultText) {
            return res.status(500).json({ error: 'Empty response from AI' });
        }

        // Clean up response if it contains markdown code blocks
        resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            const resultJson = JSON.parse(resultText);
            return res.status(200).json(resultJson);
        } catch (parseError) {
            console.error('JSON Parse Error. Content was:', resultText);
            // Fallback if it's just a string
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
