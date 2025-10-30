import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  IconButton,
  Card,
  CardContent,
  Alert,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MyLocation as MyLocationIcon } from '@mui/icons-material'
import { useGeolocation } from '../hooks/useGeolocation'
import { searchProducts } from '../services/api'
import ProductCard from '../components/ProductCard'
import OrderDialog from '../components/OrderDialog'
import { LoadingSpinner, ErrorMessage } from '../components/Feedback'

const Home = ({ user }) => {
  const geolocation = useGeolocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useState({
    lat: '',
    lon: '',
    radius: '5',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [products, setProducts] = useState([])
  const [orderProduct, setOrderProduct] = useState(null)

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Typography variant="h2" align="center" gutterBottom>
        Welcome to Thrift Management
      </Typography>
      <Typography variant="h5" align="center" color="textSecondary" paragraph>
        Find and sell second-hand items in your area
      </Typography>
      <Box
        sx={{
          mt: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="h6">Search Products Near You</Typography>
        <Box
          component="form"
          sx={{
            width: '100%',
            maxWidth: 500,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <TextField
            label="Latitude"
            type="number"
            value={searchParams.lat}
            onChange={(e) =>
              setSearchParams({ ...searchParams, lat: e.target.value })
            }
          />
          <TextField
            label="Longitude"
            type="number"
            value={searchParams.lon}
            onChange={(e) =>
              setSearchParams({ ...searchParams, lon: e.target.value })
            }
          />
          <TextField
            label="Radius (km)"
            type="number"
            value={searchParams.radius}
            onChange={(e) =>
              setSearchParams({ ...searchParams, radius: e.target.value })
            }
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={async () => {
                try {
                  setError(null)
                  setLoading(true)
                  const data = await searchProducts(
                    parseFloat(searchParams.lat),
                    parseFloat(searchParams.lon),
                    parseFloat(searchParams.radius)
                  )
                  setProducts(data)
                } catch (err) {
                  setError(err.message)
                } finally {
                  setLoading(false)
                }
              }}
              disabled={!searchParams.lat || !searchParams.lon || loading}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<MyLocationIcon />}
              onClick={async () => {
                try {
                  setError(null)
                  setLoading(true)
                  const location = await geolocation.getCurrentPosition()
                  setSearchParams({
                    ...searchParams,
                    lat: location.lat.toString(),
                    lon: location.lon.toString(),
                  })
                  const data = await searchProducts(
                    location.lat,
                    location.lon,
                    parseFloat(searchParams.radius)
                  )
                  setProducts(data)
                } catch (err) {
                  setError(
                    'Could not get your location. Please enable location services and try again.'
                  )
                } finally {
                  setLoading(false)
                }
              }}
              disabled={loading}
            >
              Use My Location
            </Button>
          </Box>
        </Box>
      </Box>

      {error && (
        <Box sx={{ mt: 2 }}>
          <ErrorMessage message={error} onClose={() => setError(null)} />
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LoadingSpinner />
        </Box>
      ) : products.length > 0 ? (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Products Near You
          </Typography>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard
                  product={product}
                  isOwner={user?.id === product.seller_id}
                  onOrder={() => setOrderProduct(product)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          {searchParams.lat && searchParams.lon ? (
            <Typography color="text.secondary">
              No products found in your area. Try increasing the search radius.
            </Typography>
          ) : (
            <Typography color="text.secondary">
              Enter coordinates or use your location to find products near you.
            </Typography>
          )}
        </Box>
      )}

      <OrderDialog
        open={orderProduct !== null}
        onClose={() => setOrderProduct(null)}
        product={orderProduct}
        user={user}
        onOrderSuccess={() => {
          setOrderProduct(null)
          navigate('/orders')
        }}
      />
    </Container>
  )
}

export default Home
