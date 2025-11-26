import api from './api';
import type { PaymentMethod } from '../types/auth';

export interface CreatePaymentMethodPayload {
  brand: 'visa' | 'mastercard' | 'jcb' | 'amex' | 'other';
  last4: string;
  exp_month: number;
  exp_year: number;
  card_holder_name: string;
  // Trong thực tế đây là token/id từ cổng thanh toán (Stripe/Braintree/...)
  gateway_payment_method_id: string;
  gateway?: string;
  gateway_customer_id?: string;
}

export const paymentService = {
  list: async (): Promise<PaymentMethod[]> => {
    const response = await api.get<PaymentMethod[]>('/auth/payments/');
    return response.data;
  },

  create: async (payload: CreatePaymentMethodPayload): Promise<PaymentMethod> => {
    const response = await api.post<PaymentMethod>('/auth/payments/', payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/payments/${id}/`);
  },
};


