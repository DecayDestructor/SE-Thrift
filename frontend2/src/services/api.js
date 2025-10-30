import axios from 'axios'

const API_URL = 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_URL,
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage =
      error.response?.data?.detail || error.message || 'An error occurred'
    throw new Error(errorMessage)
  }
)

export const register = async (userData) => {
  const response = await api.post('/register', userData)
  return response.data
}

export const login = async (credentials) => {
  const response = await api.post('/login', credentials)
  return response.data
}

export const getProducts = async () => {
  const response = await api.get('/products')
  return response.data
}

export const addProduct = async (productData) => {
  try {
    const response = await api.post('/products', productData)
    return response.data
  } catch (error) {
    throw new Error(error.message || 'Failed to add product')
  }
}

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData)
  return response.data
}

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`)
  return response.data
}

export const placeOrder = async (orderData) => {
  const response = await api.post('/orders', orderData)
  return response.data
}

export const getOrders = async () => {
  const response = await api.get('/orders')
  return response.data
}

export const sendMessage = async (messageData) => {
  const response = await api.post('/chat/send', messageData)
  return response.data
}

export const getMessages = async (userId) => {
  const response = await api.get(`/chat/${userId}`)
  return response.data
}

export const searchProducts = async (lat, lon, radius = 5.0) => {
  try {
    const response = await api.get(
      `/search?lat=${lat}&lon=${lon}&radius=${radius}`
    )
    return response.data
  } catch (error) {
    const errorMessage =
      error.response?.data?.detail ||
      error.message ||
      'Error searching products'
    throw new Error(errorMessage)
  }
}

export const getUsers = async () => {
  const response = await api.get('/users')
  return response.data
}
