import axios from "axios";

const API_BASE_URL = 'https://codingapp-server-9ac053720d46.herokuapp.com';

const apiClient= axios.create(
    {
        baseURL: API_BASE_URL
    }
);

export default apiClient
