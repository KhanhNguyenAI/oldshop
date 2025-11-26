export interface PaymentMethod {
    id: number;
    brand: 'visa' | 'jcb' | 'amex' | 'other';
    brand_display: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    card_holder_name: string;
    is_default: boolean;
    is_active: boolean;
}

export interface CreatePaymentMethodData {
    brand: string;
    last4: string; // Trong thực tế, cái này thường do Backend trích xuất từ Token
    exp_month: number;
    exp_year: number;
    card_holder_name: string;
    gateway_payment_method_id: string; // Token mock
    gateway_customer_id?: string;
}

