import axios from 'axios';
import { auth } from '@/lib/firebase';

import { getApiUrl } from '@/lib/config';

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
});

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;
      const currentUser = auth.currentUser;
      if (currentUser) {
        const freshToken = await currentUser.getIdToken(true);
        setAuthToken(freshToken);
        originalRequest.headers['Authorization'] = `Bearer ${freshToken}`;
        return api(originalRequest);
      }
    }
    return Promise.reject(error);
  },
);
