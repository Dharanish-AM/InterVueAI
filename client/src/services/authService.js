import api from './api';

const authService = {
  register: async (userData) => {
    const response = await api.post('/user/signup', userData);
    return response.data;
  },
  login: async (userData) => {
    const response = await api.post('/user/login', userData);
    return response.data;
  },
};

export default authService;
