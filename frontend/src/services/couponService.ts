import api from './api';
import type { Coupon, CouponValidationResponse } from '../types/coupon';

export const couponService = {
    list: async (): Promise<Coupon[]> => {
        const response = await api.get<Coupon[]>('/coupons/');
        return response.data;
    },

    save: async (code: string): Promise<Coupon> => {
        const response = await api.post<{ message: string, coupon: Coupon }>('/coupons/save_coupon/', { code });
        return response.data.coupon;
    },

    validate: async (code: string, totalAmount: number): Promise<CouponValidationResponse> => {
        try {
            const response = await api.post<CouponValidationResponse>('/coupons/validate/', {
                code,
                total_amount: totalAmount
            });
            return response.data;
        } catch (error: any) {
            return {
                valid: false,
                error: error.response?.data?.error || 'Invalid coupon'
            };
        }
    }
};

