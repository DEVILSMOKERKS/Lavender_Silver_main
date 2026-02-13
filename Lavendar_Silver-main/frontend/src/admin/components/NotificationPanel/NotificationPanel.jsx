import React from 'react';
import { Drawer, IconButton, Typography, Box, Button, CircularProgress } from '@mui/material';
import { Close as CloseIcon, DeleteOutline, NotificationsNone, CheckCircleOutline } from '@mui/icons-material';
import Slide from '@mui/material/Slide';

const NotificationPanel = ({ isOpen, onClose, notifications = [], onDeleteNotification, onMarkAsRead, onClearAll, loading }) => {
    return (
        <Drawer
            anchor="right"
            open={isOpen}
            onClose={onClose}
            transitionDuration={300}
            TransitionComponent={Slide}
            slotProps={{
                transition: { direction: "left" },
                paper: {
                    sx: {
                        width: 380,
                        backgroundColor: 'background.paper',
                    }
                }
            }}
        >
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsNone />
                        <Typography variant="h6">Notifications</Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Box sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider'
                }}>
                    <Button
                        startIcon={<DeleteOutline />}
                        onClick={onClearAll}
                        color="inherit"
                        size="small"
                        disabled={loading || notifications.length === 0}
                    >
                        Clear All
                    </Button>
                </Box>

                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2
                }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    ) : notifications.length === 0 ? (
                        <Box sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 1,
                            color: 'text.secondary'
                        }}>
                            <NotificationsNone sx={{ fontSize: 40 }} />
                            <Typography>No notifications yet</Typography>
                        </Box>
                    ) : (
                        notifications.map((notification) => (
                            <Box
                                key={notification.id}
                                sx={{
                                    mb: 1,
                                    p: 2,
                                    borderRadius: 1,
                                    bgcolor: notification.is_read ? 'action.hover' : 'background.paper',
                                    border: 1,
                                    borderColor: 'divider',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 2
                                }}
                            >
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {notification.message}
                                    </Typography>
                                    <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                                        {notification.time}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDeleteNotification(notification.id)}
                                        color="error"
                                        disabled={loading}
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                    {!notification.is_read && (
                                        <IconButton
                                            size="small"
                                            onClick={() => onMarkAsRead(notification.id)}
                                            color="success"
                                            disabled={loading}
                                        >
                                            <CheckCircleOutline fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </Drawer>
    );
};

export default NotificationPanel;
