import type { Product } from './product';
import type { Coupon } from './coupon';

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CartContextType {
    items: CartItem[];
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
    discountAmount: number;
    totalPrice: number;
    appliedCoupon: Coupon | null;
    applyCoupon: (code: string) => Promise<void>;
    removeCoupon: () => void;
    isOpen: boolean;
    toggleCart: () => void;
    closeCart: () => void;
}
