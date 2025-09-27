const { OpenAI } = require("openai");
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function gptRecommendation(prompt_request) {
    const params = {
        messages: [{
            role: 'user',
            content: prompt_request
        }],
        model: 'gpt-3.5-turbo'
    };
    const chatCompletion = await openai.chat.completions.create(params);
    const reply = chatCompletion.choices[0].message.content;
    return reply;
}



exports.gptRecommendation = gptRecommendation;
