import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  interviews: {},
  currentInterview: null,
  questions: [],
  currentQuestionIndex: 0,
  timeRemaining: 0,
  isTimerActive: false,
  loading: false,
  error: null,
};

const interviewSlice = createSlice({
  name: 'interviews',
  initialState,
  reducers: {
    startInterview: (state, action) => {
      const { candidateId, questions } = action.payload;
      const interview = {
        id: `${candidateId}_${Date.now()}`,
        candidateId,
        questions: questions.map(q => ({
          ...q,
          answer: '',
          score: null,
          feedback: '',
          timeSpent: 0,
          answered: false,
        })),
        startedAt: new Date().toISOString(),
        status: 'in_progress',
        currentQuestionIndex: 0,
      };
      
      state.interviews[interview.id] = interview;
      state.currentInterview = interview;
      state.questions = interview.questions;
      state.currentQuestionIndex = 0;
      state.timeRemaining = questions[0]?.timeLimit || 60;
    },
    
    setCurrentInterview: (state, action) => {
      const interview = state.interviews[action.payload];
      if (interview) {
        state.currentInterview = interview;
        state.questions = interview.questions;
        state.currentQuestionIndex = interview.currentQuestionIndex;
      }
    },
    
    submitAnswer: (state, action) => {
      const { answer, timeSpent } = action.payload;
      if (state.currentInterview) {
        const questionIndex = state.currentQuestionIndex;
        state.currentInterview.questions[questionIndex].answer = answer;
        state.currentInterview.questions[questionIndex].timeSpent = timeSpent;
        state.currentInterview.questions[questionIndex].answered = true;
        
        
        state.interviews[state.currentInterview.id] = state.currentInterview;
        state.questions = state.currentInterview.questions;
      }
    },
    
    scoreAnswer: (state, action) => {
      const { questionIndex, score, feedback } = action.payload;
      if (state.currentInterview) {
        state.currentInterview.questions[questionIndex].score = score;
        state.currentInterview.questions[questionIndex].feedback = feedback;
        
        
        state.interviews[state.currentInterview.id] = state.currentInterview;
        state.questions = state.currentInterview.questions;
      }
    },
    
    nextQuestion: (state) => {
      if (state.currentInterview && state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.currentInterview.currentQuestionIndex = state.currentQuestionIndex;
        state.timeRemaining = state.questions[state.currentQuestionIndex].timeLimit;
        
        
        state.interviews[state.currentInterview.id] = state.currentInterview;
      }
    },
    
    completeInterview: (state, action) => {
      const { finalScore, summary } = action.payload;
      if (state.currentInterview) {
        state.currentInterview.status = 'completed';
        state.currentInterview.completedAt = new Date().toISOString();
        state.currentInterview.finalScore = finalScore;
        state.currentInterview.summary = summary;
        
        
        state.interviews[state.currentInterview.id] = state.currentInterview;
      }
    },
    
    setTimer: (state, action) => {
      state.timeRemaining = action.payload;
    },
    
    startTimer: (state) => {
      state.isTimerActive = true;
    },
    
    stopTimer: (state) => {
      state.isTimerActive = false;
    },
    
    decrementTimer: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1;
      }
    },
    
    resetInterview: (state) => {
      state.currentInterview = null;
      state.questions = [];
      state.currentQuestionIndex = 0;
      state.timeRemaining = 0;
      state.isTimerActive = false;
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  startInterview,
  setCurrentInterview,
  submitAnswer,
  scoreAnswer,
  nextQuestion,
  completeInterview,
  setTimer,
  startTimer,
  stopTimer,
  decrementTimer,
  resetInterview,
  setLoading,
  setError,
} = interviewSlice.actions;

export default interviewSlice.reducer;