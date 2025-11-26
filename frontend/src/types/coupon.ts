export interface Coupon {
    id: number;
    code: string;
    description: string;
    discount_type: 'percent' | 'fixed';
    discount_percent: number;
    discount_amount: string;
    min_order_value: string;
    max_discount: string | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
    is_public: boolean;
    status: 'active' | 'expired' | 'inactive';
    display_text: string;
    is_saved?: boolean;
}

export interface CouponValidationResponse {
    valid: boolean;
    coupon?: Coupon;
    error?: string;
}

