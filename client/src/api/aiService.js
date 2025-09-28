import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

export async function generateQuestions(role = "Full-Stack Developer") {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/generate-questions`, {
      role,
    });

    const questions = data.map((q, index) => ({
      id: index + 1,
      question: q.question,
      difficulty: q.difficulty,
      correctAnswer: q.correctAnswer,
      timeLimit:
        q.difficulty === "easy" ? 20 : q.difficulty === "medium" ? 60 : 120,
    }));

    return questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    return [];
  }
}

export async function scoreAnswer(question, answer, difficulty) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/score-answer`, {
      question,
      answer,
      difficulty,
    });
    return data;
  } catch (error) {
    console.error("Error scoring answer:", error);
    return {
      score: 5,
      feedback: "Unable to score at this time. Please try again.",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function generateSummary(candidate, answers) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/generate-summary`, {
      candidate,
      answers,
    });
    return data;
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Summary unavailable at this time.";
  }
}
