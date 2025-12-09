export type RoomSize = '1R' | '1K' | '1DK' | '1LDK' | '2DK' | '2LDK' | '3LDK' | 'house';

export type TrashLevel = 'low' | 'medium' | 'high';

export type TruckType = 'light' | '1t' | '2t' | '2t_full' | '2_trucks';

export type TimeSlot = '9:00-12:00' | '13:00-17:00' | string;

export interface BookingState {
  roomSize: RoomSize | null;
  trashLevel: TrashLevel | null;
  truckType: TruckType | null;
  date: Date | null;
  timeSlot: TimeSlot | null;
  address: string;
  hasElevator: boolean;
  images: File[];
  customerInfo: {
    name: string;
    phone: string;
    email: string;
    notes: string;
  };
}

export const ROOM_PRICES: Record<RoomSize, number> = {
  '1R': 15000,
  '1K': 18000,
  '1DK': 25000,
  '1LDK': 30000,
  '2DK': 40000,
  '2LDK': 50000,
  '3LDK': 65000,
  'house': 80000,
};

export const TRASH_PRICES: Record<TrashLevel, number> = {
  'low': 0,
  'medium': 15000,
  'high': 40000, // Gomiya level
};

export const TRUCK_PRICES: Record<TruckType, number> = {
  'light': 10000,
  '1t': 20000,
  '2t': 35000,
  '2t_full': 50000,
  '2_trucks': 90000,
};

export const ELEVATOR_FEE = 3000;

// Booking Response Types
export interface BookingImage {
  id: number;
  image_url: string;
  uploaded_at: string;
}

export interface Booking {
  id: number;
  user: number;
  room_size: RoomSize;
  trash_level: TrashLevel;
  truck_type: TruckType;
  booking_date: string;
  time_slot: string;
  address: string;
  has_elevator: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string | null;
  total_price: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  images: BookingImage[];
}

