import axios from "axios";
import { Capacitor } from "@capacitor/core";

// En la app nativa (Android/iOS) "localhost" es el propio dispositivo, no la PC
// donde corre el backend: hay que apuntar a la IP de red local (VITE_API_URL_MOBILE).
export const API_URL = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_API_URL_MOBILE || "http://localhost:8000/api"
  : import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_URL,
});

// Adjunta el token JWT (alumno o profesor) a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el token expiró, desloguea y manda a /login (no aplica a intentos de login,
// que no llevan Authorization y deben mostrar el error en el formulario)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const teniaToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && teniaToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
