import api from './api';
import type { BookingState, Booking } from '../types/booking';

export const bookingService = {
  // Get all bookings for current user
  list: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/');
    return response.data;
  },

  // Get a single booking by ID
  get: async (id: number): Promise<Booking> => {
    const response = await api.get(`/bookings/${id}/`);
    return response.data;
  },

  // Get list of booked dates
  getBookedDates: async (): Promise<string[]> => {
    const response = await api.get('/bookings/booked-dates/');
    return response.data.booked_dates || [];
  },

  create: async (data: BookingState, totalPrice: number): Promise<any> => {
    const formData = new FormData();
    
    // Booking Details
    if (data.roomSize) formData.append('room_size', data.roomSize);
    if (data.trashLevel) formData.append('trash_level', data.trashLevel);
    if (data.truckType) formData.append('truck_type', data.truckType);
    
    // Date
    if (data.date) {
        const year = data.date.getFullYear();
        const month = String(data.date.getMonth() + 1).padStart(2, '0');
        const day = String(data.date.getDate()).padStart(2, '0');
        formData.append('booking_date', `${year}-${month}-${day}`);
    }
    
    // Time & Location
    if (data.timeSlot) formData.append('time_slot', data.timeSlot);
    formData.append('address', data.address);
    formData.append('has_elevator', data.hasElevator ? 'true' : 'false');
    
    // Customer Info
    formData.append('customer_name', data.customerInfo.name);
    formData.append('customer_phone', data.customerInfo.phone);
    formData.append('customer_email', data.customerInfo.email);
    if (data.customerInfo.notes) {
        formData.append('notes', data.customerInfo.notes);
    }

    // Price
    formData.append('total_price', totalPrice.toString());

    // Images
    if (data.images && data.images.length > 0) {
        data.images.forEach((file) => {
            formData.append('image_files', file);
        });
    }

    return api.post('/bookings/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Cancel a booking (only if status is pending)
  cancel: async (id: number): Promise<Booking> => {
    const response = await api.post(`/bookings/${id}/cancel/`);
    return response.data;
  },

  // Rebook from a cancelled booking
  rebook: async (id: number, bookingDate?: string, timeSlot?: string): Promise<Booking> => {
    const data: any = {};
    if (bookingDate) data.booking_date = bookingDate;
    if (timeSlot) data.time_slot = timeSlot;
    const response = await api.post(`/bookings/${id}/rebook/`, data);
    return response.data;
  }
};
