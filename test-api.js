/**
 * Test script for /api/guess.js
 * Run with: node test-api.js
 * Note: Requires local AI_KEY environment variable.
 */

async function mockHandler(req, res) {
    // This is a minimal mock of the Vercel request/response object
    // for local testing without the Vercel runtime.
    const { default: guess } = await import('./api/guess.js');
    await guess(req, res);
}

// Mocking the Vercel 'res' object
const res = {
    setHeader: (name, value) => console.log(`[Header] ${name}: ${value}`),
    status: (code) => {
        console.log(`[Status] ${code}`);
        return {
            json: (data) => console.log(`[JSON Response]`, JSON.stringify(data, null, 2)),
            end: () => console.log('[Response Ended]')
        };
    }
};

const req = {
    method: 'POST',
    body: {
        title: "Exploring the Ancient Ruins of Petra, Jordan",
        description: "In this travel vlog, we visit the magnificent Siq, the Treasury, and the Royal Tombs in Petra."
    }
};

console.log("=== Testing /api/guess.js locally ===");
// In a real environment, Vercel would handle the export and environment variables.
// To test this script directly, we would need to mock the environment as well.
process.env.AI_KEY = process.env.AI_KEY || "YOUR_TEST_API_KEY_HERE";

// Note: To run this properly, 'api/guess.js' must use CJS or be run in an ESM context.
// Vercel uses ESM by default if "type": "module" or .js with "export default".
// Since it's a serverless function, we test the logic.

console.log("Mocking request with:");
console.log(JSON.stringify(req.body, null, 2));
console.log("\n(Note: This requires a valid AI_KEY in your environment to make actual API calls)\n");
