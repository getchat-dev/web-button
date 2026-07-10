import createButton from '@/createButton.js';
import Chat from '@/Chat';
import GetchatButton from '@/GetchatButton';
import deviceDetector from '@/deviceDetector';

export const version = process.env.VERSION;

export { createButton, Chat, Chat as Messenger, GetchatButton, deviceDetector };

export type { CreateButtonOptions } from '@/createButton';
export type {
    ChatOptions,
    Notification,
    NotificationPermissionStatus,
    NotificationPermissionResult,
    InitWebPushNotificationsOptions,
    UnreadSummary,
} from '@/types';

// Kept for backwards compatibility with `import SDK from '@getchat-dev/web-button'`.
export default {
    version,
    deviceDetector,
    createButton,
    Messenger: Chat,
    Chat,
};
