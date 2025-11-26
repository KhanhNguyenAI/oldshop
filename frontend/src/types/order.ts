import { Product } from './product';

export interface OrderItem {
    id: number;
    product: number; // Product ID
    product_title: string;
    product_image: string;
    quantity: number;
    price: string; // Snapshot price
}

export interface Order {
    id: string; // UUID
    user: number;
    full_name: string;
    email: string;
    phone: string;
    address: string;
    postal_code: string;
    city: string;
    total_amount: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    payment_method: string;
    created_at: string;
    items: OrderItem[];
}

