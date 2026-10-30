export type PaymentGateway = 'dummy' | 'zarinpal';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'succeeded'
  | 'failed'
  | 'refunded';

export interface PaymentInitiateRequest {
  order_id: string;
  gateway?: PaymentGateway | string;
}

export interface PaymentInitiateResponse {
  id: string;
  order_id: string;
  order_number?: string;
  authority?: string | null;
  amount: number;
  gateway: string;
  status: PaymentStatus;
  gateway_reference?: string | null;
  created_at: string;
  redirect_url?: string | null;
}

export interface PaymentResultQueryParams {
  order?: string;
  payment?: string;
  status?: string;
  ref?: string;
}

export interface OrderItemSnapshot {
  id: string;
  product_snapshot?: {
    title?: string;
    image?: string | { url?: string };
    options?: string;
    [key: string]: unknown;
  };
  quantity: number;
  price: number;
  line_total: number;
}

export interface OrderPaymentInfo {
  id?: string;
  status: string;
  gateway: string;
  gateway_name?: string;
  tracking_code?: string;
  amount: number;
  authority?: string;
  paid_at?: string | null;
}

export interface AuthoritativeOrder {
  id: string;
  order_number: string;
  status:
    | 'pending'
    | 'awaiting_payment'
    | 'paid'
    | 'packing'
    | 'shipping'
    | 'delivered'
    | 'cancelled'
    | 'returned'
    | 'refunded';
  total: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  shipping_cost: number;
  shipping_address?: {
    full_name?: string;
    phone?: string;
    province?: string;
    city?: string;
    address?: string;
    postal_code?: string;
  };
  placed_at: string;
  paid_at?: string | null;
  items?: OrderItemSnapshot[];
  payments?: OrderPaymentInfo[];
  payment_info?: OrderPaymentInfo | null;
}
