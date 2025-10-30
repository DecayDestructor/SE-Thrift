import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  InputAdornment,
  Paper,
  Slider,
  useTheme,
  alpha,
} from '@mui/material'
import {
  Search as SearchIcon,
  MyLocation as MyLocationIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material'
import { motion } from 'framer-motion'
import { searchProducts } from '../services/api'

const Landing = () => {
  const theme = useTheme()
  const [location, setLocation] = useState({ lat: '', lon: '' })
  const [radius, setRadius] = useState(5)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleSearch = async () => {
    if (!location.lat || !location.lon) return

    setLoading(true)
    try {
      const data = await searchProducts(location.lat, location.lon, radius)
      setProducts(data)
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          height: '70vh',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(45deg, #1a1a1a 30%, #2c2c2c 90%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Container maxWidth="md">
            <Typography
              variant="h1"
              align="center"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '3rem', md: '4.5rem' },
                mb: 4,
              }}
            >
              Find Thrift Near You
            </Typography>

            {/* Search Section */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(8px)',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    value={location.lat}
                    onChange={(e) =>
                      setLocation({ ...location, lat: e.target.value })
                    }
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleGetLocation}>
                            <MyLocationIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    value={location.lon}
                    onChange={(e) =>
                      setLocation({ ...location, lon: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleSearch}
                    disabled={!location.lat || !location.lon}
                    startIcon={<SearchIcon />}
                    sx={{ height: '56px' }}
                  >
                    Search
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Typography gutterBottom>
                    Search Radius: {radius} km
                  </Typography>
                  <Slider
                    value={radius}
                    onChange={(_, newValue) => setRadius(newValue)}
                    min={1}
                    max={20}
                    valueLabelDisplay="auto"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Container>
        </motion.div>
      </Box>

      {/* Products Section */}
      <Container maxWidth="lg" sx={{ my: 8 }}>
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
              Products Near You
            </Typography>
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        ':hover': {
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={
                          product.image_url || 'https://via.placeholder.com/200'
                        }
                        alt={product.name}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6">
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {product.description}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ${product.price}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
        )}
      </Container>
    </Box>
  )
}

export default Landing
