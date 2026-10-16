import { api } from "./api";

export interface StockAlertOption {
  option_name: string;
  value: string;
}

export interface StockAlert {
  id: string;
  variant_id: string;
  sku: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  options: StockAlertOption[];
  in_stock_now: boolean;
  current_sellable: number;
  last_notified_at: string | null;
  created_at: string;
}

/**
 * Fetch all active back-in-stock alerts for the authenticated user.
 */
export async function fetchUserStockAlerts(): Promise<StockAlert[]> {
  const response = await api.get("/api/stock-alerts/");
  const data = response.data;
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.results)) {
    return data.results;
  }
  return [];
}

/**
 * Subscribe authenticated user to back-in-stock alert for a specific variant.
 */
export async function createStockAlert(variantId: string): Promise<StockAlert> {
  const response = await api.post("/api/stock-alerts/", { variant_id: variantId });
  return response.data;
}

/**
 * Remove an existing back-in-stock alert by ID.
 */
export async function deleteStockAlert(alertId: string): Promise<{ message: string }> {
  const response = await api.delete(`/api/stock-alerts/${alertId}/`);
  return response.data;
}
