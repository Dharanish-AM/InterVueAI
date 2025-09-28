import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  candidates: [],
  currentCandidate: null,
  loading: false,
  error: null,
};

const candidateSlice = createSlice({
  name: 'candidates',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    addCandidate: (state, action) => {
      const candidate = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'active',
        ...action.payload,
      };
      state.candidates.push(candidate);
      state.currentCandidate = candidate;
    },
    updateCandidate: (state, action) => {
      const { id, ...updates } = action.payload;
      const index = state.candidates.findIndex(c => c.id === id);
      if (index !== -1) {
        state.candidates[index] = { ...state.candidates[index], ...updates };
        if (state.currentCandidate?.id === id) {
          state.currentCandidate = state.candidates[index];
        }
      }
    },
    setCurrentCandidate: (state, action) => {
      state.currentCandidate = action.payload;
    },
    clearCurrentCandidate: (state) => {
      state.currentCandidate = null;
    },
    deleteCandidate: (state, action) => {
      state.candidates = state.candidates.filter(c => c.id !== action.payload);
      if (state.currentCandidate?.id === action.payload) {
        state.currentCandidate = null;
      }
    },
    clearAllCandidates: (state) => {
      state.candidates = [];
      state.currentCandidate = null;
    },
  },
});

export const {
  setLoading,
  setError,
  addCandidate,
  updateCandidate,
  setCurrentCandidate,
  clearCurrentCandidate,
  deleteCandidate,
  clearAllCandidates,
} = candidateSlice.actions;

export const removeCandidate = candidateSlice.actions.deleteCandidate;

export default candidateSlice.reducer;