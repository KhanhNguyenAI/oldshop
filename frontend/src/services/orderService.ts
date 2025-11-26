import api from './api';
import type { Order } from '../types/order';

export const orderService = {
    list: async (): Promise<Order[]> => {
        const response = await api.get<Order[]>('/orders/');
        return response.data;
    },

    get: async (id: string): Promise<Order> => {
        const response = await api.get<Order>(`/orders/${id}/`);
        return response.data;
    },

    // Add create method later if connecting real checkout API
    create: async (data: any): Promise<Order> => {
        const response = await api.post<Order>('/orders/', data);
        return response.data;
    },

    cancel: async (id: string): Promise<Order> => {
        const response = await api.post<Order>(`/orders/${id}/cancel/`);
        return response.data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/orders/${id}/`);
    }
};

