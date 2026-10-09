import { api } from "./api";
import { toast } from "sonner";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active?: boolean;
  parent_id?: string | null;
  product_count?: number;
  seo_metadata?: {
    meta_title?: string;
    meta_description?: string;
    [key: string]: any;
  };
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  hreflang?: Array<{ hreflang: string; href: string }>;
}

// Empty category array placeholder when database is empty
export const DEFAULT_CATEGORIES: CategoryItem[] = [];

const STORAGE_KEY = "fashion_custom_categories";

/**
 * Reads categories synchronously from localStorage or returns empty set
 */
export function getStoredCategories(): CategoryItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_CATEGORIES;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Error reading categories from localStorage:", e);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Saves categories array to localStorage and broadcasts update event
 */
export function saveCategoriesToStore(categories: CategoryItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent("fashion_categories_updated", { detail: categories }));
  } catch (e) {
    console.error("Error saving categories to localStorage:", e);
  }
}

/**
 * Fetches categories directly from backend database (/api/categories/flat/ or /api/categories/)
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    let remoteList: any[] = [];
    try {
      const res = await api.get("/api/categories/flat/");
      remoteList = Array.isArray(res.data) ? res.data : res.data.results || [];
    } catch {
      try {
        const res = await api.get("/api/categories/");
        remoteList = Array.isArray(res.data) ? res.data : res.data.results || [];
      } catch {
        remoteList = [];
      }
    }

    if (remoteList.length > 0) {
      const cleanCategories: CategoryItem[] = remoteList
        .filter((c: any) => c.is_active !== false && !c.name?.toLowerCase().includes("test"))
        .map((remote: any) => ({
          id: String(remote.id),
          name: remote.name || remote.title || String(remote.slug || remote.id),
          slug: remote.slug || String(remote.id),
          description: remote.description || "",
          is_active: remote.is_active !== undefined ? remote.is_active : true,
          parent_id: remote.parent_id || null,
          seo_metadata: remote.seo_metadata || {},
          meta_title: remote.meta_title,
          meta_description: remote.meta_description,
          canonical_url: remote.canonical_url,
          hreflang: remote.hreflang,
        }));

      saveCategoriesToStore(cleanCategories);
      return cleanCategories;
    }
  } catch (err) {
    console.warn("Backend categories load error:", err);
  }

  return getStoredCategories();
}

/**
 * Creates a new category: attempts backend creation and guarantees local persistence
 */
export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  seo_metadata?: {
    meta_title?: string;
    meta_description?: string;
    [key: string]: any;
  };
}): Promise<CategoryItem> {
  const cleanName = data.name.trim();
  const cleanSlug = (data.slug || cleanName)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u0600-\u06FF\s-]/g, "")
    .replace(/\s+/g, "-") || `cat-${Date.now()}`;

  let newCat: CategoryItem = {
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: cleanName,
    slug: cleanSlug,
    description: data.description || "",
    is_active: true,
    seo_metadata: data.seo_metadata || {},
    meta_title: data.seo_metadata?.meta_title || `${cleanName} — دسته ${cleanName} | Luxe`,
    meta_description: data.seo_metadata?.meta_description || data.description || "",
  };

  // Attempt backend persistence
  try {
    const res = await api.post("/api/admin/categories/", {
      name: cleanName,
      slug: cleanSlug,
      description: data.description || "",
      is_active: true,
      seo_metadata: data.seo_metadata || {},
    });
    if (res?.data && res.data.id) {
      newCat = {
        ...newCat,
        ...res.data,
        id: String(res.data.id),
      };
    }
  } catch (err: any) {
    console.warn("Backend category create endpoint not available or returned error, saved locally:", err?.message);
  }

  const current = getStoredCategories();
  // Check if slug or id already exists
  const updated = [newCat, ...current.filter((c) => c.slug !== cleanSlug && c.id !== newCat.id)];
  saveCategoriesToStore(updated);
  return newCat;
}

/**
 * Updates an existing category: updates local store and attempts backend PATCH
 */
export async function updateCategory(
  id: string,
  data: Partial<CategoryItem>
): Promise<CategoryItem> {
  const current = getStoredCategories();
  const index = current.findIndex((c) => c.id === id || c.slug === id);

  if (index === -1) {
    throw new Error("دسته‌بندی مورد نظر یافت نشد.");
  }

  const updatedItem: CategoryItem = {
    ...current[index],
    ...data,
  };

  // Attempt backend PATCH if id is a UUID
  try {
    await api.patch(`/api/admin/categories/${id}/`, data);
  } catch (err: any) {
    console.warn("Backend category patch endpoint returned error, updated locally:", err?.message);
  }

  current[index] = updatedItem;
  saveCategoriesToStore([...current]);
  return updatedItem;
}

/**
 * Deletes a category: removes from local store and attempts backend DELETE
 */
export async function deleteCategory(id: string): Promise<void> {
  // Attempt backend DELETE
  try {
    await api.delete(`/api/admin/categories/${id}/`);
  } catch (err: any) {
    console.warn("Backend category delete returned error, removed locally:", err?.message);
  }

  const current = getStoredCategories();
  const filtered = current.filter((c) => c.id !== id && c.slug !== id);
  saveCategoriesToStore(filtered);
}
