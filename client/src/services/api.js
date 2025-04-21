import axios from "axios";

//Base URL
const BASE_URL = "http://localhost:5173/api";

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    });

    //Add a request interceptor to set the auth token each request

    apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
    );

    //Auth API
    export const authApi = {
        login: async (email, password) => {
            const response = await apiClient.post("/auth/login", { email, password });
            return response.data;
        },
        register: async (name, email, password) => {
            const response = await apiClient.post("/auth/register", { name, email, password });
            return response.data;
        },
        logout: async () => {
            const response = await apiClient.post("/auth/logout");
            return response.data;
        },
    };

    export const articelApi = {
        getAllArticles: async () => {
            const response = await apiClient.get("/articles");
            return response.data;
        },
        getArticleById: async (id) => {
            const response = await apiClient.get(`/articles/${id}`);
            return response.data;
        },
        createArticle: async (article) => {
            const response = await apiClient.post("/articles", article);
            return response.data;
        },
        updateArticle: async (id, article) => {
            const response = await apiClient.put(`/articles/${id}`, article);
            return response.data;
        },
        deleteArticle: async (id) => {
            const response = await apiClient.delete(`/articles/${id}`);
            return response.data;
        },
    };

    export const commentApi = {
        getCommentsByArticleId: async (articleId) => {
            const response = await apiClient.get(`/articles/${articleId}/comments`);
            return response.data;
        },
        createComment: async (articleId, comment) => {
            const response = await apiClient.post(`/articles/${articleId}/comments`, comment);
            return response.data;
        },
        updateComment: async (articleId, commentId, comment) => {
            const response = await apiClient.put(`/articles/${articleId}/comments/${commentId}`, comment);
            return response.data;
        },
        deleteComment: async (articleId, commentId) => {
            const response = await apiClient.delete(`/articles/${articleId}/comments/${commentId}`);
            return response.data;
        },
    };

    export const tagsApi = {
        getAllTags: async () => {
            const response = await apiClient.get("/tags");
            return response.data;
        },
        getTagById: async (id) => {
            const response = await apiClient.get(`/tags/${id}`);
            return response.data;
        },
        createTag: async (tag) => {
            const response = await apiClient.post("/tags", tag);
            return response.data;
        },
        updateTag: async (id, tag) => {
            const response = await apiClient.put(`/tags/${id}`, tag);
            return response.data;
        },
        deleteTag: async (id) => {
            const response = await apiClient.delete(`/tags/${id}`);
            return response.data;
        },
    };

    