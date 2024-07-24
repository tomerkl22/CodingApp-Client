import axios from "axios";

const API_BASE_URL = 'https://codingapp-server-production.up.railway.app';

const apiClient= axios.create(
    {
        baseURL: API_BASE_URL
    }
);

export default apiClient
