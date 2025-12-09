import api from './api';
import type { Product, Category, CreateProductData, ProductFilters, PaginatedResponse } from '../types/product';
import type { Comment } from '../types/comment';

export const productService = {
    getCategories: async (): Promise<Category[]> => {
        const response = await api.get('/products/categories/');
        // Handle paginated response (has 'results' field) or direct array
        return response.data.results || response.data;
    },

    getProducts: async (filters: ProductFilters = {}, page: number = 1): Promise<PaginatedResponse<Product>> => {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.condition) params.append('condition', filters.condition);
        if (filters.ordering) params.append('ordering', filters.ordering);
        if (page > 1) params.append('page', page.toString());
        
        const response = await api.get(`/products/products/?${params.toString()}`);
        // Handle paginated response (has 'results' field) or direct array (fallback)
        if (response.data.results) {
            return response.data;
        }
        // Fallback: if not paginated, wrap in paginated format
        return {
            count: Array.isArray(response.data) ? response.data.length : 0,
            next: null,
            previous: null,
            results: Array.isArray(response.data) ? response.data : []
        };
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

    addComment: async (id: string, content: string, parentId?: number, images?: File[]): Promise<Comment> => {
        const formData = new FormData();
        formData.append('content', content);
        if (parentId) formData.append('parent_id', parentId.toString());
        
        if (images) {
            images.forEach(image => {
                formData.append('uploaded_images', image);
            });
        }

        const response = await api.post(`/products/products/${id}/add_comment/`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getRecommendations: async (id: string): Promise<{ type: 'same_category' | 'accessories'; category: Category; recommendations: Product[]; count: number }> => {
        const response = await api.get(`/products/products/${id}/recommendations/`);
        return response.data;
    },

    getAccessories: async (): Promise<{ purchased_count: number; accessories: Product[]; count: number }> => {
        const response = await api.get('/products/products/accessories/');
        return response.data;
    },

    getRobotSuggestions: async (): Promise<{ products: Product[]; count: number; type: 'viewed' | 'bestselling' }> => {
        const response = await api.get('/products/products/robot_suggestions/');
        return response.data;
    }
};
