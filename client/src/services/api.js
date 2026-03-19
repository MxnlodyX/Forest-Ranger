const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function resolveMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  return `${BASE_URL}${path}`;
}

async function request(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { ...defaultHeaders, ...options.headers },
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
  postForm: (endpoint, formData) => request(endpoint, { method: 'POST', body: formData }),
  put:    (endpoint, body) => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (endpoint)       => request(endpoint, { method: 'DELETE' }),
};
