import mongoose from 'mongoose';
import { Notification } from '../models/index.js';

/** GET /api/notifications — current user's notifications, unread first */
export const listMine = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ read: 1, createdAt: -1 })
      .limit(50);
    const unread = notifications.filter((n) => !n.read).length;
    res.json({ count: notifications.length, unread, results: notifications });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/:id/read */
export const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification id.' });
    }
    const notification = await Notification.findOne({ _id: id, user: req.user._id });
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    res.json({ message: 'Notification marked as read.', notification });
  } catch (err) {
    next(err);
  }
};

/** PATCH /api/notifications/read-all */
export const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true, readAt: new Date() });
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    next(err);
  }
};
