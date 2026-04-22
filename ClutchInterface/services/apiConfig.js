import { Platform } from 'react-native';

const API_HOST_BY_PLATFORM = {
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
};

const API_PORT = '8080';
const API_HOST = API_HOST_BY_PLATFORM[Platform.OS] || API_HOST_BY_PLATFORM.default;

export const API_BASE_URL = `http://${API_HOST}:${API_PORT}/clutch`;
export const API_ASSETS_BASE_URL = `http://${API_HOST}:${API_PORT}`;

export const parseResponse = async (response) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return { ok: response.ok, status: response.status, data: payload };
};
