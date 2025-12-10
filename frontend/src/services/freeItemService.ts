import api from './api';
import type {
  FreeItem,
  FreeItemMessage,
  CreateFreeItemRequest,
  UpdateFreeItemRequest,
  SendMessageRequest,
  FreeItemFilters,
  Conversation,
} from '../types/freeItem';

export const freeItemService = {
  // Get all free items with filters
  getFreeItems: async (filters?: FreeItemFilters, page?: number): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: FreeItem[];
  }> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    if (page) {
      params.append('page', String(page));
    }
    
    const response = await api.get(`/free-items/?${params.toString()}`);
    return response.data;
  },

  // Get single free item by ID
  getFreeItem: async (id: string): Promise<FreeItem> => {
    const response = await api.get(`/free-items/${id}/`);
    return response.data;
  },

  // Create new free item
  createFreeItem: async (data: CreateFreeItemRequest): Promise<FreeItem> => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('condition', data.condition);
    formData.append('show_email', data.show_email ? 'true' : 'false');
    formData.append('location_prefecture', data.location_prefecture);
    formData.append('location_city', data.location_city);
    
    if (data.category) {
      formData.append('category', data.category);
    }
    if (data.location_detail) {
      formData.append('location_detail', data.location_detail);
    }
    formData.append('pickup_method', data.pickup_method);
    
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    const response = await api.post('/free-items/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update free item
  updateFreeItem: async (id: string, data: UpdateFreeItemRequest): Promise<FreeItem> => {
    const formData = new FormData();
    
    if (data.title) formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    if (data.condition) formData.append('condition', data.condition);
    if (data.category !== undefined) {
      formData.append('category', data.category || '');
    }
    if (data.location_prefecture) formData.append('location_prefecture', data.location_prefecture);
    if (data.location_city) formData.append('location_city', data.location_city);
    if (data.location_detail !== undefined) {
      formData.append('location_detail', data.location_detail || '');
    }
    if (data.pickup_method) formData.append('pickup_method', data.pickup_method);
    if (data.status) formData.append('status', data.status);
    if (data.show_email !== undefined) formData.append('show_email', data.show_email ? 'true' : 'false');
    
    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }
    
    if (data.delete_image_ids) {
      data.delete_image_ids.forEach((imageId) => {
        formData.append('delete_image_ids', imageId);
      });
    }
    
    const response = await api.patch(`/free-items/${id}/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete free item
  deleteFreeItem: async (id: string): Promise<void> => {
    await api.delete(`/free-items/${id}/`);
  },

  // Update status
  updateStatus: async (id: string, status: string): Promise<FreeItem> => {
    const response = await api.patch(`/free-items/${id}/update_status/`, { status });
    return response.data;
  },

  // Get my items
  getMyItems: async (page?: number): Promise<{
    count: number;
    next: string | null;
    previous: string | null;
    results: FreeItem[];
  }> => {
    const params = page ? `?page=${page}` : '';
    const response = await api.get(`/free-items/my_items/${params}`);
    return response.data;
  },

  // Get messages for an item
  getItemMessages: async (itemId: string): Promise<FreeItemMessage[]> => {
    const response = await api.get(`/free-items/${itemId}/messages/`);
    return response.data;
  },

  // Send message to item owner
  sendMessage: async (itemId: string, message: string): Promise<FreeItemMessage> => {
    const response = await api.post(`/free-items/${itemId}/send_message/`, { message });
    return response.data;
  },

  // Get all conversations
  getConversations: async (): Promise<Conversation[]> => {
    const response = await api.get('/free-item-messages/conversations/');
    return response.data;
  },

  // Mark message as read
  markMessageRead: async (messageId: string): Promise<FreeItemMessage> => {
    const response = await api.patch(`/free-item-messages/${messageId}/mark_read/`);
    return response.data;
  },
};

