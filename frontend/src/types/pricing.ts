export type Condition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export type PricingStatus = 'pending' | 'validated' | 'priced' | 'error' | 'rejected';

export interface CreatePricingRequest {
  title: string;
  category: string;
  brand?: string;
  description: string;
  original_price: number;
  condition: Condition;
  image_urls: string[];
}

export interface PricingRequest {
  id: string;
  title: string;
  category: string;
  brand?: string;
  description: string;
  original_price: string;
  condition: Condition;
  image_urls: string[];
  status: PricingStatus;
  suggested_price?: string;
  price_min?: string;
  price_max?: string;
  confidence_score?: number;
  pricing_reasoning?: string;
  error_message?: string;
  validation_result?: {
    is_valid: boolean;
    reason: string;
    matches_category?: boolean;
    matches_description?: boolean;
    is_real_product?: boolean;
  };
  pricing_result?: {
    suggested_price: number;
    price_min: number;
    price_max: number;
    confidence_score: number;
    reasoning: string[];
    reasoning_text?: string;
    factors?: {
      depreciation?: string;
      market_demand?: string;
      processing_cost?: string;
      risk_factor?: string;
    };
  };
  created_at: string;
  updated_at: string;
}

