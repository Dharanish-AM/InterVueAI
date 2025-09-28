const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Middleware to check API key if needed
app.use((req, res, next) => {
  // Optional API key check here
  next();
});

// POST /generate-questions
app.post("/api/generate-questions", async (req, res) => {
  const { role } = req.body;
  try {
    const prompt = `Generate 6 interview questions for a ${role} role. 2 easy, 2 medium, 2 hard. Return JSON array [{"question":"...","difficulty":"easy/medium/hard","correctAnswer":"..."}]`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    let content = response.data.choices[0].message.content;
    content = content.replace(/```json|```/g, "").trim();

    let questions;
    try {
      questions = JSON.parse(content).map((q, index) => ({
        id: index + 1,
        ...q,
        timeLimit:
          q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120,
      }));
    } catch {
      questions = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        question: content,
        difficulty: "unknown",
        correctAnswer: "",
        timeLimit: 60,
      }));
    }

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// POST /score-answer
app.post("/api/score-answer", async (req, res) => {
  const { question, answer, difficulty } = req.body;
  try {
    const prompt = `Question: ${question}
Answer: ${answer}
Difficulty: ${difficulty}
Score this answer from 0-10 and provide detailed feedback.
Return JSON: {"score": number, "feedback": "text"}`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    let data;
    try {
      data = JSON.parse(response.data.choices[0].message.content);
    } catch {
      data = { score: 5, feedback: response.data.choices[0].message.content };
    }
    data.timestamp = new Date().toISOString();

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to score answer" });
  }
});

// POST /generate-summary
app.post("/api/generate-summary", async (req, res) => {
  const { candidate, answers } = req.body;
  try {
    const prompt = `Candidate: ${candidate.name} (${candidate.email})
Answers: ${JSON.stringify(answers)}
Provide a concise summary of the candidate's performance and suitability for the role.
Return as plain text.`;

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
      }
    );

    const summary = response.data.choices[0].message.content;
    res.json({ summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
