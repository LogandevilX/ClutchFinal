const API = '192.168.1.74:8080';

export const API_BASE_URL = `http://${API}/clutch`;
export const API_ASSETS_BASE_URL = `http://${API}`;

export const parseResponse = async (response) => {
  let payload = null;

  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  return { ok: response.ok, status: response.status, data: payload };
};
