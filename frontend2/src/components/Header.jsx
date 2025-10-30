import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link } from 'react-router-dom'

const Header = ({ isLoggedIn, userRole, onLogout }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
        >
          Thrift Management
        </Typography>
        <Box>
          {!isLoggedIn ? (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" component={Link} to="/register">
                Register
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/products">
                Products
              </Button>
              {userRole === 'seller' && (
                <Button color="inherit" component={Link} to="/my-products">
                  My Products
                </Button>
              )}
              <Button color="inherit" component={Link} to="/orders">
                Orders
              </Button>
              <Button color="inherit" component={Link} to="/chat">
                Chat
              </Button>
              <Button color="inherit" onClick={onLogout}>
                Logout
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Header
