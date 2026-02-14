
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  User as FirebaseUser
} from "firebase/auth";
import { Complaint, User, Notification, Message, SystemSettings, UserRole } from '../types';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAzjhTFJARI2LBnQpO2NhfCXTif9sIyEUs",
  authDomain: "tide-hotelsmenu.firebaseapp.com",
  projectId: "tide-hotelsmenu",
  storageBucket: "tide-hotelsmenu.firebasestorage.app",
  messagingSenderId: "328255495624",
  appId: "1:328255495624:web:6e139ff9442ba24719b4fd"
};

const app = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);

// Metadata Bridge
const getMetadata = () => JSON.parse(localStorage.getItem('user_metadata') || '{}');
const saveMetadata = (uid: string, data: any) => {
  const meta = getMetadata();
  meta[uid] = { ...meta[uid], ...data };
  localStorage.setItem('user_metadata', JSON.stringify(meta));
};

type Listener = (data: any) => void;
const listeners: Record<string, Set<Listener>> = {};

const subscribe = (event: string, cb: Listener) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(cb);
  return () => { listeners[event].delete(cb); };
};

const notify = (event: string, data: any) => {
  if (listeners[event]) {
    listeners[event].forEach(cb => cb(data));
  }
};

let complaints: Complaint[] = [
  {
    id: 'TKT-1001',
    roomNumber: '402',
    guestName: 'John Doe',
    message: 'The air conditioning is making a rattling noise.',
    status: 'in-progress',
    priority: 'medium',
    createdAt: Date.now() - 3600000,
    createdBy: 'guest-1',
    responses: [
      { id: '1', senderId: 'staff-1', senderName: 'Sarah Staff', senderRole: 'staff', text: 'We have dispatched maintenance. They will arrive in 10 minutes.', timestamp: Date.now() - 1800000 }
    ]
  }
];

let notifications: Notification[] = [];
let settings: SystemSettings = {
  allowAudioUploads: true,
  allowVideoUploads: true,
  hotelName: 'Tidé Hotels and Resorts',
  primaryColor: '#b45309',
  emailSignupEnabled: true
};

const mapFirebaseUser = (fbUser: FirebaseUser | null): User | null => {
  if (!fbUser) return null;
  const email = fbUser.email || '';
  const meta = getMetadata()[fbUser.uid] || {};
  let role: UserRole = meta.role || 'guest';
  if (email === 'admin@hotel.com') role = 'admin';
  else if (email === 'staff@hotel.com') role = 'staff';
  
  return {
    id: fbUser.uid,
    name: fbUser.displayName || email.split('@')[0],
    email: email,
    role: role,
    roomNumber: meta.roomNumber || '',
    createdAt: Date.now(),
    status: 'online',
    emailVerified: fbUser.emailVerified
  };
};

export const mockFirebase = {
  auth: {
    onAuthStateChanged: (cb: (user: User | null) => void) => {
      return onAuthStateChanged(firebaseAuth, (fbUser) => {
        cb(mapFirebaseUser(fbUser));
      });
    },
    getCurrentUser: () => {
      return mapFirebaseUser(firebaseAuth.currentUser);
    },
    login: async (email: string, password?: string) => {
      if (!password) throw new Error('Password required');
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return mapFirebaseUser(credential.user) as User;
    },
    logout: async () => {
      await signOut(firebaseAuth);
    },
    resendVerification: async () => {
      const user = firebaseAuth.currentUser;
      if (user) {
        await sendEmailVerification(user);
      }
    },
    createUser: async (userData: { email?: string; password?: string; name?: string; role?: UserRole; roomNumber?: string }) => {
      if (!userData.email) throw new Error('Email required');
      const password = userData.password || 'Temporary123!';
      const credential = await createUserWithEmailAndPassword(firebaseAuth, userData.email, password);
      
      saveMetadata(credential.user.uid, { 
        role: userData.role || 'guest', 
        roomNumber: userData.roomNumber || '',
        name: userData.name || userData.email.split('@')[0],
        email: userData.email
      });

      if (userData.name) {
        await updateProfile(credential.user, { displayName: userData.name });
      }

      await sendEmailVerification(credential.user);
      await signOut(firebaseAuth);

      mockFirebase.firestore.notifications.add({
        message: `New User Registration: ${userData.name || userData.email} (${userData.role || 'guest'})`,
        type: 'broadcast'
      });
      
      return { email: userData.email } as any; 
    },
    hasAdmin: () => {
      const meta = getMetadata();
      return Object.values(meta).some((u: any) => u.role === 'admin' || u.email === 'admin@hotel.com');
    }
  },
  firestore: {
    complaints: {
      onSnapshot: (cb: (data: Complaint[]) => void) => {
        cb([...complaints]);
        return subscribe('complaints', cb);
      },
      add: async (data: Partial<Complaint>) => {
        const id = `TKT-${Math.floor(Math.random() * 10000)}`;
        const newComplaint: Complaint = {
          id,
          roomNumber: data.roomNumber || '000',
          guestName: data.guestName,
          message: data.message || '',
          status: 'submitted',
          priority: data.priority || 'medium',
          createdAt: Date.now(),
          createdBy: data.createdBy || 'anon',
          responses: [],
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType
        };
        complaints.unshift(newComplaint);
        notify('complaints', [...complaints]);
        mockFirebase.firestore.notifications.add({
          message: `New complaint from Room ${newComplaint.roomNumber}`,
          complaintId: id,
          type: 'complaint'
        });
        return id;
      },
      updateStatus: async (id: string, status: Complaint['status']) => {
        complaints = complaints.map(c => c.id === id ? { ...c, status } : c);
        notify('complaints', [...complaints]);
      },
      delete: async (id: string) => {
        complaints = complaints.filter(c => c.id !== id);
        notify('complaints', [...complaints]);
      },
      addResponse: async (complaintId: string, message: Partial<Message>) => {
        const newMessage: Message = {
          id: Date.now().toString(),
          senderId: message.senderId || 'system',
          senderName: message.senderName || 'Staff',
          senderRole: message.senderRole || 'staff',
          text: message.text || '',
          timestamp: Date.now()
        };
        complaints = complaints.map(c => {
          if (c.id === complaintId) {
            return { ...c, responses: [...c.responses, newMessage] };
          }
          return c;
        });
        notify('complaints', [...complaints]);
        return newMessage;
      }
    },
    notifications: {
      onSnapshot: (cb: (data: Notification[]) => void) => {
        cb([...notifications]);
        return subscribe('notifications', cb);
      },
      add: async (data: Partial<Notification>) => {
        const newNote: Notification = {
          id: Date.now().toString(),
          message: data.message || '',
          complaintId: data.complaintId,
          recipientId: data.recipientId,
          type: data.type || 'broadcast',
          read: false,
          createdAt: Date.now()
        };
        notifications.unshift(newNote);
        notify('notifications', [...notifications]);
        return newNote;
      },
      markRead: async (id: string) => {
        notifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
        notify('notifications', [...notifications]);
      }
    },
    users: {
      onSnapshot: (cb: (data: User[]) => void) => {
        const meta = getMetadata();
        const usersList: User[] = Object.keys(meta).map(uid => ({
          id: uid,
          name: meta[uid].name || 'Hotel Guest',
          email: meta[uid].email || 'guest@user.com',
          role: meta[uid].role,
          roomNumber: meta[uid].roomNumber,
          createdAt: Date.now(),
          status: 'online',
          emailVerified: false
        }));
        cb(usersList);
        return subscribe('users', cb);
      },
      update: async (userId: string, data: Partial<User>) => {
        saveMetadata(userId, data);
        notify('users', []); 
      },
      updateStatus: async (userId: string, status: 'online' | 'offline') => {}
    },
    settings: {
      onSnapshot: (cb: (data: SystemSettings) => void) => {
        cb(settings);
        return subscribe('settings', cb);
      },
      update: async (newSettings: Partial<SystemSettings>) => {
        settings = { ...settings, ...newSettings };
        notify('settings', settings);
      }
    }
  },
  storage: {
    upload: async (file: File) => {
      await new Promise(r => setTimeout(r, 1000));
      return URL.createObjectURL(file);
    }
  }
};
