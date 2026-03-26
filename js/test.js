import api from "./api.js";

const res = await api("/", "GET");
console.log(res);