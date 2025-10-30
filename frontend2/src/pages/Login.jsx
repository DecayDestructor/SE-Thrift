import React, { useState } from 'react'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material'
import { login } from '../services/api'
import { useNavigate } from 'react-router-dom'

const Login = ({ onLogin }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    name: '',
  })
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await login(formData)
      onLogin(response)
      navigate('/')
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
            />
            <Typography align="center" sx={{ my: 1 }}>
              OR
            </Typography>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  )
}

export default Login
