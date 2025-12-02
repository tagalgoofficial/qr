import { create } from 'zustand';
import notificationService from '../services/notificationService';
import orderService from '../services/orderService';

// Helper function to get status text
const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'في الانتظار';
    case 'confirmed':
      return 'مؤكد';
    case 'preparing':
      return 'قيد التحضير';
    case 'ready':
      return 'جاهز';
    case 'delivered':
      return 'تم التسليم';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
};

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isListening: false,
  soundEnabled: true,
  latestNewOrder: null, // Store the latest new order for toast display
  
  // Actions
  setNotifications: (notifications) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    set({ notifications, unreadCount });
  },
  
  markAsRead: async (notificationId, restaurantId, branchId = null) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, isRead: true, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
  
  markAllAsRead: async (restaurantId, branchId = null) => {
    try {
      await notificationService.markAllNotificationsAsRead();
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true, is_read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  },
  
  toggleSound: () => {
    set(state => ({ soundEnabled: !state.soundEnabled }));
  },
  
  playNotificationSound: () => {
    const { soundEnabled } = get();
    if (soundEnabled) {
      try {
        // Try to play audio file first
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Fallback to generated sound if audio file fails
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // Create a simple notification sound
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Set frequency and type
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.type = 'sine';
          
          // Set volume envelope
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
          gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
          
          // Play the sound
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
          
          // Second beep
          setTimeout(() => {
            const oscillator2 = audioContext.createOscillator();
            const gainNode2 = audioContext.createGain();
            
            oscillator2.connect(gainNode2);
            gainNode2.connect(audioContext.destination);
            
            oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator2.type = 'sine';
            
            gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
            gainNode2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
            
            oscillator2.start(audioContext.currentTime);
            oscillator2.stop(audioContext.currentTime + 0.3);
          }, 200);
        });
        
      } catch (error) {
        console.error('Error playing notification sound:', error);
      }
    }
  },
  
  // Start listening for new orders (polling instead of real-time)
  startListening: (restaurantId, branchId = null) => {
    const { isListening, pollingInterval } = get();
    if (isListening) return;
    
    set({ isListening: true });
    
    // Poll for notifications every 5 seconds
    const pollNotifications = async () => {
      try {
        const notifications = await notificationService.getUserNotifications();
        const previousNotifications = get().notifications;
        
        // Find new notifications
        const newNotifications = notifications.filter(notif => 
          !previousNotifications.find(prev => prev.id === notif.id)
        );
        
        // Find notifications that changed status
        const changedNotifications = notifications.filter(notif => {
          const prev = previousNotifications.find(p => p.id === notif.id);
          return prev && prev.status !== notif.status;
        });
        
        // Process new orders
        if (newNotifications.length > 0) {
          const latestNewOrder = newNotifications[0];
          
          set({ latestNewOrder });
          get().playNotificationSound();
          
          if (Notification.permission === 'granted') {
            new Notification('طلب جديد!', {
              body: `طلب جديد من ${latestNewOrder.customer_name || latestNewOrder.customerName} - رقم الطلب: ${latestNewOrder.order_number || latestNewOrder.orderNumber}`,
              icon: '/favicon.ico',
              tag: `new-order-${latestNewOrder.id}`
            });
          }
          
          setTimeout(() => {
            set({ latestNewOrder: null });
          }, 8000);
        }
        
        // Process changed orders
        if (changedNotifications.length > 0) {
          changedNotifications.forEach(changedOrder => {
            if (Notification.permission === 'granted') {
              new Notification('تحديث حالة الطلب', {
                body: `تم تحديث حالة الطلب ${changedOrder.order_number || changedOrder.orderNumber} إلى ${getStatusText(changedOrder.status)}`,
                icon: '/favicon.ico',
                tag: `order-update-${changedOrder.id}`
              });
            }
          });
        }
        
        // Update notifications
        get().setNotifications(notifications);
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };
    
    // Initial fetch
    pollNotifications();
    
    // Set up polling interval
    const interval = setInterval(pollNotifications, 5000);
    set({ pollingInterval: interval });
  },
  
  // Stop listening
  stopListening: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ isListening: false, pollingInterval: null });
    }
  },
  
  // Request notification permission
  requestNotificationPermission: async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  },
  
  // Clear latest new order (called when toast is closed)
  clearLatestNewOrder: () => {
    set({ latestNewOrder: null });
  }
}));

export default useNotificationStore;

