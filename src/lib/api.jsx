const API_BASE = '/api'

async function request(path, options = {}, retry = true) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  if (response.status === 401 && retry) {
    const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    })

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json()
      if (refreshData?.data?.token) {
        localStorage.setItem('token', refreshData.data.token)
      }
      return request(path, options, false)
    }
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.message || 'Request failed')
    error.status = response.status
    error.code = payload?.error?.code
    error.details = payload?.error?.details
    throw error
  }

  return payload
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}
