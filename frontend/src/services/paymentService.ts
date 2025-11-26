import api from './api';
import type { PaymentMethod, CreatePaymentMethodData } from '../types/payment';

export const paymentService = {
    list: async (): Promise<PaymentMethod[]> => {
        const response = await api.get<PaymentMethod[]>('/auth/payments/');
        return response.data;
    },

    create: async (data: CreatePaymentMethodData): Promise<PaymentMethod> => {
        const response = await api.post<PaymentMethod>('/auth/payments/', data);
        return response.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/auth/payments/${id}/`);
    }
};
