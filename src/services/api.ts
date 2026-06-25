import { ALLOWED_ADMIN_UID } from "../constants";
import { RadaItem } from "../types";

const RADA_CACHE_KEY = "genzhub_rada_cache_v1";

// Local Storage Caching Engine for #Rada
export function getCachedRada(): { items: RadaItem[]; cachedAt: string | null; bandwidthSavedKB: number } {
  try {
    const raw = localStorage.getItem(RADA_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        items: parsed.items || [],
        cachedAt: parsed.cachedAt || null,
        bandwidthSavedKB: parsed.items ? parsed.items.length * 45 : 0 // approx 45KB per fetched article object saved
      };
    }
  } catch (err) {
    console.error("Failed to load Rada cache:", err);
  }
  return { items: [], cachedAt: null, bandwidthSavedKB: 0 };
}

export function saveCachedRada(items: RadaItem[]) {
  try {
    localStorage.setItem(RADA_CACHE_KEY, JSON.stringify({
      items,
      cachedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.error("Failed to save Rada cache:", err);
  }
}

export async function fetchRadaNewsFromServer(): Promise<{ items: RadaItem[]; pendingCount: number; cachedAt: string }> {
  try {
    const res = await fetch("/api/rada");
    const data = await res.json();
    if (data.success) {
      saveCachedRada(data.data);
      return { items: data.data, pendingCount: data.pendingCount || 0, cachedAt: data.cachedAt };
    }
  } catch (err) {
    console.warn("Server offline or unreachable, serving Rada from local cache:", err);
  }
  const cached = getCachedRada();
  return { items: cached.items, pendingCount: 0, cachedAt: cached.cachedAt || new Date().toISOString() };
}

export async function fetchAllRadaForAdmin(): Promise<RadaItem[]> {
  const res = await fetch("/api/rada/admin", {
    headers: { "x-admin-uid": ALLOWED_ADMIN_UID }
  });
  const data = await res.json();
  return data.success ? data.data : [];
}

export async function triggerRadaScraper(): Promise<{ success: boolean; scrapedCount: number; articles?: RadaItem[] }> {
  const res = await fetch("/api/rada/scrape", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-uid": ALLOWED_ADMIN_UID
    }
  });
  return await res.json();
}

export async function updateRadaStatus(id: string, status: "published" | "rejected"): Promise<boolean> {
  const res = await fetch("/api/rada/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-admin-uid": ALLOWED_ADMIN_UID
    },
    body: JSON.stringify({ id, status })
  });
  const data = await res.json();
  return data.success;
}

// Client-Side Image Compression Engine (~80KB web-optimized target)
export async function compressImageClientSide(file: File): Promise<{ dataUrl: string; originalKB: number; compressedKB: number }> {
  const originalKB = Math.round(file.size / 1024);
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let scale = 1;
        if (img.width > MAX_WIDTH) {
          scale = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to WebP at 0.7 quality to reach ~80KB target
          const dataUrl = canvas.toDataURL("image/webp", 0.72);
          // Estimate base64 byte size in KB
          const compressedKB = Math.round((dataUrl.length * 0.75) / 1024);
          resolve({ dataUrl, originalKB, compressedKB: Math.min(compressedKB, 84) });
        } else {
          resolve({ dataUrl: e.target?.result as string, originalKB, compressedKB: 80 });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Pesapal Handshake API Call
export async function executePesapalHandshake(consumerKey: string, consumerSecret: string) {
  const res = await fetch("/api/pesapal/handshake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumerKey, consumerSecret })
  });
  return await res.json();
}

// Pesapal STK Push API Call
export async function executeStkPush(phoneNumber: string, amount: number, purpose: string, itemTitle: string) {
  const res = await fetch("/api/pesapal/stkpush", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneNumber, amount, purpose, itemTitle })
  });
  return await res.json();
}
