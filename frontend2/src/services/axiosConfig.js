import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000,
})

// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      message: error.response?.data?.detail || 'An unexpected error occurred',
      status: error.response?.status || 500,
    }
    return Promise.reject(customError)
  }
)

export default axiosInstance
