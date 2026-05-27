// netlify/functions/askGroq.js
exports.handler = async function (event, context) {
    // Handle browser pre-flight security checks safely
    if (event.httpMethod === "OPTIONS") {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
                "Access-Control-Allow-Methods": "POST, OPTIONS"
            }
        };
    }

    try {
        const bodyData = JSON.parse(event.body);
        const secretKey = process.env.GROQ_API_KEY; // Securely grabs the key from Netlify cloud vault

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${secretKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768",
                messages: bodyData.messages
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message })
        };
    }
};