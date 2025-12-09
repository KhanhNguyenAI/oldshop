import api from './api';

export interface CreateFamilyPaymentRequest {
    amount: number;
    order_id?: string;
    metadata?: Record<string, string>;
}

export interface CreateFamilyPaymentResponse {
    client_secret: string;
    payment_intent_id: string;
    status: string;
}

export interface ConfirmFamilyPaymentRequest {
    payment_intent_id?: string;
}

export interface ConfirmFamilyPaymentResponse {
    payment_status: string;
    order_status: string;
    payment_intent_id: string;
    order_id: string;
}

export interface CheckPendingPaymentsResponse {
    checked_orders: number;
    updated_orders: number;
    results: Array<{
        order_id: string;
        payment_status: string;
        order_status: string;
        updated: boolean;
        error?: string;
    }>;
}

export const strikeService = {
    /**
     * Create a Family payment intent
     */
    createFamilyPayment: async (data: CreateFamilyPaymentRequest): Promise<CreateFamilyPaymentResponse> => {
        const response = await api.post<CreateFamilyPaymentResponse>('/orders/create-family-payment/', data);
        return response.data;
    },

    /**
     * Confirm Family payment status
     * If payment_intent_id is not provided, it will use the order's payment_intent_id
     * Can be called with GET (no body) or POST (with payment_intent_id in body)
     */
    confirmFamilyPayment: async (orderId: string, data?: ConfirmFamilyPaymentRequest): Promise<ConfirmFamilyPaymentResponse> => {
        if (data?.payment_intent_id) {
            // POST with payment_intent_id
            const response = await api.post<ConfirmFamilyPaymentResponse>(`/orders/${orderId}/confirm-family-payment/`, data);
            return response.data;
        } else {
            // GET without payment_intent_id (uses order's payment_intent_id)
            const response = await api.get<ConfirmFamilyPaymentResponse>(`/orders/${orderId}/confirm-family-payment/`);
            return response.data;
        }
    },

    /**
     * Check payment status for all pending orders with family payment method
     * Useful for polling or scheduled checks
     */
    checkPendingFamilyPayments: async (): Promise<CheckPendingPaymentsResponse> => {
        const response = await api.post<CheckPendingPaymentsResponse>('/orders/check-pending-family-payments/');
        return response.data;
    },
};

