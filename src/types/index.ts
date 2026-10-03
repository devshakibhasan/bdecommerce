// User & Auth
export interface User {
  id: number;
  id_card_number?: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  locale: 'en' | 'bn';
  is_active: boolean;
  is_admin: boolean;
  roles?: string[];
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Catalog
export interface Category {
  id: number;
  name_en: string;
  name_bn: string | null;
  slug: string;
  icon: string | null;
  image: string | null;
  position: number;
  is_active: boolean;
  children?: Category[];
  parent_id?: number | null;
  products_count?: number;
}

export interface ProductType {
  id: number;
  name_en: string;
  name_bn?: string | null;
  slug: string;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
}

export interface Brand {
  id: number;
  name_en: string;
  name_bn?: string | null;
  slug: string;
  logo?: string | null;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
}

export interface Product {
  id: number;
  name_en: string;
  name_bn: string | null;
  slug: string;
  short_description_en: string | null;
  short_description_bn: string | null;
  description_en: string | null;
  description_bn: string | null;
  specifications?: {key: string, value: string}[] | null;
  highlights?: string[] | null;
  material?: string | null;
  fit?: string | null;
  care_instructions?: string[] | null;
  disclaimer?: string | null;
  base_price: number;
  compare_price: number | null;
  cost_price: number | null;
  sku_prefix: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_id?: number | null;
  product_type_id?: number | null;
  product_type?: ProductType | null;
  brand_id?: number | null;
  brand?: Brand | null;
  size_guide_id?: number | null;
  size_guide?: any | null;
  category?: Category;
  variants?: ProductVariant[];
  images?: ProductImage[];
  tags?: Tag[];
  primary_image_url: string | null;
  current_price: number;
  is_in_stock: boolean;
  seo_title: string | null;
  seo_description: string | null;
  views_count: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  barcode: string | null;
  color: string | null;
  size: string | null;
  price: number;
  cost_price: number | null;
  stock: number;
  available_stock: number;
  is_active: boolean;
  is_low_stock: boolean;
  weight_grams: number | null;
  images?: ProductImage[];
}

export interface ProductImage {
  id: number;
  path: string;
  url?: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
}

export interface Tag {
  id: number;
  name_en: string;
  name_bn: string | null;
  slug: string;
}

// CMS
export type SectionType = 'hero' | 'hero_deal' | 'banner' | 'banner_grid' | 'product_grid' | 'product_carousel' | 'product_showcase' | 'category_grid' | 'video' | 'testimonial' | 'reviews' | 'flash_sale' | 'custom_html' | 'dynamic_form' | 'rich_text' | 'faq' | 'features' | 'countdown' | 'gallery' | 'direct_checkout_form' | 'every_category_products' | 'category_products' | 'category_showcase';

export interface PageSection {
  id: number;
  type: SectionType;
  position: number;
  config: Record<string, any>;
  is_visible: boolean;
}

export interface Page {
  id: number;
  title_en: string;
  title_bn: string | null;
  slug: string;
  seo_title: string | null;
  seo_description: string | null;
  sections: PageSection[];
}

export interface SiteSettings {
  [key: string]: any;
}

// Orders
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'handed_to_courier' | 'in_transit' | 'delivered' | 'partial_return' | 'returned' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'sslcommerz' | 'aamarpay';
export type ShippingZone = 'inside_dhaka' | 'dhaka_suburb' | 'outside_dhaka';

export interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address: string;
  shipping_area: string | null;
  district?: string | null;
  thana?: string | null;
  shipping_zone: ShippingZone;
  courier_name?: string | null;
  tracking_code?: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment_status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  delivery_fee: number;
  advance_amount: number;
  total_payable: number;
  cod_amount: number;
  items?: OrderItem[];
  status_logs?: OrderStatusLog[];
  consignment?: CourierConsignment | null;
  source?: string;
  marketing_campaign_id?: number | null;
  marketing_lead_id?: number | null;
  meta_conversation_id?: string | null;
  meta_payload?: any;
  marketing_campaign?: MarketingCampaign | null;
  marketing_lead?: MarketingLead | null;
  notes: string | null;
  admin_notes?: string | null;
  created_at: string;
  confirmed_at: string | null;
  delivered_at: string | null;
}

export interface OrderItem {
  id: number;
  product_id?: number | null;
  variant_id?: number | null;
  product_name: string;
  sku: string | null;
  color?: string | null;
  size?: string | null;
  variant_name?: string | null;
  unit_price: number;
  quantity: number;
  total: number;
  variant?: {
    id: number;
    sku?: string | null;
    color?: string | null;
    size?: string | null;
    price?: number;
    stock?: number;
  } | null;
  product?: Product;
}

export interface OrderStatusLog {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  changed_by: User | null;
  created_at: string;
}

export interface CourierConsignment {
  id: number;
  courier_name: string;
  consignment_id: string | null;
  tracking_code: string | null;
  status: string;
  courier_charge: number;
  cod_amount: number;
  collected_amount: number;
}

// Cart
export interface CartItem {
  cartItemId?: string;
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

// Checkout
export interface CheckoutData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  shipping_area: string;
  shipping_zone: ShippingZone;
  payment_method: PaymentMethod;
  coupon_code: string;
  notes: string;
  items: { product_id: number; variant_id: number; quantity: number }[];
}

export interface ShippingCalculation {
  zone: ShippingZone;
  delivery_fee: number;
  requires_advance: boolean;
  advance_amount: number;
}

export interface FraudCheckResult {
  phone: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  allowed_payment_methods: PaymentMethod[];
  requires_advance: boolean;
  advance_percentage: number;
  message: string;
}

// Flash Sale
export interface FlashSale {
  id: number;
  title_en: string;
  title_bn: string | null;
  slug: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  products?: FlashSaleProduct[];
  time_remaining?: number;
}

export interface FlashSaleProduct {
  id: number;
  product: Product;
  special_price: number;
  quantity_limit: number | null;
  sold_count: number;
}

// Coupon
export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'flat' | 'bogo' | 'mfs_discount';
  value: number;
  min_spend: number | null;
  max_discount: number | null;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
}

// Risk Profile
export interface CustomerRiskProfile {
  id: number;
  phone: string;
  total_orders: number;
  successful_deliveries: number;
  returned_orders: number;
  cancelled_orders: number;
  risk_score: number;
  is_blacklisted: boolean;
  is_whitelisted: boolean;
  fraud_tags: string[];
  admin_notes: string | null;
  return_rate: number;
  success_rate: number;
}

// Dashboard
export interface DashboardStats {
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  revenue_today: number;
  revenue_this_month: number;
  pending_orders: number;
  processing_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  top_products: Product[];
  recent_orders: Order[];
  low_stock_products: ProductVariant[];
  pending_settlements: number;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Marketing & Multi-Channel Ads
export type MarketingChannel = 'facebook' | 'google' | 'tiktok';
export type LeadChannel = 'meta_messenger' | 'meta_whatsapp' | 'meta_instagram' | 'google_lead' | 'tiktok_lead';
export type LeadStatus = 'new_lead' | 'chatting' | 'replied_quote' | 'order_placed' | 'abandoned';

export interface MarketingCampaign {
  id: number;
  channel: MarketingChannel;
  campaign_name: string;
  campaign_id_external?: string | null;
  ad_set_name?: string | null;
  status: 'active' | 'paused' | 'completed';
  objective: 'messages' | 'conversions' | 'traffic' | 'leads';
  daily_budget: number;
  total_spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  ctr: number;
  conversions_count: number;
  revenue_generated: number;
  roas: number;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  leads_count?: number;
  orders_count?: number;
  created_at: string;
  updated_at: string;
}

export interface MarketingLeadMessage {
  id: number;
  lead_id: number;
  sender_type: 'customer' | 'moderator' | 'system';
  sender_name?: string | null;
  message_text: string;
  structured_quote?: any;
  order_id?: number | null;
  created_at: string;
}

export interface MarketingLead {
  id: number;
  campaign_id?: number | null;
  campaign?: MarketingCampaign | null;
  channel: LeadChannel;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_address?: string | null;
  district?: string | null;
  thana?: string | null;
  inquired_products?: string | null;
  customer_message?: string | null;
  sender_psid?: string | null;
  status: LeadStatus;
  lead_score: number;
  assigned_to?: number | null;
  converted_order_id?: number | null;
  converted_order?: Order | null;
  meta_raw_data?: any;
  last_message_at?: string | null;
  messages?: MarketingLeadMessage[];
  customer_stats?: {
    total_orders: number;
    delivered_orders: number;
    cancelled_orders: number;
    trust_badge: string;
    trust_color: string;
    risk_score: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MarketingOverview {
  kpis: {
    total_spend: number;
    total_impressions: number;
    total_clicks: number;
    avg_cpc: number;
    avg_ctr: number;
    total_conversions: number;
    total_revenue: number;
    overall_roas: number;
    total_leads: number;
    new_leads: number;
    chatting_leads: number;
    replied_leads: number;
    order_placed_leads: number;
    meta_orders_count: number;
    meta_orders_revenue: number;
  };
  channels: Record<MarketingChannel, {
    channel: MarketingChannel;
    campaigns_count: number;
    total_spend: number;
    impressions: number;
    clicks: number;
    cpc: number;
    ctr: number;
    conversions: number;
    revenue: number;
    roas: number;
  }>;
  trends?: {
    date: string;
    spend: number;
    revenue: number;
    orders: number;
  }[];
  recent_leads: MarketingLead[];
}
