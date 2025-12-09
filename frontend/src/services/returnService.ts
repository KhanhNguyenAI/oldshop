import api from './api';
import type { ReturnRequest, CreateReturnRequestData, ConfirmFaultData } from '../types/return';

export const returnService = {
  // List all return requests
  list: async (): Promise<ReturnRequest[]> => {
    const response = await api.get<ReturnRequest[]>('/returns/');
    return response.data;
  },

  // Get single return request
  get: async (id: string): Promise<ReturnRequest> => {
    const response = await api.get<ReturnRequest>(`/returns/${id}/`);
    return response.data;
  },

  // Create return request
  create: async (data: CreateReturnRequestData): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>('/returns/', data);
    return response.data;
  },

  // Upload evidence (image/video)
  uploadEvidence: async (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<{ url: string; message: string }>(
      '/returns/upload-evidence/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Cancel return request
  cancel: async (id: string): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>(`/returns/${id}/cancel/`);
    return response.data;
  },

  // Admin: Confirm fault type
  confirmFault: async (id: string, data: ConfirmFaultData): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>(`/returns/${id}/confirm-fault/`, data);
    return response.data;
  },

  // Admin: Mark as received
  markReceived: async (id: string, conditionAtReturn?: string): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>(`/returns/${id}/mark-received/`, {
      condition_at_return: conditionAtReturn,
    });
    return response.data;
  },

  // Admin: Process refund
  processRefund: async (id: string): Promise<ReturnRequest> => {
    const response = await api.post<ReturnRequest>(`/returns/${id}/process-refund/`);
    return response.data;
  },
};

