const express = require('express');
const NotificationService = require('../services/notificationService');
const router = express.Router();

// GET /api/notifications - Get all notifications with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, read, user } = req.query;
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      read: read === 'true' ? true : read === 'false' ? false : null,
      user
    };
    
    const result = await NotificationService.getNotifications(options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', async (req, res) => {
  try {
    const { user } = req.query;
    const count = await NotificationService.getUnreadCount(user);
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const { user } = req.body;
    const result = await NotificationService.markAllAsRead(user);
    res.json({ 
      success: true, 
      message: `Marked ${result.modifiedCount} notifications as read` 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PATCH /api/notifications/:id - Mark notification as read
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// DELETE /api/notifications/:id - Delete specific notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await NotificationService.deleteNotification(id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE /api/notifications - Delete all notifications
router.delete('/', async (req, res) => {
  try {
    const { user } = req.query;
    const result = await NotificationService.deleteAllNotifications(user);
    res.json({ 
      success: true, 
      message: `Deleted ${result.deletedCount} notifications` 
    });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

module.exports = router;
