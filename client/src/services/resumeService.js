import api from './api';

const resumeService = {
  uploadResume: async (userId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post(`/resume/upload/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default resumeService;
