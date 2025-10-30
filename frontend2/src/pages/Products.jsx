import React, { useState, useEffect } from 'react'
import OrderDialog from '../components/OrderDialog'
import {
  Container,
  Grid,
  Typography,
  Button,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import {
  getProducts,
  addProduct,
  deleteProduct,
  searchProducts,
} from '../services/api'
import { useGeolocation } from '../hooks/useGeolocation'
import ProductCard from '../components/ProductCard'
import {
  LoadingSpinner,
  ErrorMessage,
  SuccessMessage,
} from '../components/Feedback'
import { useLocation } from '../contexts/LocationContext'

const Products = ({ user }) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const location = useLocation()
  const geolocation = useGeolocation()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openFilters, setOpenFilters] = useState(false)
  const [orderProduct, setOrderProduct] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest',
    radius: 5.0, // Default search radius in km
  })
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image_url: '',
    latitude: location?.lat || '',
    longitude: location?.lon || '',
  })

  const categories = [
    'all',
    'electronics',
    'clothing',
    'books',
    'furniture',
    'other',
  ]

  useEffect(() => {
    fetchProducts()
  }, []) // Initial fetch only

  const fetchProducts = async (searchLocation = null) => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (searchLocation) {
        // Use geospatial search if location is provided
        data = await searchProducts(
          searchLocation.lat,
          searchLocation.lon,
          filters.radius || 5.0
        )
      } else {
        // Fall back to regular product listing
        data = await getProducts()
      }
      setProducts(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value })
    fetchProducts() // Refresh products when filters change
  }

  const filteredProducts = products.filter((product) => {
    if (filters.category !== 'all' && product.category !== filters.category)
      return false
    if (filters.minPrice && product.price < parseFloat(filters.minPrice))
      return false
    if (filters.maxPrice && product.price > parseFloat(filters.maxPrice))
      return false
    if (
      filters.search &&
      !product.name.toLowerCase().includes(filters.search.toLowerCase())
    )
      return false
    return true
  })

  const displayProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-low':
        return a.price - b.price
      case 'price-high':
        return b.price - a.price
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at)
      default: // newest
        return new Date(b.created_at) - new Date(a.created_at)
    }
  })

  const handleAddProduct = async () => {
    try {
      if (!location?.lat || !location?.lon) {
        setError('Location is required. Please allow location access.')
        return
      }
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        seller_id: user.id,
        lat: location.lat,
        lon: location.lon,
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
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 4,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4" sx={{ mb: { xs: 2, md: 0 } }}>
          Products
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setOpenFilters(true)}
          >
            Filters
          </Button>
          {user?.role === 'seller' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpenDialog(true)}
            >
              Add Product
            </Button>
          )}
        </Box>
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
            No products found
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayProducts.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
              <ProductCard
                product={product}
                isOwner={user?.id === product.seller_id}
                onDelete={handleDeleteProduct}
                onOrder={() => setOrderProduct(product)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openFilters}
        onClose={() => setOpenFilters(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Filter Products
          <IconButton
            aria-label="close"
            onClick={() => setOpenFilters(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              label="Category"
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Location Search
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Search Radius (km)"
                  type="number"
                  value={filters.radius}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      radius: parseFloat(e.target.value) || 5.0,
                    })
                  }
                  InputProps={{
                    inputProps: { min: 0.1, step: 0.1 },
                  }}
                />
              </Grid>
            </Grid>
            <Button
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={async () => {
                try {
                  const geoLocation = await geolocation.getCurrentPosition()
                  await fetchProducts(geoLocation)
                  setOpenFilters(false)
                } catch (err) {
                  setError(
                    'Could not get your location. Please enable location services and try again.'
                  )
                }
              }}
            >
              Search Near Me
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilters(false)}>Close</Button>
          <Button
            onClick={() => {
              setFilters({
                search: '',
                category: 'all',
                minPrice: '',
                maxPrice: '',
                sortBy: 'newest',
              })
              setOpenFilters(false)
            }}
          >
            Reset Filters
          </Button>
        </DialogActions>
      </Dialog>

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
              {categories.slice(1).map((cat) => (
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
          <TextField
            fullWidth
            label="Latitude"
            value={newProduct.latitude}
            InputProps={{
              readOnly: true,
            }}
            margin="normal"
            helperText="Automatically fetched from your location"
          />
          <TextField
            fullWidth
            label="Longitude"
            value={newProduct.longitude}
            InputProps={{
              readOnly: true,
            }}
            margin="normal"
            helperText="Automatically fetched from your location"
          />
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

      <OrderDialog
        open={orderProduct !== null}
        onClose={() => setOrderProduct(null)}
        product={orderProduct}
        user={user}
        onOrderSuccess={() => {
          setSuccess('Order placed successfully!')
          setOrderProduct(null)
        }}
      />
    </Container>
  )
}

export default Products
