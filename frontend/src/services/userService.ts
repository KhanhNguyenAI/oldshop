import api from './api';
import type { UserProfile } from '../types/auth';

export const userService = {
  getProfile: async () => {
    const response = await api.get<UserProfile>('/auth/profile/');
    return response.data;
  },

  updateProfile: async (formData: FormData) => {
    // Allow Axios to set the multipart boundary automatically
    const response = await api.patch<UserProfile>('/auth/profile/', formData);
    return response.data;
  }
};

