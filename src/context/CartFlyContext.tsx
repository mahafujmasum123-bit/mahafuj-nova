import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  endX: number;
  endY: number;
}

interface CartFlyContextType {
  triggerCartFly: (sourceElement: HTMLElement | { x: number; y: number; width?: number; height?: number }, imageUrl: string) => void;
  isCartBouncing: boolean;
}

const CartFlyContext = createContext<CartFlyContextType | null>(null);

export const CartFlyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const bounceTimerRef = useRef<any>(null);

  const triggerCartFly = useCallback(
    (
      source: HTMLElement | { x: number; y: number; width?: number; height?: number },
      imageUrl: string
    ) => {
      if (typeof window === 'undefined') return;

      // Respect prefers-reduced-motion
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setIsCartBouncing(true);
        setTimeout(() => setIsCartBouncing(false), 300);
        return;
      }

      // Locate target cart icon in the navigation bar
      const cartIcon =
        document.querySelector('[data-testid="navigation-cart-button"]') ||
        document.querySelector('[aria-label="Shopping Cart"]') ||
        document.querySelector('[data-testid="navigation-cart-badge"]');

      if (!cartIcon) {
        return;
      }

      const destRect = cartIcon.getBoundingClientRect();
      const endX = destRect.left + destRect.width / 2;
      const endY = destRect.top + destRect.height / 2;

      let startX = 0;
      let startY = 0;
      let startWidth = 64;
      let startHeight = 64;

      if ('getBoundingClientRect' in source && typeof source.getBoundingClientRect === 'function') {
        const srcRect = source.getBoundingClientRect();
        startX = srcRect.left;
        startY = srcRect.top;
        startWidth = Math.min(srcRect.width, 100) || 64;
        startHeight = Math.min(srcRect.height, 100) || 64;
      } else if ('x' in source && 'y' in source) {
        startX = source.x;
        startY = source.y;
        startWidth = source.width || 64;
        startHeight = source.height || 64;
      }

      const id = `fly-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newItem: FlyingItem = {
        id,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80',
        startX,
        startY,
        startWidth,
        startHeight,
        endX,
        endY,
      };

      setFlyingItems((prev) => [...prev, newItem]);

      // When the flying item reaches the cart icon (~750ms)
      setTimeout(() => {
        // Trigger cart icon bounce
        setIsCartBouncing(true);
        if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
        bounceTimerRef.current = setTimeout(() => {
          setIsCartBouncing(false);
        }, 350);

        // Remove item from flying items array
        setFlyingItems((prev) => prev.filter((item) => item.id !== id));
      }, 750);
    },
    []
  );

  return (
    <CartFlyContext.Provider value={{ triggerCartFly, isCartBouncing }}>
      {children}
      {/* Flying particles portal overlay */}
      <div className="fixed inset-0 pointer-events-none z-[99998] overflow-hidden" aria-hidden="true">
        {flyingItems.map((item) => (
          <FlyingParticle key={item.id} item={item} />
        ))}
      </div>
    </CartFlyContext.Provider>
  );
};

export function useCartFly(): CartFlyContextType {
  const context = useContext(CartFlyContext);
  if (!context) {
    return {
      triggerCartFly: () => {},
      isCartBouncing: false,
    };
  }
  return context;
}

const FlyingParticle: React.FC<{ item: FlyingItem }> = ({ item }) => {
  const deltaX = item.endX - (item.startX + item.startWidth / 2);
  const deltaY = item.endY - (item.startY + item.startHeight / 2);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${item.startX}px`,
        top: `${item.startY}px`,
        width: `${item.startWidth}px`,
        height: `${item.startHeight}px`,
        '--delta-x': `${deltaX}px`,
        '--delta-y': `${deltaY}px`,
      } as React.CSSProperties}
      className="cart-flying-particle rounded-2xl bg-white p-1.5 shadow-2xl border-2 border-emerald-500 overflow-hidden flex items-center justify-center z-[99999]"
    >
      <img
        src={item.imageUrl}
        alt="Product"
        className="w-full h-full object-contain mix-blend-multiply"
      />
    </div>
  );
};
