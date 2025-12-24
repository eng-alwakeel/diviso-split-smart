import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { isNativePlatform, getPlatform } from './native';
import { supabase } from '@/integrations/supabase/client';

// Initialize push notifications for native platforms
export const initPushNotifications = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('Push notifications not available on web');
    return false;
  }

  try {
    // Check current permission status
    const permStatus = await PushNotifications.checkPermissions();
    
    if (permStatus.receive === 'prompt') {
      // Request permission
      const requestResult = await PushNotifications.requestPermissions();
      if (requestResult.receive !== 'granted') {
        console.log('Push notification permission denied');
        return false;
      }
    } else if (permStatus.receive !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    // Register for push notifications
    await PushNotifications.register();

    // Listen for successful registration
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      await savePushToken(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error:', error);
    });

    // Listen for push notifications received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      // The in-app notification system will handle display
    });

    // Listen for push notification actions (when user taps the notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('Push notification action performed:', action);
      handleNotificationAction(action);
    });

    console.log('Push notifications initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return false;
  }
};

// Save push token to database
const savePushToken = async (token: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log('No user logged in, cannot save push token');
      return;
    }

    const platform = getPlatform();

    // Upsert the token (update if exists, insert if not)
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          user_id: user.id,
          token: token,
          platform: platform,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,platform'
        }
      );

    if (error) {
      console.error('Error saving push token:', error);
    } else {
      console.log('Push token saved successfully');
    }
  } catch (error) {
    console.error('Error in savePushToken:', error);
  }
};

// Handle notification action (when user taps notification)
const handleNotificationAction = (action: ActionPerformed): void => {
  const data = action.notification.data;
  
  if (!data) return;

  // Navigate based on notification type
  const notificationType = data.type as string;
  
  switch (notificationType) {
    case 'referral_joined':
    case 'referral_completed':
      window.location.href = '/referral-center';
      break;
    case 'expense_created':
    case 'expense_approved':
    case 'expense_rejected':
      if (data.group_id) {
        window.location.href = `/group/${data.group_id}`;
      }
      break;
    case 'new_message':
      if (data.group_id) {
        window.location.href = `/group/${data.group_id}?tab=chat`;
      }
      break;
    case 'group_invite':
      window.location.href = '/notifications';
      break;
    default:
      window.location.href = '/notifications';
  }
};

// Remove push token on logout
export const removePushToken = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    const platform = getPlatform();

    await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform);

    console.log('Push token removed');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
};

// Check if push notifications are enabled
export const isPushEnabled = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;

  try {
    const permStatus = await PushNotifications.checkPermissions();
    return permStatus.receive === 'granted';
  } catch {
    return false;
  }
};
