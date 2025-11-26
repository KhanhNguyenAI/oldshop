import api from './api';
import type { Product, Category, CreateProductData, ProductFilters } from '../types/product';
import type { Comment } from '../types/comment';

export const productService = {
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/products/categories/');
        return response.data;
    },

    getProducts: async (filters: ProductFilters = {}): Promise<Product[]> => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.ordering) params.append('ordering', filters.ordering);
        
        const response = await api.get(`/products/products/?${params.toString()}`);
        return response.data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await api.get(`/products/products/${id}/`);
        return response.data;
    },

    createProduct: async (data: CreateProductData): Promise<Product> => {
        const formData = new FormData();
        formData.append('category_id', data.category_id.toString());
        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('price', data.price.toString());
        formData.append('condition', data.condition);
        formData.append('location', data.location);
        
        if (data.uploaded_images) {
            data.uploaded_images.forEach((file) => {
                formData.append('uploaded_images', file);
            });
        }

        const response = await api.post('/products/products/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    rateProduct: async (id: string, score: number): Promise<void> => {
        await api.post(`/products/products/${id}/rate/`, { score });
    },

    getComments: async (id: string): Promise<Comment[]> => {
        const response = await api.get(`/products/products/${id}/comments/`);
        return response.data;
    },

    addComment: async (id: string, content: string, parentId?: number): Promise<Comment> => {
        const response = await api.post(`/products/products/${id}/add_comment/`, { 
            content, 
            parent_id: parentId 
        });
        return response.data;
    }
};
