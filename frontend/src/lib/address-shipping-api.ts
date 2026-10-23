import { api } from "./api";

export interface Province {
  id: number;
  name: string;
}

export interface City {
  id: number;
  name: string;
}

export interface UserAddress {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  province_id: number;
  province_name: string;
  city_id: number;
  city_name: string;
  street: string;
  building_no: string;
  postal_code: string;
  is_default: boolean;
  created_at?: string;
}

export interface AddressInput {
  recipient_name: string;
  recipient_phone: string;
  province_id: number;
  city_id: number;
  street: string;
  building_no: string;
  postal_code: string;
  is_default?: boolean;
}

export interface ShippingBreakdownOption {
  method: "pishtaz" | "vizheh" | string;
  name: string;
  name_en: string;
  eta_days: number;
  zone: "intra" | "neighbor" | "far" | string;
  base_fare: number;
  surcharge: number;
  surcharge_percent: number;
  insurance: number;
  total: number;
  currency: "Toman" | string;
}

export interface ShippingQuoteResponse {
  province: string;
  zone: string;
  weight_grams: number;
  default_method: string;
  selected: ShippingBreakdownOption;
  options: ShippingBreakdownOption[];
}

export interface ShippingMethodItem {
  method: string;
  name: string;
  name_en: string;
  eta_days: number;
}

// In-memory cache for geo data to avoid duplicate network roundtrips
let cachedProvinces: Province[] | null = null;
const cachedCitiesByProvince: Record<number, City[]> = {};

export async function fetchProvinces(): Promise<Province[]> {
  if (cachedProvinces && cachedProvinces.length > 0) {
    return cachedProvinces;
  }
  const res = await api.get<{ provinces: Province[] }>("/api/geo/");
  cachedProvinces = res.data?.provinces || [];
  return cachedProvinces;
}

export async function fetchCities(provinceId: number): Promise<City[]> {
  if (!provinceId) return [];
  if (cachedCitiesByProvince[provinceId]) {
    return cachedCitiesByProvince[provinceId];
  }
  const res = await api.get<{ province_id: number; cities: City[] }>(
    `/api/geo/provinces/${provinceId}/cities/`
  );
  const cities = res.data?.cities || [];
  cachedCitiesByProvince[provinceId] = cities;
  return cities;
}

export async function fetchUserAddresses(): Promise<UserAddress[]> {
  const res = await api.get<UserAddress[]>("/api/users/me/addresses/");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createUserAddress(data: AddressInput): Promise<UserAddress> {
  const res = await api.post<UserAddress>("/api/users/me/addresses/", data);
  return res.data;
}

export async function updateUserAddress(
  id: string,
  data: Partial<AddressInput>
): Promise<UserAddress> {
  const res = await api.patch<UserAddress>(`/api/users/me/addresses/${id}/`, data);
  return res.data;
}

export async function deleteUserAddress(id: string): Promise<void> {
  await api.delete(`/api/users/me/addresses/${id}/`);
}

export async function setDefaultUserAddress(id: string): Promise<UserAddress> {
  const res = await api.post<UserAddress>(`/api/users/me/addresses/${id}/default/`);
  return res.data;
}

export async function fetchShippingQuote(params: {
  address_id?: string;
  province_id?: number;
  session_key?: string;
}): Promise<ShippingQuoteResponse> {
  const query = new URLSearchParams();
  if (params.address_id) query.append("address_id", params.address_id);
  if (params.province_id) query.append("province_id", String(params.province_id));
  if (params.session_key) query.append("session_key", params.session_key);

  const res = await api.get<ShippingQuoteResponse>(
    `/api/shipping/quote/?${query.toString()}`,
    params.session_key
      ? { headers: { "X-Cart-Session-Key": params.session_key } }
      : undefined
  );
  return res.data;
}

export async function fetchShippingMethods(): Promise<ShippingMethodItem[]> {
  const res = await api.get<{ default_method: string; methods: ShippingMethodItem[] }>(
    "/api/shipping/methods/"
  );
  return res.data?.methods || [];
}
