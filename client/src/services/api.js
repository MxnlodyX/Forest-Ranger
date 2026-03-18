const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const message = data?.error || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  get:    (endpoint)        => request(endpoint),
  post:   (endpoint, body) => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};
