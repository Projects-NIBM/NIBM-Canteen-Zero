import { create } from 'zustand';
import API from '../services/api';

export const useStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    pendingOrderCount: 0,

    setUser: (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        set({ user: userData });
    },

    setPendingOrderCount: (count) => set({ pendingOrderCount: count }),

    logout: async () => {
        try {
            await API.post('/api/auth/logout');
        } catch (e) {}
        localStorage.removeItem('user');
        set({ user: null, pendingOrderCount: 0 });
        window.location.href = '/login';
    }
}));