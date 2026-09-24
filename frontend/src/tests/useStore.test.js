import { useStore } from '../store/useStore';

describe('Global User Store', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('setUser should update state and localStorage', () => {
        const userData = { name: 'Nethru', role: 'student', token: 'jwt_mock_token' };
        useStore.getState().setUser(userData);
        
        const state = useStore.getState();
        expect(state.user.name).toBe('Nethru');
        expect(localStorage.getItem('userName')).toBe('Nethru');
    });
});