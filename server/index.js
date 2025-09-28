// backend/server.js
const express = require("express");
const cors = require("cors");
const sanityClient = require("@sanity/client");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure Sanity/GROQ client
const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2025-09-28", // use today’s date
  token: process.env.SANITY_API_TOKEN, // optional if read-only
  useCdn: false,
});

// POST /api/generate-questions
app.post("/api/generate-questions", async (req, res) => {
  const { role } = req.body;
  try {
    const query = `*[_type == "interviewQuestion" && role == $role]{
      question,
      difficulty
    } | order(difficulty asc)`;
    const questions = await client.fetch(query, { role });

    const formatted = questions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      difficulty: q.difficulty,
      timeLimit:
        q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120,
    }));

    res.json(formatted.slice(0, 6)); // take 6 questions
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch questions from GROQ" });
  }
});

// POST /api/score-answer
app.post("/api/score-answer", async (req, res) => {
  const { question, answer, difficulty } = req.body;
  try {
    // Fetch model answer from GROQ
    const query = `*[_type == "interviewQuestion" && question == $question][0]{
      correctAnswer
    }`;
    const qData = await client.fetch(query, { question });

    // Simple scoring: exact match or partial match
    let score = 0;
    let feedback = "Answer could be improved.";
    if (!qData?.correctAnswer) {
      score = 5;
      feedback = "No reference answer found, score is neutral.";
    } else if (
      answer.toLowerCase().includes(qData.correctAnswer.toLowerCase())
    ) {
      score = 10;
      feedback = "Excellent answer!";
    } else {
      score = 6;
      feedback = "Partial answer, consider including more details.";
    }

    res.json({ score, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to score answer" });
  }
});

// POST /api/generate-summary
app.post("/api/generate-summary", async (req, res) => {
  const { candidate, answers } = req.body;
  try {
    const avgScore =
      answers.reduce((sum, ans) => sum + ans.score, 0) / answers.length;
    let summary = "";
    if (avgScore >= 8) {
      summary = `${candidate.name} is an exceptional candidate with strong technical knowledge. Highly recommended.`;
    } else if (avgScore >= 6) {
      summary = `${candidate.name} is a solid candidate with good understanding of concepts. Shows potential.`;
    } else if (avgScore >= 4) {
      summary = `${candidate.name} has basic knowledge but may need additional support.`;
    } else {
      summary = `${candidate.name} needs significant improvement before being considered.`;
    }

    res.json({ summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
