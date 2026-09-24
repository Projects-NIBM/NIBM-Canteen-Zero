const getRedirectPath = (role, token) => {
    if (!token) return '/login';
    return role === 'admin' ? '/admin/dashboard' : '/menu';
};

describe('Security Route Redirection', () => {
    test('should send admin to dashboard', () => {
        expect(getRedirectPath('admin', 'valid-token')).toBe('/admin/dashboard');
    });
});