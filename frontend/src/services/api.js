import axios from 'axios';

const API_BASE_URL =
    process.env.REACT_APP_API_URL || 'http://localhost:5000';

const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Attach the saved JWT token to every API request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle expired or invalid access tokens
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isLoginRequest =
            originalRequest?.url?.includes('/api/auth/login');

        const isRefreshRequest =
            originalRequest?.url?.includes('/api/auth/refresh');

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isLoginRequest &&
            !isRefreshRequest
        ) {
            originalRequest._retry = true;

            try {
                const refreshResponse = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newToken = refreshResponse.data?.token;

                if (newToken) {
                    localStorage.setItem('token', newToken);

                    originalRequest.headers =
                        originalRequest.headers || {};

                    originalRequest.headers.Authorization =
                        `Bearer ${newToken}`;
                }

                return API(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userName');
                localStorage.removeItem('userRole');

                window.location.href = '/login';

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default API;
