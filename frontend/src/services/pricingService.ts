import api from './api';
import type { CreatePricingRequest, PricingRequest } from '../types/pricing';

export const pricingService = {
  // Create new pricing request
  createPricingRequest: async (data: CreatePricingRequest): Promise<PricingRequest> => {
    const response = await api.post('/ai/pricing/', data);
    return response.data;
  },

  // Get pricing request by ID
  getPricingRequest: async (id: string): Promise<PricingRequest> => {
    const response = await api.get(`/ai/pricing/${id}/`);
    return response.data;
  },

  // Get all pricing requests for current user
  getMyPricingRequests: async (): Promise<PricingRequest[]> => {
    const response = await api.get('/ai/pricing/my_requests/');
    return response.data;
  },

  // Reprocess pricing request
  reprocessPricingRequest: async (id: string): Promise<PricingRequest> => {
    const response = await api.post(`/ai/pricing/${id}/reprocess/`);
    return response.data;
  },

  // Delete pricing request
  deletePricingRequest: async (id: string): Promise<void> => {
    await api.delete(`/ai/pricing/${id}/`);
  },

  // Get daily limit information
  getDailyLimitInfo: async (): Promise<{
    limit: number;
    count_today: number;
    remaining: number;
    is_allowed: boolean;
    reset_time: string;
  }> => {
    const response = await api.get('/ai/pricing/daily_limit_info/');
    return response.data;
  },

  // Admin functions
  getAllPricingRequests: async (): Promise<PricingRequest[]> => {
    const response = await api.get('/ai/pricing/');
    return Array.isArray(response.data) ? response.data : (response.data.results || []);
  },

  adminUpdateStatus: async (id: string, status: string): Promise<PricingRequest> => {
    const response = await api.patch(`/ai/pricing/${id}/admin_update_status/`, { status });
    return response.data;
  },

  adminDelete: async (id: string): Promise<void> => {
    await api.delete(`/ai/pricing/${id}/`);
  },
};

