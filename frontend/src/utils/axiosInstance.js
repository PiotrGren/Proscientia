import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// --- Token storage w pamięci + localStorage ---
let accessToken = localStorage.getItem("accessToken") || null;
let refreshToken = localStorage.getItem("refreshToken") || null;

let isRefreshing = false;
let refreshSubscribers = [];
let refreshIntervalId = null;

// Globalny handler błędów (np. do wyświetlania dialogów na froncie)
let globalErrorHandler = null;

// --- Helpery: zarządzanie tokenami i logout ---

export function setAuthTokens({ access, refresh }) {
  if (access) {
    accessToken = access;
    localStorage.setItem("accessToken", access);
  }
  if (refresh) {
    refreshToken = refresh;
    localStorage.setItem("refreshToken", refresh);
  }

  if (refreshToken) {
    startAutoRefresh();
  }
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  stopAutoRefresh();
}

export function setApiErrorHandler(handlerFn) {
  globalErrorHandler = handlerFn;
}

export function getAccessToken() {
  return accessToken;
}

export function logout() {
  clearAuthTokens();
  // tu można dodać czyszczenie store, query cache itd.
  window.location.href = "/login";
}

// --- Auto-refresh co 30 minut ---

function startAutoRefresh(intervalMs = 30 * 60 * 1000) {
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  if (!refreshToken) return;

  refreshIntervalId = setInterval(async () => {
    if (!refreshToken) return; // użytkownik mógł się wylogować
    try {
      await refreshAccessToken();
    } catch (err) {
      // jak refresh nie wyjdzie, wyloguj
      logout();
    }
  }, intervalMs);
}

function stopAutoRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
}

// --- Mechanika refresh-tokena ---

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(newAccessToken) {
  refreshSubscribers.forEach((cb) => cb(newAccessToken));
  refreshSubscribers = [];
}

async function refreshAccessToken() {
  if (!refreshToken) {
    throw new Error("Brak refresh tokena");
  }

  // Używamy 'gołego' axiosa, nie instancji (żeby nie wpadać w interceptory)
  const url = `${API_BASE_URL}/users/auth/refresh/`;

  const response = await axios.post(url, { refresh: refreshToken });

  const newAccess = response.data.access;
  const newRefresh = response.data.refresh || refreshToken;

  setAuthTokens({ access: newAccess, refresh: newRefresh });

  return newAccess;
}

// --- Instancja axios dla całego frontendu ---

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 30000, // komunikacja z backendem + agentami AI może zajmować chwilę
});

// --- Request interceptor: token + uploady ---

axiosInstance.interceptors.request.use(
  (config) => {
    // Authorization
    if (accessToken && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Uploady plików: jeżeli body to FormData, axios sam ustawi multipart/form-data
    // więc tu nic nie wymuszamy, tylko nie nadpisujemy Content-Type

    return config;
  },
  (error) => {
    // nie logujemy do konsoli, po prostu odrzucamy
    return Promise.reject(error);
  }
);

// --- Response interceptor: 401 -> refresh i retry, obsługa błędów serwera ---

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    const originalRequest = config || {};

    // --- 401: próbujemy odświeżyć token i powtórzyć request ---
    if (response && response.status === 401 && !originalRequest._retry) {
      // brak refresh tokena -> po prostu logout
      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      // jeśli refresh już trwa, dopisz się do kolejki
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              return reject(error);
            }
            originalRequest._retry = true;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      // startujemy refresh
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;

        onRefreshed(newToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        isRefreshing = false;
        logout();
        return Promise.reject(refreshErr);
      }
    }

    // --- Błędy sieciowe lub 5xx: globalny komunikat, bez console.error ---

    const isServerError =
      !response || (response.status && response.status >= 500);

    if (isServerError) {
      const userMessage =
        "Wystąpił błąd serwera. Spróbuj ponownie za chwilę.";

      if (typeof globalErrorHandler === "function") {
        try {
          globalErrorHandler(userMessage);
        } catch {
          // ignorujemy błędy handlera
        }
      }

      const apiError = new Error(userMessage);
      apiError.isApiError = true;
      apiError.originalError = error;

      return Promise.reject(apiError);
    }

    // --- Inne 4xx (np. walidacja) zostawiamy do obsługi lokalnej ---
    return Promise.reject(error);
  }
);

// po odświeżeniu strony: jeśli mamy refreshToken, od razu odpal auto-refresh
if (refreshToken) {
  startAutoRefresh();
}

export default axiosInstance;
