import axios from 'axios';
import { io, Socket } from 'socket.io-client';

let chatSocket: Socket | null = null;

const refreshToken = async (): Promise<string | null> => {
  try {
    const response = await axios.get('/auth/refresh', { withCredentials: true });
    const newToken = response.data.accessToken;
    
    const storage = localStorage.getItem('accessToken') 
      ? localStorage 
      : sessionStorage;
    storage.setItem('accessToken', newToken);
    
    return newToken;
  } catch (error) {
    return null;
  }
};

// const setupSocket = (token: string): Socket => {
//   return io('/api/chat', {
//     auth: { token },
//     path: '/socket.io',
//     transports: ['websocket'],
//     reconnectionAttempts: 3,
//   });
// };

// export const setupChatSocket = (token: string, onMessage: (msg: any) => void) => {
//   const socket = io(`${process.env.REACT_APP_WS_URL || 'http://localhost:4132/api'}/chat`, {
//     path: '/socket.io',
//     transports: ['websocket'],
//     auth: { token },
//     query: {
//       clientType: 'web'
//     }
//   });

//   socket.on('connect', () => {
//     console.log('Socket connected');
//   });

//   socket.on('chat:message', onMessage); // Исправлено с 'new_message' на 'chat:message'

//   socket.on('error', (err) => {
//     console.error('Socket error:', err);
//   });

//   return socket;
// };


export const createApiClient = (logoutFn?: () => Promise<void>) => {
  const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4132/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
    maxRedirects: 0,
  });

  const setupSocket = (token: string): Socket => {
    const socket = io(`${process.env.REACT_APP_WS_URL}/chat`, {
      auth: { token },
      transports: ['websocket'],
    });

    // Добавляем обработчики для документов
    socket.on('doc:update', (data) => {
      console.log('Получено обновление документа', data);
    });

    return socket;
  };

  // Interceptor для добавления токена
  apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Инициализация сокета при первом запросе
      if (!chatSocket) {
        chatSocket = setupSocket(token);
        
        chatSocket.on('auth_error', async () => {
          const newToken = await refreshToken();
          if (newToken) {
            chatSocket?.disconnect();
            chatSocket = setupSocket(newToken);
          } else {
            logoutFn?.();
          }
        });
      }
    }
    return config;
  });

  // Interceptor для обработки 401
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          const refreshResponse = await axios.get(
            `${process.env.REACT_APP_API_URL || 'http://localhost:4132/api'}/auth/refresh`,
            { withCredentials: true }
          );
          
          const newAccessToken = refreshResponse.data.accessToken;
          
          if (newAccessToken) {
            const storage = localStorage.getItem('accessToken') 
              ? localStorage 
              : sessionStorage;
            storage.setItem('accessToken', newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            if (chatSocket) {
              chatSocket.disconnect();
              chatSocket = setupSocket(newAccessToken);
            }

            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          if (logoutFn) {
            await logoutFn();
          }
          
          // Убираем window.location.href
          return Promise.reject(new Error('Session expired'));
        }
      }
      
      return Promise.reject(error);
    }
  );

  return apiClient;
};

// Экспортируем клиент по умолчанию (без logout)
export default createApiClient();