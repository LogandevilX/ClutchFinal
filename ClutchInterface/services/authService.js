import { API_BASE_URL } from './apiConfig';
import { fetchJson } from './serviceUtils';

const USERS_URL = `${API_BASE_URL}/usuarios`;

const normalizeAuthUser = (payload = {}) => ({
  ...payload,
  id: payload?.id ?? payload?.userId ?? null,
});

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
  const response = await fetchJson(`${USERS_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return normalizeUserResponse(response);
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


export async function actualizarUsuario(id, { email, password, apodo, rol, fechaRegistro }) {
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
