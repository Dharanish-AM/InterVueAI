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

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

// POST /generate-questions
app.post("/api/generate-questions", async (req, res) => {
  const { role } = req.body;
  console.log("[GenerateQuestions] Generating questions for role:", role);

  try {
    const prompt = `Generate 6 interview questions for a ${role} role. 2 easy, 2 medium, 2 hard. Return JSON array [{"question":"...","difficulty":"easy/medium/hard","correctAnswer":"..."}]`;
    console.log("[GenerateQuestions] Prompt sent to GROQ API:", prompt);

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

    console.log("[GenerateQuestions] Raw AI response:", response.data);

    let content = response.data.choices[0].message.content;
    content = content.replace(/```json|```/g, "").trim();
    console.log("[GenerateQuestions] Parsed AI content:", content);

    let questions;
    try {
      questions = JSON.parse(content).map((q, index) => ({
        id: index + 1,
        ...q,
        timeLimit:
          q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120,
      }));
      console.log("[GenerateQuestions] Final questions array:", questions);
    } catch (parseError) {
      console.error("[GenerateQuestions] JSON parse failed:", parseError);
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
    console.error("[GenerateQuestions] Error:", error);
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// POST /score-answer
app.post("/api/score-answer", async (req, res) => {
  const { question, answer, difficulty } = req.body;
  console.log("[ScoreAnswer] Scoring answer. Question:", question, "Difficulty:", difficulty);

  try {
    const prompt = `Question: ${question}
Answer: ${answer}
Difficulty: ${difficulty}
Score this answer from 0-10 and provide detailed feedback.
Return JSON: {"score": number, "feedback": "text"}`;
    console.log("[ScoreAnswer] Prompt sent to GROQ API:", prompt);

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

    console.log("[ScoreAnswer] Raw AI response:", response.data);

    let content = response.data.choices[0].message.content;
    content = content.replace(/```json|```/g, "").trim();
    console.log("[ScoreAnswer] Parsed AI content:", content);

    let data;
    try {
      data = JSON.parse(content);
      console.log("[ScoreAnswer] Parsed JSON data:", data);
    } catch (parseError) {
      console.error("[ScoreAnswer] JSON parse failed:", parseError);
      data = { score: 5, feedback: content };
    }
    data.timestamp = new Date().toISOString();

    res.json(data);
  } catch (error) {
    console.error("[ScoreAnswer] Error:", error);
    res.status(500).json({ error: "Failed to score answer" });
  }
});

// POST /generate-summary
app.post("/api/generate-summary", async (req, res) => {
  const { candidate, answers } = req.body;
  console.log("[GenerateSummary] Generating summary for candidate:", candidate);

  try {
    const prompt = `Candidate: ${candidate.name} (${candidate.email})
Answers: ${JSON.stringify(answers)}
Provide a concise summary of the candidate's performance and suitability for the role.
Return as plain text.`;
    console.log("[GenerateSummary] Prompt sent to GROQ API:", prompt);

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

    console.log("[GenerateSummary] Raw AI response:", response.data);

    let content = response.data.choices[0].message.content;
    content = content.replace(/```/g, "").trim();
    console.log("[GenerateSummary] Cleaned summary content:", content);

    res.json({ summary: content });
  } catch (error) {
    console.error("[GenerateSummary] Error:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
