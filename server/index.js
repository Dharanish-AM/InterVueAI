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

// POST /generate-questions
app.post("/api/generate-questions", async (req, res) => {
  const { role } = req.body;

  try {
    const prompt = `Generate 6 interview questions for a ${role} role (2 easy, 2 medium, 2 hard). 
Return ONLY a JSON array with objects: {"question":"...","difficulty":"easy|medium|hard","correctAnswer":"..."}.
No extra text.`;

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

    // Extract only JSON array from AI response
    let content = response.data.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const jsonStart = content.indexOf("[");
    const jsonEnd = content.lastIndexOf("]") + 1;

    let parsedQuestions;
    try {
      parsedQuestions = JSON.parse(content.slice(jsonStart, jsonEnd));
    } catch (err) {
      // fallback: single question with raw text
      parsedQuestions = [
        {
          id: 1,
          question: content,
          difficulty: "unknown",
          correctAnswer: "",
          timeLimit: 60,
        },
      ];
    }

    const questions = parsedQuestions.map((q, index) => ({
      id: index + 1,
      ...q,
      timeLimit:
        q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120,
    }));

    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate questions" });
  }
});

// POST /score-answer
app.post("/api/score-answer", async (req, res) => {
  const { question, answer, difficulty } = req.body;

  try {
    const prompt = `Question: ${question}\nAnswer: ${answer}\nDifficulty: ${difficulty}\nScore 0-10 and provide feedback in JSON: {"score": number,"feedback":"text"}. Return ONLY JSON.`;

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

    // Extract JSON object from the response
    const jsonStart = content.indexOf("{");
    const jsonEnd = content.lastIndexOf("}") + 1;
    let data;
    try {
      data = JSON.parse(content.slice(jsonStart, jsonEnd));
    } catch (err) {
      data = { score: 5, feedback: content };
    }

    data.timestamp = new Date().toISOString();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to score answer" });
  }
});

// POST /generate-summary
app.post("/api/generate-summary", async (req, res) => {
  const { candidate, answers } = req.body;

  if (!candidate) {
    return res.status(400).json({ error: "Candidate data is required" });
  }

  try {
    const prompt = `Candidate: ${candidate.name} (${candidate.email})
Answers: ${JSON.stringify(answers)}
Provide a concise summary of the candidate's performance. Return only plain text.`;

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

    let summary = response.data.choices[0].message.content
      .replace(/```/g, "")
      .trim();

    // Return as plain string instead of object
    res.send(summary);
  } catch (error) {
    res.status(500).send("Failed to generate summary");
  }
});

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
