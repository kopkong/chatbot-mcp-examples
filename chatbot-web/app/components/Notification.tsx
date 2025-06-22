'use client'

import React from 'react';
import { Notification as NotificationType } from '../types';

interface NotificationProps {
  notification: NotificationType;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  if (!notification.show) return null;

  return (
    <div className={`notification show ${notification.type}`}>
      <div className="notification-content">{notification.message}</div>
      <button 
        className="notification-close"
        onClick={onClose}
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  );
};

export default Notification; 