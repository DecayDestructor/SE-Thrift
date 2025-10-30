import React, { createContext, useState, useContext, useEffect } from 'react'

const LocationContext = createContext()

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    lat: null,
    lon: null,
    error: null,
    loading: true,
    permissionStatus: null,
  })

  const requestLocation = async () => {
    try {
      if (!('geolocation' in navigator)) {
        setLocation((prev) => ({
          ...prev,
          error: 'Geolocation is not supported by your browser',
          loading: false,
          permissionStatus: 'unavailable',
        }))
        return
      }

      // First, check for permissions
      const permission = await navigator.permissions.query({
        name: 'geolocation',
      })
      setLocation((prev) => ({
        ...prev,
        permissionStatus: permission.state,
      }))

      // Watch for permission changes
      permission.addEventListener('change', () => {
        setLocation((prev) => ({
          ...prev,
          permissionStatus: permission.state,
        }))
        if (permission.state === 'granted') {
          getCurrentPosition()
        }
      })

      if (permission.state === 'granted') {
        getCurrentPosition()
      } else if (permission.state === 'prompt') {
        // This will trigger the permission prompt
        getCurrentPosition()
      } else {
        setLocation((prev) => ({
          ...prev,
          error: 'Location permission denied',
          loading: false,
        }))
      }
    } catch (error) {
      setLocation((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }))
    }
  }

  const getCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          error: null,
          loading: false,
          permissionStatus: 'granted',
        })
      },
      (error) => {
        setLocation((prev) => ({
          ...prev,
          error: `Location error: ${error.message}`,
          loading: false,
        }))
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  const setManualLocation = (lat, lon) => {
    if (isValidCoordinate(lat, lon)) {
      setLocation((prev) => ({
        ...prev,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        error: null,
      }))
      return true
    }
    return false
  }

  const isValidCoordinate = (lat, lon) => {
    const parsedLat = parseFloat(lat)
    const parsedLon = parseFloat(lon)
    return (
      !isNaN(parsedLat) &&
      !isNaN(parsedLon) &&
      parsedLat >= -90 &&
      parsedLat <= 90 &&
      parsedLon >= -180 &&
      parsedLon <= 180
    )
  }

  useEffect(() => {
    requestLocation()
  }, [])

  return (
    <LocationContext.Provider
      value={{
        ...location,
        requestLocation,
        setManualLocation,
        isValidCoordinate,
      }}
    >
      {children}
    </LocationContext.Provider>
  )
}

export const useLocation = () => {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
