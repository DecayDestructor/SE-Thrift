import React, { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { getProducts, addProduct, deleteProduct } from '../services/api'
import ProductCard from '../components/ProductCard'
import {
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from '../components/Feedback'
import { useLocation } from '../contexts/LocationContext'

const MyProducts = ({ user }) => {
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    latitude: location?.lat || '',
    longitude: location?.lon || '',
  })

  const categories = ['electronics', 'clothing', 'books', 'furniture', 'other']

  useEffect(() => {
    fetchProducts()
  }, [])

  // Update form when location changes
  useEffect(() => {
    if (location.lat && location.lon) {
      setNewProduct((prev) => ({
        ...prev,
        latitude: location.lat.toString(),
        longitude: location.lon.toString(),
      }))
    }
  }, [location.lat, location.lon])

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProducts()
      // Filter products to show only the seller's products
      const myProducts = data.filter(
        (product) => product.seller_id === user?.id
      )
      setProducts(myProducts)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    if (!newProduct.name.trim()) {
      setError('Product name is required')
      return false
    }
    if (!newProduct.description.trim()) {
      setError('Product description is required')
      return false
    }
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      setError('Please enter a valid price')
      return false
    }
    if (!newProduct.category) {
      setError('Please select a category')
      return false
    }
    if (!newProduct.image_url.trim()) {
      setError('Image URL is required')
      return false
    }
    if (!newProduct.latitude || !newProduct.longitude) {
      setError('Location coordinates are required')
      return false
    }
    if (
      !location.isValidCoordinate(newProduct.latitude, newProduct.longitude)
    ) {
      setError(
        'Please enter valid latitude (-90 to 90) and longitude (-180 to 180) values'
      )
      return false
    }
    return true
  }

  const handleAddProduct = async () => {
    try {
      if (!validateForm()) {
        return
      }

      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        seller_id: user.id,
        lat: parseFloat(newProduct.latitude),
        lon: parseFloat(newProduct.longitude),
      }

      await addProduct(productData)
      setOpenDialog(false)
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        image_url: '',
        latitude: location?.lat || '',
        longitude: location?.lon || '',
      })
      setSuccess('Product added successfully!')
      fetchProducts()
    } catch (error) {
      setError(error.message || 'Error adding product')
    }
  }

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId)
      setSuccess('Product deleted successfully!')
      fetchProducts()
    } catch (error) {
      setError(error.message || 'Error deleting product')
    }
  }

  if (user?.role !== 'seller') {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h5" color="error">
          Access Denied. This page is only for sellers.
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">My Products</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          Add New Product
        </Button>
      </Box>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      {success && (
        <SuccessMessage message={success} onClose={() => setSuccess('')} />
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LoadingSpinner />
        </Box>
      ) : products.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="text.secondary">
            You haven't added any products yet
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpenDialog(true)}
            sx={{ mt: 2 }}
          >
            Add Your First Product
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard
                product={product}
                isOwner={true}
                onDelete={handleDeleteProduct}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add New Product
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={newProduct.description}
            onChange={(e) =>
              setNewProduct({ ...newProduct, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            required
          />
          <TextField
            fullWidth
            label="Price"
            type="number"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            margin="normal"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">$</InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              value={newProduct.category}
              label="Category"
              onChange={(e) =>
                setNewProduct({ ...newProduct, category: e.target.value })
              }
              required
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Image URL"
            value={newProduct.image_url}
            onChange={(e) =>
              setNewProduct({ ...newProduct, image_url: e.target.value })
            }
            margin="normal"
            required
          />
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Location Information
            </Typography>
            {location.loading ? (
              <Typography color="text.secondary">
                Fetching your location...
              </Typography>
            ) : location.error ? (
              <>
                <Typography color="error" gutterBottom>
                  {location.error}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Please enter location manually:
                </Typography>
              </>
            ) : (
              <Typography color="success.main" gutterBottom>
                Location successfully detected
              </Typography>
            )}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Latitude"
                  value={newProduct.latitude}
                  onChange={(e) => {
                    const lat = e.target.value
                    setNewProduct((prev) => ({ ...prev, latitude: lat }))
                    if (location.isValidCoordinate(lat, newProduct.longitude)) {
                      location.setManualLocation(lat, newProduct.longitude)
                    }
                  }}
                  margin="normal"
                  type="number"
                  inputProps={{
                    step: '0.000001',
                    min: -90,
                    max: 90,
                  }}
                  helperText="Enter a value between -90 and 90"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Longitude"
                  value={newProduct.longitude}
                  onChange={(e) => {
                    const lon = e.target.value
                    setNewProduct((prev) => ({ ...prev, longitude: lon }))
                    if (location.isValidCoordinate(newProduct.latitude, lon)) {
                      location.setManualLocation(newProduct.latitude, lon)
                    }
                  }}
                  margin="normal"
                  type="number"
                  inputProps={{
                    step: '0.000001',
                    min: -180,
                    max: 180,
                  }}
                  helperText="Enter a value between -180 and 180"
                />
              </Grid>
            </Grid>
            {!location.loading && !location.error && (
              <Button
                size="small"
                onClick={() => {
                  location.requestLocation()
                  setNewProduct((prev) => ({
                    ...prev,
                    latitude: location.lat || '',
                    longitude: location.lon || '',
                  }))
                }}
                sx={{ mt: 1 }}
              >
                Refresh Location
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddProduct}
            variant="contained"
            color="primary"
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default MyProducts
