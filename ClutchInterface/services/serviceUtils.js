import { API_ASSETS_BASE_URL, parseResponse } from './apiConfig';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token || null;
};

export const getAuthToken = () => authToken;

export const buildAuthHeaders = (headers = {}) => {
  const normalizedHeaders = { ...(headers || {}) };

  if (authToken) {
    normalizedHeaders.Authorization = `Bearer ${authToken}`;
  }

  return normalizedHeaders;
};

export const safeArray = (value) => (Array.isArray(value) ? value : []);

export const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getDateValue = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const buildAbsoluteAssetUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ASSETS_BASE_URL}${normalizedPath}`;
};

export async function fetchJson(url, options = undefined) {
  const requestOptions = options ? { ...options } : {};
  requestOptions.headers = buildAuthHeaders(requestOptions.headers);

  const response = await fetch(url, requestOptions);
  return parseResponse(response);
}
