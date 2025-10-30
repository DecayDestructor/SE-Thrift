import React, { useState, useEffect, useRef } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
  Avatar,
  ListItemAvatar,
  CircularProgress,
  IconButton,
  Badge,
} from '@mui/material'
import { Notifications as NotificationsIcon } from '@mui/icons-material'
import { sendMessage, getMessages, getUsers } from '../services/api'

const POLLING_INTERVAL = 3000 // Poll every 3 seconds

const Chat = ({ user }) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [availableUsers, setAvailableUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [unreadMessages, setUnreadMessages] = useState({})
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)
  const audioRef = useRef(new Audio('/message.mp3'))

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startPolling = () => {
    if (pollingRef.current) return

    pollingRef.current = setInterval(() => {
      if (user) fetchMessages()
    }, POLLING_INTERVAL)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return

      try {
        setLoading(true)
        // Fetch both messages and users
        const [messagesData, usersData] = await Promise.all([
          getMessages(user.id),
          getUsers(),
        ])

        // Filter out current user from available users
        const otherUsers = usersData.filter((u) => u.id !== user.id)

        setMessages(messagesData)
        setAvailableUsers(otherUsers)

        // Start polling for new messages
        const cleanup = startPolling()
        return cleanup
      } catch (error) {
        console.error('Error fetching initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()

    // Cleanup polling on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [user])

  const fetchMessages = async () => {
    try {
      const data = await getMessages(user.id)
      if (data.length > messages.length) {
        // New messages received
        const newMessages = data.slice(messages.length)
        const hasNewMessage = newMessages.some(
          (msg) => msg.receiver_id === user.id
        )

        if (hasNewMessage) {
          audioRef.current.play().catch(() => {}) // Play notification sound

          // Update unread messages count for each sender
          newMessages.forEach((msg) => {
            if (msg.receiver_id === user.id) {
              setUnreadMessages((prev) => ({
                ...prev,
                [msg.sender_id]: (prev[msg.sender_id] || 0) + 1,
              }))
            }
          })
        }
      }
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!selectedUser || !newMessage.trim()) return

    try {
      await sendMessage({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        message: newMessage.trim(),
      })
      setNewMessage('')
      fetchMessages()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Messages
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom>
              Available Users
            </Typography>
            <List sx={{ overflow: 'auto', height: 'calc(100% - 40px)' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                availableUsers.map((chatUser) => {
                  // Get the last message with this user
                  const lastMessage = messages
                    .filter(
                      (msg) =>
                        (msg.sender_id === chatUser.id &&
                          msg.receiver_id === user.id) ||
                        (msg.sender_id === user.id &&
                          msg.receiver_id === chatUser.id)
                    )
                    .slice(-1)[0]

                  return (
                    <ListItem
                      button
                      key={chatUser.id}
                      selected={selectedUser?.id === chatUser.id}
                      onClick={() => {
                        setSelectedUser(chatUser)
                        // Clear unread messages when selecting user
                        setUnreadMessages((prev) => ({
                          ...prev,
                          [chatUser.id]: 0,
                        }))
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={unreadMessages[chatUser.id] || 0}
                          color="primary"
                        >
                          <Avatar>
                            {chatUser.name
                              ? chatUser.name[0].toUpperCase()
                              : '?'}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={chatUser.name}
                        secondary={lastMessage?.message || 'No messages yet'}
                      />
                    </ListItem>
                  )
                })
              )}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              height: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {selectedUser ? (
              <>
                <Box
                  sx={{ mb: 2, p: 2, borderBottom: 1, borderColor: 'divider' }}
                >
                  <Typography variant="h6">
                    Chat with User {selectedUser.id}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                  <List>
                    {messages
                      .filter(
                        (msg) =>
                          (msg.sender_id === user.id &&
                            msg.receiver_id === selectedUser.id) ||
                          (msg.receiver_id === user.id &&
                            msg.sender_id === selectedUser.id)
                      )
                      .map((msg) => (
                        <ListItem
                          key={msg.id}
                          sx={{
                            justifyContent:
                              msg.sender_id === user.id
                                ? 'flex-end'
                                : 'flex-start',
                          }}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              maxWidth: '70%',
                              bgcolor:
                                msg.sender_id === user.id
                                  ? 'primary.light'
                                  : 'grey.100',
                              color:
                                msg.sender_id === user.id
                                  ? 'white'
                                  : 'text.primary',
                            }}
                          >
                            <Typography variant="body1">
                              {msg.message}
                            </Typography>
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 1 }}
                            >
                              {formatMessageTime(msg.timestamp)}
                            </Typography>
                          </Paper>
                        </ListItem>
                      ))}
                    <div ref={messagesEndRef} />
                  </List>
                </Box>
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    display: 'flex',
                    gap: 1,
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                  }}
                >
                  <TextField
                    fullWidth
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    variant="outlined"
                    size="small"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </Button>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Select a chat to start messaging
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default Chat
