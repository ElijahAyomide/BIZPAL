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
    const parsed = await res.json(); // parse JSON directly

    if (!res.ok) {
        throw new Error(parsed.message || "Something went wrong");
    }

    return parsed;
};

export default api;