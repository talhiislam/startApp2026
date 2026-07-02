import { Platform } from 'react-native';

// For Android emulator, 10.0.2.2 points to the host machine's localhost.
// For iOS simulator, localhost works fine.
// If using Expo Go on a physical device, you need to replace this with your computer's local IP address (e.g., 'http://192.168.0.10:3000/api').
export const API_URL = 'http://10.253.190.203:3000/api';
