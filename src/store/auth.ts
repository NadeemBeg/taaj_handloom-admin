import { create } from 'zustand';
import { apiClient, setAccessToken } from '../lib/apiClient';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INVENTORY_MANAGER' | 'ORDER_MANAGER';
}

interface AuthState {
  user: AdminUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'idle',

  login: async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { user, accessToken } = res.data.data;
    setAccessToken(accessToken);
    set({ user, status: 'authenticated' });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },

  // On app load, try to restore a session from the refresh cookie.
  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const refresh = await apiClient.post('/auth/refresh');
      setAccessToken(refresh.data.data.accessToken);
      const me = await apiClient.get('/auth/me');
      set({ user: me.data.data.user, status: 'authenticated' });
    } catch {
      setAccessToken(null);
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
