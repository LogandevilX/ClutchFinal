import { API_ASSETS_BASE_URL, API_BASE_URL } from './apiConfig';
import { fetchJson, setAuthToken } from './serviceUtils';

const USERS_URL = `${API_BASE_URL}/usuarios`;
const AUTH_URL = `${API_ASSETS_BASE_URL}/auth`;

const normalizeAuthUser = (payload = {}) => ({
  ...payload,
  id: payload?.id ?? payload?.userId ?? null,
});

const withAuthToken = (response) => {
  if (!response?.ok) {
    return response;
  }

  const token = response?.data?.token;
  setAuthToken(token);

  return response;
};

const normalizeUserResponse = (response) => {
  if (!response?.ok) {
    return response;
  }

  return {
    ...response,
    data: normalizeAuthUser(response?.data),
  };
};

export async function loginUsuario(email, password) {
  const authResponse = withAuthToken(
    await fetchJson(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      includeAuth: false,
    })
  );

  if (!authResponse?.ok) {
    return authResponse;
  }

  const userId = authResponse?.data?.id ?? authResponse?.data?.userId;
  if (!userId) {
    return normalizeUserResponse(authResponse);
  }

  const profileResponse = await fetchJson(`${USERS_URL}/${userId}`);

  if (!profileResponse?.ok || !profileResponse?.data) {
    return normalizeUserResponse(authResponse);
  }

  return normalizeUserResponse({
    ...authResponse,
    data: {
      ...authResponse.data,
      ...profileResponse.data,
    },
  });
}


export async function registrarEspectador({ email, password, apodo }) {
  const response = await fetchJson(USERS_URL, {
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

  return normalizeUserResponse(response);
}


export async function actualizarUsuario(id, { email, apodo, password = null, rol = null, fechaRegistro = null }) {
  const response = await fetchJson(`${USERS_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      apodo,
      rol,
      fechaRegistro,
    }),
  });

  return normalizeUserResponse(response);
}

export function logoutUsuario() {
  setAuthToken(null);
}
