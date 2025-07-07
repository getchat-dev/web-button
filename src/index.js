import createButton from '@/createButton';
import Chat from '@/Chat';
import deviceDetector from '@/deviceDetector';

export default {
    version: process.env.VERSION,
    deviceDetector,
    createButton,
    Messenger: Chat,
    Chat,
}