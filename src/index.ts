import createButton from '@/createButton.js';
import Chat from '@/Chat';
import deviceDetector from '@/deviceDetector';

export default {
    version: process.env.VERSION,
    deviceDetector,
    createButton,
    Messenger: Chat,
    Chat,
}