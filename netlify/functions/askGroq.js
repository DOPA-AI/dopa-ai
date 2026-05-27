const fetch = require("node-fetch");

exports.handler = async function (event, context) {
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
        const secretKey = process.env.GROQ_API_KEY;

        // DIAGNOSTIC CHECK: Let's see what the server actually sees
        if (!secretKey) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: "Server check: GROQ_API_KEY environment variable is completely empty or missing." })
            };
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${secretKey.trim()}`, // Added trim to auto-kill hidden spaces
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: bodyData.model || "llama-3.1-8b-instant",
                messages: bodyData.messages
            })
        });

        const data = await response.json();

        // If Groq rejects it, pass the exact raw error back to see it
        if (data.error) {
            return {
                statusCode: 400,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ error: `Groq API direct message: ${data.error.message} (Key starts with: "${secretKey.substring(0, 7)}..." and is ${secretKey.length} chars long)` })
            };
        }

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
