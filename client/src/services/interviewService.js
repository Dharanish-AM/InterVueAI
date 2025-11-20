import api from './api';

const interviewService = {
  startInterview: async (interviewData) => {
    const response = await api.post('/interview/start', interviewData);
    return response.data;
  },
  sendMessage: async (sessionId, message) => {
    const response = await api.post('/interview/message', { sessionId, message });
    return response.data;
  },
  getInterview: async (id) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      _id: id,
      userId: "user-123",
      status: "completed",
      totalScore: 85,
      overallFeedback: "Strong technical skills, good communication. Needs improvement in system design.",
      createdAt: new Date().toISOString(),
      rounds: [
        {
          roundType: "aptitude",
          status: "completed",
          score: 90,
          feedback: "Excellent problem solving speed.",
          questions: ["Logical reasoning Q1", "Math Q2"],
          answers: ["Answer 1", "Answer 2"]
        },
        {
          roundType: "technical",
          status: "completed",
          score: 85,
          feedback: "Good knowledge of React and Node.js.",
          questions: ["Explain Event Loop", "React Hooks"],
          answers: ["Event loop explanation...", "Hooks explanation..."]
        },
        {
          roundType: "coding",
          status: "completed",
          score: 80,
          feedback: "Efficient code, but missed edge cases.",
          questions: ["Reverse Linked List"],
          answers: ["Code solution..."]
        }
      ]
    };
  },
};

export default interviewService;
