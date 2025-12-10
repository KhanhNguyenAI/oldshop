export type FreeItemCondition = 
  | 'new_unused'      // 新品・未使用
  | 'like_new'        // 未使用に近い
  | 'no_damage'       // 目立った傷や汚れなし
  | 'minor_damage'    // やや傷や汚れあり
  | 'has_damage';     // 傷や汚れあり

export type FreeItemPickupMethod = 
  | 'direct'          // 直接引き取り（手渡し）
  | 'consult';        // 要相談

export type FreeItemStatus = 
  | 'available'       // 募集中
  | 'reserved'         // 予約済み
  | 'completed'        // 終了
  | 'cancelled';      // キャンセル

export interface FreeItemImage {
  id: string;
  image_url: string;
  order: number;
}

export interface User {
  id: string;
  email: string;
  profile?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface FreeItem {
  id: string;
  user: User;
  title: string;
  description: string;
  condition: FreeItemCondition;
  category: string | null;
  location_prefecture: string;
  location_city: string;
  location_detail: string | null;
  pickup_method: FreeItemPickupMethod;
  status: FreeItemStatus;
  show_email?: boolean;
  views_count: number;
  images: FreeItemImage[];
  message_count?: number;
  created_at: string;
  updated_at: string;
}

export interface FreeItemMessage {
  id: string;
  free_item: string;
  sender: User;
  receiver: User;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateFreeItemRequest {
  title: string;
  description: string;
  condition: FreeItemCondition;
  category?: string;
  location_prefecture: string;
  location_city: string;
  location_detail?: string;
  pickup_method: FreeItemPickupMethod;
  show_email?: boolean;
  images?: File[];
}

export interface UpdateFreeItemRequest {
  title?: string;
  description?: string;
  condition?: FreeItemCondition;
  category?: string;
  location_prefecture?: string;
  location_city?: string;
  location_detail?: string;
  pickup_method?: FreeItemPickupMethod;
  status?: FreeItemStatus;
  show_email?: boolean;
  images?: File[];
  delete_image_ids?: string[];
}

export interface SendMessageRequest {
  message: string;
  free_item_id: string;
}

export interface FreeItemFilters {
  location_prefecture?: string;
  location_city?: string;
  category?: string;
  condition?: FreeItemCondition;
  status?: FreeItemStatus;
  pickup_method?: FreeItemPickupMethod;
  search?: string;
  sort?: string;
}

export interface Conversation {
  free_item: FreeItem;
  other_user: User | null;
  last_message: FreeItemMessage | null;
  unread_count: number;
  message_count: number;
}

export const CONDITION_LABELS: Record<FreeItemCondition, string> = {
  new_unused: '新品・未使用',
  like_new: '未使用に近い',
  no_damage: '目立った傷や汚れなし',
  minor_damage: 'やや傷や汚れあり',
  has_damage: '傷や汚れあり',
};

export const PICKUP_METHOD_LABELS: Record<FreeItemPickupMethod, string> = {
  direct: '直接引き取り（手渡し）',
  consult: '要相談',
};

export const STATUS_LABELS: Record<FreeItemStatus, string> = {
  available: '募集中',
  reserved: '相談中',
  completed: '終了',
  cancelled: 'キャンセル',
};

