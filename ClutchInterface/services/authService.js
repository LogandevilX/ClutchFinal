import { Platform } from 'react-native';

const API_HOST_BY_PLATFORM = {
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
};

const API_PORT = '8080';

const host = API_HOST_BY_PLATFORM[Platform.OS] || API_HOST_BY_PLATFORM.default;
const USERS_URL = `http://192.168.1.74:8080/clutch/usuarios`;

const parseResponse = async (response) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return { ok: response.ok, status: response.status, data: payload };
};

export async function loginUsuario(email, password) {
  const response = await fetch(`${USERS_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return parseResponse(response);
}

export async function registrarEspectador({ email, password, apodo }) {
  const response = await fetch(USERS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      apodo,
      rol: 'ESPECTADOR',
    }),
  });

  return parseResponse(response);
}
