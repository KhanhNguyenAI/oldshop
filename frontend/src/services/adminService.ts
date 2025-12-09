import api from './api';

export interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    processing: number;
    today: number;
    week: number;
    month: number;
    revenue: number;
    recent: Array<{
      id: string;
      total_amount: string;
      status: string;
      payment_method: string;
      created_at: string;
      full_name: string;
    }>;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    today: number;
    week: number;
    recent: Array<{
      id: number;
      customer_name: string;
      booking_date: string;
      status: string;
      total_price: string;
      created_at: string;
    }>;
  };
  inquiries: {
    total: number;
    unresolved: number;
    today: number;
    week: number;
  };
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  message: string;
  admin_reply?: string | null;
  replied_by?: number | null;
  replied_by_email?: string | null;
  replied_at?: string | null;
  created_at: string;
  is_resolved: boolean;
}

export const adminService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/admin/dashboard/stats/');
    return response.data;
  },

  getContacts: async (is_resolved?: boolean): Promise<Contact[]> => {
    const params = is_resolved !== undefined ? { is_resolved: is_resolved.toString() } : {};
    const response = await api.get<any>('/admin/contacts/', { params });
    // Handle both array and paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    }
    // If paginated, return results array
    return response.data.results || [];
  },

  replyToContact: async (contactId: number, adminReply: string): Promise<Contact> => {
    const response = await api.post<Contact>(`/admin/contacts/${contactId}/reply/`, {
      admin_reply: adminReply
    });
    return response.data;
  },

  updateContactResolved: async (contactId: number, isResolved: boolean): Promise<Contact> => {
    const response = await api.patch<Contact>(`/admin/contacts/${contactId}/`, {
      is_resolved: isResolved
    });
    return response.data;
  },
};

