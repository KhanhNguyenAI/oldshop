export interface Category {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    parent: number | null;
}

export interface ProductImage {
    id: number;
    image: string;
}

export interface Product {
    id: string; // UUID
    seller: {
        id: number;
        email: string;
        username?: string;
    };
    category: Category;
    title: string;
    description: string;
    price: string;
    sale_price?: number;
    active_discount_percent?: number;
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    condition_detail?: string;
    specifications?: Record<string, string>;
    location: string;
    stock_quantity: number;
    sold_quantity: number;
    is_sold: boolean;
    created_at: string;
    updated_at: string;
    image?: string; // Main image
    images: ProductImage[];
    avg_rating?: number;
    rating_count?: number;
    user_rating?: number | null;
}

export interface CreateProductData {
    category_id: number;
    title: string;
    description: string;
    price: number;
    condition: string;
    location: string;
    uploaded_images?: File[];
}

export interface ProductFilters {
    category?: string; // slug
    search?: string;
    min_price?: number;
    max_price?: number;
    condition?: string;
    ordering?: string;
}
