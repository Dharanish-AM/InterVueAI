import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import interviewService from '../../services/interviewService';

export const startInterview = createAsyncThunk(
  'interview/start',
  async (interviewData, { rejectWithValue }) => {
    try {
      return await interviewService.startInterview(interviewData);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to start interview' });
    }
  }
);

export const sendMessage = createAsyncThunk(
  'interview/message',
  async ({ sessionId, message }, { rejectWithValue }) => {
    try {
      return await interviewService.sendMessage(sessionId, message);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to send message' });
    }
  }
);

export const fetchInterview = createAsyncThunk(
  'interview/fetch',
  async (id, { rejectWithValue }) => {
    try {
      return await interviewService.getInterview(id);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to fetch interview' });
    }
  }
);

const initialState = {
  session: null,
  currentInterview: null, // For the report
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    resetInterview: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
      state.session = null;
      state.currentInterview = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startInterview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startInterview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.session = action.payload;
      })
      .addCase(startInterview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload.message;
      })
      .addCase(fetchInterview.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchInterview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentInterview = action.payload;
      })
      .addCase(fetchInterview.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload.message;
      });
  },
});

export const { resetInterview } = interviewSlice.actions;
export default interviewSlice.reducer;
