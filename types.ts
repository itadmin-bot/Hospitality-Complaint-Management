
export type UserRole = 'admin' | 'staff' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roomNumber?: string;
  createdAt: number;
  lastLoginAt?: number;
  lastLogoutAt?: number;
  isOnline: boolean;
  status: 'online' | 'offline';
  emailVerified: boolean;
}

export type ComplaintStatus = 'submitted' | 'in-progress' | 'resolved';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: number;
}

export interface Complaint {
  id: string;
  roomNumber: string;
  guestName?: string;
  message: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video' | 'image' | 'file';
  status: ComplaintStatus;
  priority: Priority;
  createdAt: number;
  createdBy: string;
  responses: Message[];
}

export interface Notification {
  id: string;
  recipientId?: string; // If empty, it's a broadcast
  complaintId?: string;
  message: string;
  type: 'complaint' | 'reply' | 'broadcast';
  read: boolean;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: 'register' | 'login' | 'logout' | 'complaint_submitted' | 'status_updated' | 'reply_sent';
  timestamp: number;
  details: string;
}

export interface SystemSettings {
  allowAudioUploads: boolean;
  allowVideoUploads: boolean;
  hotelName: string;
  primaryColor: string;
  emailSignupEnabled: boolean;
}
