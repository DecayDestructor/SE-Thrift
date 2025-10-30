import React from 'react'
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  IconButton,
  Box,
  Chip,
  Button,
} from '@mui/material'
import {
  FavoriteBorder,
  Share,
  Delete as DeleteIcon,
} from '@mui/icons-material'

const ProductCard = ({ product, isOwner, onDelete, onOrder }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    }
  }

  return (
    <Card
      elevation={3}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardMedia
        component="img"
        height="200"
        image={product.image_url || 'https://via.placeholder.com/200'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap>
          {product.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            mb: 2,
            height: '40px',
          }}
        >
          {product.description}
        </Typography>
        {product.category && (
          <Chip label={product.category} size="small" sx={{ mb: 1 }} />
        )}
        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
          ${product.price.toFixed(2)}
        </Typography>
      </CardContent>
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={handleShare} size="small">
            <Share fontSize="small" />
          </IconButton>
          <IconButton size="small">
            <FavoriteBorder fontSize="small" />
          </IconButton>
        </Box>
        {isOwner ? (
          <Box>
            <IconButton
              onClick={() => onDelete(product.id)}
              color="error"
              size="small"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => onOrder(product)}
          >
            Buy Now
          </Button>
        )}
      </Box>
    </Card>
  )
}

export default ProductCard
