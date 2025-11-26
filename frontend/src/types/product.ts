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
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
    location: string;
    is_sold: boolean;
    created_at: string;
    updated_at: string;
    image?: string; // Main image
    images: ProductImage[];
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

