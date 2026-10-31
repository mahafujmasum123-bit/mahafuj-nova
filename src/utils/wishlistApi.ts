import { SeedProduct } from '../../server/data/initialData';

const TOKEN_KEY = 'novara_auth_token_v1';
const SESSION_KEY = 'novara_session_id_v1';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'default_guest_session';
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = 'sess_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-session-id': getOrCreateSessionId(),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

export interface WishlistResponse {
  success: boolean;
  count: number;
  productIds: string[];
  data: SeedProduct[];
  error?: string;
  message?: string;
  action?: 'added' | 'removed';
}

/**
 * Fetch current user/session wishlist from backend
 */
export async function fetchWishlist(): Promise<WishlistResponse> {
  const res = await fetch('/api/wishlist', {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load wishlist');
  }
  return data;
}

/**
 * Toggle product in wishlist
 */
export async function toggleWishlistOnServer(productId: string): Promise<WishlistResponse> {
  const res = await fetch('/api/wishlist/toggle', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update wishlist');
  }
  return data;
}

/**
 * Remove a specific product from wishlist
 */
export async function removeFromWishlistOnServer(productId: string): Promise<WishlistResponse> {
  const res = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to remove item from wishlist');
  }
  return data;
}

/**
 * Clear the entire wishlist
 */
export async function clearWishlistOnServer(): Promise<WishlistResponse> {
  const res = await fetch('/api/wishlist', {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to clear wishlist');
  }
  return data;
}

/**
 * Move all or selected products from wishlist to cart
 */
export async function moveAllWishlistToCart(productIds?: string[]): Promise<{
  success: boolean;
  message: string;
  movedCount: number;
  outOfStockCount: number;
  productIds: string[];
}> {
  const res = await fetch('/api/wishlist/move-all-to-cart', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ productIds }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to move items to cart');
  }
  return data;
}

/**
 * Merge guest wishlist into user account upon authentication
 */
export async function mergeGuestWishlist(guestSessionId: string): Promise<WishlistResponse> {
  const res = await fetch('/api/wishlist/merge', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ guestSessionId }),
  });
  const data = await res.json();
  return data;
}
