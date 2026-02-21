import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Add request interceptor to add auth token
api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line no-undef
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  response => {
    return response
  },
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        if (typeof window === 'undefined') {
          throw new Error('Cannot refresh token on server side')
        }

        // eslint-disable-next-line no-undef
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        })

        const { accessToken } = response.data
        // eslint-disable-next-line no-undef
        localStorage.setItem('accessToken', accessToken)

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          // eslint-disable-next-line no-undef
          localStorage.removeItem('accessToken')
          // eslint-disable-next-line no-undef
          localStorage.removeItem('refreshToken')
          // eslint-disable-next-line no-undef
          window.location.href = '/auth'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
