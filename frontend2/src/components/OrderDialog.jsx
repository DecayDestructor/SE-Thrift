import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  CircularProgress,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { placeOrder, api } from '../services/api'
import { LoadingSpinner, ErrorMessage } from './Feedback'

// Mock delay function for demonstration
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const OrderDialog = ({ open, onClose, product, user, onOrderSuccess }) => {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [showGPay, setShowGPay] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)

  const steps = [
    'Create Order',
    'Initialize Transaction',
    'Process Payment',
    'Verify Payment',
  ]

  const handleOrder = async () => {
    try {
      setLoading(true)
      setError(null)
      setActiveStep(0)

      // Step 1: Place the order
      const orderData = {
        buyer_id: user.id,
        product_id: product.id,
        quantity: parseInt(quantity),
      }
      await delay(1500) // Simulate network delay
      const orderResult = await placeOrder(orderData)
      setActiveStep(1)

      // Step 2: Create transaction
      await delay(1000)
      const transactionResponse = await api.post('/transactions', {
        order_id: orderResult.id,
      })
      const transactionId = transactionResponse.data.id
      setActiveStep(2)

      // Step 3: Show Google Pay UI and process payment
      setShowGPay(true)
      await delay(1500)
      setProcessingPayment(true)
      await delay(2000)
      await api.post(`/payment/process?transaction_id=${transactionId}`)
      setProcessingPayment(false)
      setShowGPay(false)
      setActiveStep(3)

      // Step 4: Verify payment
      await delay(1000)
      const verificationResponse = await api.post(
        `/payment/verify?transaction_id=${transactionId}`
      )

      if (verificationResponse.data.approved) {
        await delay(1000)
        onOrderSuccess()
        onClose()
      } else {
        throw new Error('Payment was declined')
      }
    } catch (err) {
      setError(err.message)
      setShowGPay(false)
      setProcessingPayment(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Place Order
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <ErrorMessage message={error} onClose={() => setError(null)} />
        )}

        {/* Order Details */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{product?.name}</Typography>
          <Typography color="text.secondary" gutterBottom>
            {product?.description}
          </Typography>
          <Typography variant="h6" color="primary" gutterBottom>
            ${product?.price.toFixed(2)}
          </Typography>
        </Box>

        {/* Quantity Input */}
        <TextField
          fullWidth
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(1, parseInt(e.target.value) || 1))
          }
          inputProps={{ min: 1 }}
          margin="normal"
        />
        <Typography variant="h6" sx={{ mt: 2, mb: 3 }}>
          Total: ${(product?.price * quantity).toFixed(2)}
        </Typography>

        {/* Transaction Steps */}
        {loading && (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {/* Mock Google Pay UI */}
            {showGPay && (
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  mb: 2,
                  textAlign: 'center',
                  bgcolor: '#ffffff',
                  border: '1px solid #dadce0',
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <img
                    src="https://developers.google.com/static/pay/api/images/Google_Pay_Mark.svg"
                    alt="Google Pay"
                    style={{ height: 40 }}
                  />
                </Box>
                {processingPayment ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={20} />
                    <Typography>Processing payment...</Typography>
                  </Box>
                ) : (
                  <Typography>Confirming your payment...</Typography>
                )}
              </Paper>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleOrder}
          variant="contained"
          color="primary"
          disabled={loading || !user}
        >
          {loading ? <LoadingSpinner size={24} /> : 'Place Order'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default OrderDialog
