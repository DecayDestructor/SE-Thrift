import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline } from '@mui/material'
import theme from './theme'
import { LocationProvider } from './contexts/LocationContext'

// Components
import Header from './components/Header'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Products from './pages/Products'
import MyProducts from './pages/MyProducts'
import Orders from './pages/Orders'
import Chat from './pages/Chat'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
  }

  const PrivateRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <LocationProvider>
          <div>
            <Header
              isLoggedIn={!!user}
              userRole={user?.role}
              onLogout={handleLogout}
            />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route
                path="/register"
                element={<Register onRegister={handleLogin} />}
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute>
                    <Products user={user} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute>
                    <Orders user={user} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <PrivateRoute>
                    <Chat user={user} />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-products"
                element={
                  <PrivateRoute>
                    <MyProducts user={user} />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </LocationProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
