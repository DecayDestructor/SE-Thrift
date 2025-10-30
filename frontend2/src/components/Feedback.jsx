import React from 'react'
import { CircularProgress, Alert, Box } from '@mui/material'

export const LoadingSpinner = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="200px"
  >
    <CircularProgress />
  </Box>
)

export const ErrorMessage = ({ message, onClose }) => (
  <Alert severity="error" sx={{ mb: 2 }} onClose={onClose}>
    {message}
  </Alert>
)

export const SuccessMessage = ({ message }) => (
  <Alert severity="success" sx={{ mb: 2 }}>
    {message}
  </Alert>
)
