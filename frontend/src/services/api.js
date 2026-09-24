import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    withCredentials: true
});

API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/auth/login')) {
            originalRequest._retry = true;
            try {
                await axios.post(
                    `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );
                return API(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default API;