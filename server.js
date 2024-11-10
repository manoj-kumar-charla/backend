const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000;

// Enable CORS for the frontend origin
app.use(cors({
    origin: '*', // Allow requests specifically from frontend port
    methods: ['GET', 'POST'],
    credentials: true
}));

// Initialize Google Generative AI with API key from environment variable
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.use(bodyParser.json());
app.use(express.static('public'));

let chatHistory = [];  // Initialize chat history

app.post('/ask', async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ error: 'A question is required' });
    }

    // Create the prompt with conversation context and healthcare focus
    const prompt = `You're a healthcare-focused AI assistant specializing in providing detailed medical guidance, including information on diseases, home remedies, appointment scheduling, emergency responses, symptoms analysis, diet, and health tips. 

    You can also perform symptom checking based on input. If a user question is unclear, ask one question at a time and then wait for the reply then ask another question , till all your doubts are clear, ask for more details. Politely redirect non-medical queries by explaining you're here to assist with healthcare. 
    you should be able to prescribe medication, provide information on diseases, and give health tips.

    Conversation history:
    ${chatHistory.map((entry, index) => `Q${index+1}: ${entry.question}\nA${index+1}: ${entry.answer}`).join('\n')}

    Q: ${question}
    A:`;

    try {
        const result = await model.generateContent(prompt);
        const answer = result.response.text();

        // Add question and answer to the chat history
        chatHistory.push({ question, answer });

        // Send the answer as JSON
        res.status(200).json({ answer });

    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({ error: 'Error generating content' });
    }
});

// Endpoint to clear chat history (optional)
app.post('/clear-chat', (req, res) => {
    chatHistory = [];
    res.status(200).json({ message: 'Chat history cleared' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
