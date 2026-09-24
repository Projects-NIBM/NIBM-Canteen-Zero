import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useCartStore = create(
    persist(
        (set, get) => ({
            cart: [],
            isCartOpen: false,

            toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
            
            addToCart: (product) => {
                const currentCart = get().cart;
                const existingItem = currentCart.find((item) => item._id === product._id);

                if (existingItem) {
                    set({
                        cart: currentCart.map((item) =>
                            item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                        ),
                    });
                } else {
                    set({ cart: [...currentCart, { ...product, quantity: 1 }] });
                }
            },

            removeFromCart: (productId) => {
                set({ cart: get().cart.filter((item) => item._id !== productId) });
            },

            updateQuantity: (productId, amount) => {
                set({
                    cart: get().cart.map((item) =>
                        item._id === productId ? { 
                            ...item, 
                            quantity: Math.max(1, Math.min(10, item.quantity + amount)) 
                        } : item
                    ),
                });
            },

            clearCart: () => set({ cart: [] }),

            getCartTotal: () => {
                return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
            },

            getItemCount: () => {
                return get().cart.reduce((total, item) => total + item.quantity, 0);
            }
        }),
        {
            name: 'nibm-canteen-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);