const BASE_URL = "https://bizpal-api.onrender.com";

const api = async (endpoint, method = "GET", body = null, token = null) => {
    const headers = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const options = { method, headers };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await res.text();

    if (!res.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
};

export default api;