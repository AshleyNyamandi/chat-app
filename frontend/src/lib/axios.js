import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api/v1",
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        //refresh endpoint should not trigger another refresh
        if (!originalRequest || ['/auth/refresh-token', '/auth/login', '/auth/sign-up'].some(path => originalRequest.url?.includes(path))) {
            return Promise.reject(error);
        }

        // Check if error is 401 and the request hasn't been retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {

            originalRequest._retry = true;
            // If we are already refreshing, queue this request
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => api(originalRequest))
                .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                await api.post('/auth/refresh-token');

                isRefreshing = false;
                processQueue(null);

                // Retry the original failed request
                return api(originalRequest);
            } catch (refreshError) {
                isRefreshing = false;
                processQueue(refreshError);

                // window.location.href = '/sign-in';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
