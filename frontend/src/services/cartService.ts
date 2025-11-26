import api from './api';
import type { CartItem } from '../types/cart';

export const cartService = {
    get: async (): Promise<CartItem[]> => {
        const response = await api.get('/cart/my/');
        return response.data.items;
    },

    add: async (productId: string, quantity: number): Promise<CartItem[]> => {
        const response = await api.post('/cart/add/', { product_id: productId, quantity });
        return response.data.items;
    },

    update: async (productId: string, quantity: number): Promise<CartItem[]> => {
        const response = await api.post('/cart/update/', { product_id: productId, quantity });
        return response.data.items;
    },

    remove: async (productId: string): Promise<CartItem[]> => {
        const response = await api.post('/cart/remove/', { product_id: productId });
        return response.data.items;
    },

    sync: async (items: CartItem[]): Promise<CartItem[]> => {
        // Transform items to payload expected by backend sync
        const payload = items.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity
        }));
        const response = await api.post('/cart/sync/', { items: payload });
        return response.data.items;
    },

    clear: async (): Promise<CartItem[]> => {
        const response = await api.post('/cart/clear/');
        return response.data.items;
    }
};

