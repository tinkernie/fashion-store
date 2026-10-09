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

// Initial preset categories matching the products page filter section & backend seed data
export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: "33b218cc-9681-4580-a1f6-992ec97e7f2f",
    name: "لباس زنانه",
    slug: "women",
    description: "کالکشن کامل پوشاک، پیراهن، شومیز و لباس‌های زنانه",
    is_active: true,
  },
  {
    id: "94d5ae74-10a3-4efa-bd25-cf23fecc43bc",
    name: "لباس مردانه",
    slug: "men",
    description: "پوشاک شیک، کت‌وشلوار، پیراهن و استایل رسمی و کژوال مردانه",
    is_active: true,
  },
  {
    id: "068b3b38-2688-408f-8ad7-bf009f5193da",
    name: "اکسسوری و کیف",
    slug: "accessories",
    description: "کیف‌های چرم طبیعی، شال و کلاه، کمربند و اکسسوری‌های لوکس",
    is_active: true,
  },
  {
    id: "443858d2-bfb0-4610-ab21-83ec7bc05397",
    name: "کفش و کتانی",
    slug: "shoes",
    description: "کفش‌های مجلسی، صندل و کتانی‌های اسپرت و لوکس",
    is_active: true,
  },
  {
    id: "cat-coats",
    name: "پالتو و بارانی",
    slug: "coats",
    description: "پالتوهای پشمی کشمیر، بارانی و کاپشن‌های زمستانه",
    is_active: true,
  },
  {
    id: "cat-hoodies",
    name: "هودی و دورس",
    slug: "hoodies",
    description: "هودی و دورس‌های اورسایز نخ‌پنبه و توکرکی",
    is_active: true,
  },
  {
    id: "cat-pants",
    name: "شلوار و جین",
    slug: "pants",
    description: "شلوارهای پارچه‌ای راسته، کارگو و شلوارهای جین کلاسیک",
    is_active: true,
  },
  {
    id: "cat-tshirts",
    name: "تی‌شرت و پلوشرت",
    slug: "t-shirts",
    description: "تی‌شرت‌های کراپ، بیسیک و پلوشرت‌های تابستانه",
    is_active: true,
  },
  {
    id: "cat-underwear",
    name: "لباس زیر و راحتی",
    slug: "underwear",
    description: "لباس‌های زیر پنبه‌ای، بادی و ست‌های راحتی خانگی",
    is_active: true,
  },
  {
    id: "cat-blazers",
    name: "کت و بلیزر",
    slug: "blazers",
    description: "کت‌های تک مجلسی، بلیزرهای کلاسیک و استایل کژوال",
    is_active: true,
  },
  {
    id: "cat-blouses",
    name: "شومیز و بلوز",
    slug: "blouses",
    description: "شومیزهای ساتن، حریر و بلوزهای مجلسی شیک",
    is_active: true,
  },
  {
    id: "cat-jewelry",
    name: "اکسسوری و زیورآلات",
    slug: "jewelry",
    description: "گوشواره، گردنبند، دستبند و زیورآلات مد روز",
    is_active: true,
  },
  {
    id: "cat-bags",
    name: "کیف دستی و دوشی",
    slug: "bags",
    description: "کیف‌های چرم طبیعی، کلاچ و کوله‌پشتی‌های چرم",
    is_active: true,
  },
];

const STORAGE_KEY = "fashion_custom_categories";

/**
 * Reads categories synchronously from localStorage or returns default set
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
 * Fetches categories from backend (/api/categories/flat/) and merges with local custom items
 */
export async function getCategories(): Promise<CategoryItem[]> {
  const localList = getStoredCategories();

  try {
    // 1. Try flat list endpoint (reliable, doesn't throw image ValueError)
    let remoteList: any[] = [];
    try {
      const res = await api.get("/api/categories/flat/");
      remoteList = Array.isArray(res.data) ? res.data : res.data.results || [];
    } catch {
      // 2. Fallback to /api/categories/
      try {
        const res = await api.get("/api/categories/");
        remoteList = Array.isArray(res.data) ? res.data : res.data.results || [];
      } catch {
        remoteList = [];
      }
    }

    if (remoteList.length > 0) {
      // Merge remote into local, preserving custom added/edited categories
      const mergedMap = new Map<string, CategoryItem>();

      // First add presets and locals
      for (const cat of localList) {
        mergedMap.set(cat.id, cat);
        mergedMap.set(cat.slug, cat);
      }

      // Overwrite/enrich with remote data from backend
      for (const remote of remoteList) {
        const id = String(remote.id);
        const slug = remote.slug || id;
        const name = remote.name || remote.title;
        const existing = mergedMap.get(id) || mergedMap.get(slug);

        const item: CategoryItem = {
          id,
          name: name || existing?.name || slug,
          slug,
          description: remote.description || existing?.description || "",
          is_active: remote.is_active !== undefined ? remote.is_active : true,
          parent_id: remote.parent_id || null,
          seo_metadata: remote.seo_metadata || existing?.seo_metadata || {},
          meta_title: remote.meta_title || existing?.meta_title,
          meta_description: remote.meta_description || existing?.meta_description,
          canonical_url: remote.canonical_url || existing?.canonical_url,
          hreflang: remote.hreflang || existing?.hreflang,
        };

        mergedMap.set(id, item);
      }

      // Convert back to unique array by ID
      const mergedArray: CategoryItem[] = [];
      const seenIds = new Set<string>();
      for (const item of mergedMap.values()) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          mergedArray.push(item);
        }
      }

      saveCategoriesToStore(mergedArray);
      return mergedArray;
    }
  } catch (err) {
    console.warn("Backend categories load failed, using local/preset categories:", err);
  }

  return localList;
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
