import api from './api';
import type { Address } from '../types/auth';

export interface AddressPayload {
  recipient: string;
  postal_code: string;
  prefecture: string;
  city: string;
  district: string;
  building?: string;
  phone?: string;
  is_default?: boolean;
}

export const addressService = {
  list: async (): Promise<Address[]> => {
    const response = await api.get<Address[]>('/auth/addresses/');
    return response.data;
  },

  create: async (payload: AddressPayload): Promise<Address> => {
    const response = await api.post<Address>('/auth/addresses/', payload);
    return response.data;
  },

  update: async (id: number, payload: Partial<AddressPayload>): Promise<Address> => {
    const response = await api.patch<Address>(`/auth/addresses/${id}/`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/auth/addresses/${id}/`);
  },
};


