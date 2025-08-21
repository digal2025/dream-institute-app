const Notification = require('../backend/models/Notification');

class NotificationService {
  /**
   * Create a notification with duplicate prevention
   */
  static async createNotification(data) {
    try {
      const { type, entityId, entityName, user, message, details = {} } = data;
      
      // Check for recent duplicate notification (within 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const existingNotification = await Notification.findOne({
        type,
        entityId,
        user,
        timestamp: { $gte: fiveMinutesAgo }
      });
      
      if (existingNotification) {
        // Update existing notification instead of creating duplicate
        return await Notification.findByIdAndUpdate(
          existingNotification._id,
          {
            message,
            details,
            timestamp: new Date()
          },
          { new: true }
        );
      }
      
      // Create new notification
      const notification = new Notification({
        type,
        entityId,
        entityName,
        user,
        message,
        details,
        timestamp: new Date()
      });
      
      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      // Don't throw error to prevent breaking main operations
      return null;
    }
  }

  /**
   * Get all notifications with pagination
   */
  static async getNotifications(options = {}) {
    try {
      const { page = 1, limit = 50, read = null, user = null } = options;
      const skip = (page - 1) * limit;
      
      const query = {};
      if (read !== null) query.read = read;
      if (user) query.user = user;
      
      const notifications = await Notification.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Notification.countDocuments(query);
      
      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        { read: true },
        { new: true }
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(user = null) {
    try {
      const query = { read: false };
      if (user) query.user = user;
      
      return await Notification.updateMany(query, { read: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  static async deleteNotification(notificationId) {
    try {
      return await Notification.findByIdAndDelete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  static async deleteAllNotifications(user = null) {
    try {
      const query = {};
      if (user) query.user = user;
      
      return await Notification.deleteMany(query);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(user = null) {
    try {
      const query = { read: false };
      if (user) query.user = user;
      
      return await Notification.countDocuments(query);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

module.exports = NotificationService;
