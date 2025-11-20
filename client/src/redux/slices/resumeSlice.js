import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import resumeService from '../../services/resumeService';

export const uploadResume = createAsyncThunk(
  'resume/upload',
  async ({ userId, file }, { rejectWithValue }) => {
    try {
      return await resumeService.uploadResume(userId, file);
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Upload failed' });
    }
  }
);

const initialState = {
  resumeData: null,
  parsedData: null,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

const resumeSlice = createSlice({
  name: 'resume',
  initialState,
  reducers: {
    resetResume: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadResume.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.resumeData = action.payload;
        state.parsedData = action.payload.parsedData;
      })
      .addCase(uploadResume.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Upload failed';
      });
  },
});

export const { resetResume } = resumeSlice.actions;
export default resumeSlice.reducer;
