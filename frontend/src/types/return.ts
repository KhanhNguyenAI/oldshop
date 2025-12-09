export type ReturnRequestStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'shipping'
  | 'received'
  | 'processing'
  | 'completed'
  | 'cancelled';

export type ReturnType = 'full' | 'partial' | 'exchange';

export type FaultType = 
  | 'shop_fault'
  | 'customer_fault'
  | 'no_fault'
  | 'pending_review';

export interface ReturnItem {
  id: number;
  order_item_id: number;
  product_id: string | null;
  product_title: string;
  product_image: string | null;
  quantity: number;
  original_condition: string;
  days_since_delivery: number;
  baseline_refund_percent: string;
  baseline_refund_amount: string;
  final_refund_percent: string | null;
  final_refund_amount: string | null;
  condition_at_return: string;
  status: 'pending' | 'approved' | 'rejected' | 'received' | 'refunded';
  admin_notes: string;
  original_price: string;
  created_at: string;
  updated_at: string;
}

export interface ReturnRequest {
  id: string;
  order: string; // Order ID
  order_id: string;
  order_total: string;
  order_status: string;
  user: number;
  status: ReturnRequestStatus;
  return_type: ReturnType;
  reason: string;
  reason_detail: string;
  images: string[];
  fault_type: FaultType;
  fault_confirmed_by: number | null;
  fault_confirmed_by_email: string | null;
  fault_confirmed_at: string | null;
  fault_notes: string;
  days_since_delivery: number;
  baseline_refund_amount: string;
  baseline_refund_percent: string;
  final_refund_amount: string | null;
  final_refund_percent: string | null;
  return_shipping_label: string;
  tracking_number: string;
  shipping_cost: string;
  admin_notes: string;
  rejected_reason: string;
  items: ReturnItem[];
  items_count?: number; // Optional for list view
  created_at: string;
  updated_at: string;
  requested_at: string;
}

export interface CreateReturnRequestData {
  order: string; // Order ID
  return_type: ReturnType;
  reason: string;
  reason_detail?: string;
  images?: string[];
  items_data: Array<{
    order_item_id: number;
    quantity: number;
  }>;
}

export interface ConfirmFaultData {
  fault_type: FaultType;
  fault_notes?: string;
  approve: boolean;
}

