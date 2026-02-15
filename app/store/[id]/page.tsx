"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { CartDrawer } from "@/components/cart-drawer";
import type { Outlet } from "@/lib/types";

type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  basePrice: string;
  category: string | null;
  imageUrl: string;
  isActive: boolean;
};

type CartItem = {
  productId: string;
  name: string;
  price: string;
  quantity: number;
  imageUrl: string;
};

export default function OutletMenuPage() {
  const router = useRouter();
  const params = useParams();
  const outletId = params.id as string;
  const { data: session } = useSession();

  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [products, setProducts] = useState<MenuProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [savedPincode, setSavedPincode] = useState("");

  useEffect(() => {
    fetchMenu();
    loadCartFromStorage();
    // Load saved pincode
    const pincode = localStorage.getItem("customer_pincode");
    if (pincode) {
      setSavedPincode(pincode);
    }
    // Save current outlet ID to localStorage
    localStorage.setItem("selected_outlet_id", outletId);
  }, [outletId]);

  useEffect(() => {
    saveCartToStorage();
  }, [cart]);

  const loadCartFromStorage = () => {
    const stored = localStorage.getItem(`cart_${outletId}`);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load cart:", e);
      }
    }
  };

  const saveCartToStorage = () => {
    localStorage.setItem(`cart_${outletId}`, JSON.stringify(cart));
  };

  const fetchMenu = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/store/${outletId}/menu`);
      const result = await response.json();

      if (result.success) {
        setOutlet(result.data.outlet);
        setProducts(result.data.products);
      } else {
        setError(result.error || "Failed to load menu");
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      setError("Failed to load menu");
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: MenuProduct) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          imageUrl: product.imageUrl,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemQuantityInCart = (productId: string) => {
    const item = cart.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleChangeOutlet = () => {
    // Confirm if cart has items
    if (cart.length > 0) {
      if (!confirm("Changing outlet will clear your cart. Continue?")) {
        return;
      }
    }
    // Clear cart and outlet selection when changing outlet
    localStorage.removeItem(`cart_${outletId}`);
    localStorage.removeItem("selected_outlet_id");
    router.push("/store");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF6B9D]/5 via-[#C8E6C9]/5 to-[#FFF9C4]/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF6B9D]/5 via-[#C8E6C9]/5 to-[#FFF9C4]/5 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">Oops!</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => router.push("/store")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B9D]/5 via-[#C8E6C9]/5 to-[#FFF9C4]/5 pb-24">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-2xl">🍦</span>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold truncate">{outlet?.name}</h1>
                {savedPincode && (
                  <button
                    onClick={handleChangeOutlet}
                    className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                    title="Click to change outlet"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {savedPincode}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session && (
                <button
                  onClick={() => router.push('/orders')}
                  className="px-3 py-2 text-xs sm:text-sm font-medium text-foreground hover:bg-accent rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
                  title="My Orders"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>My Orders</span>
                </button>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative px-3 py-2 hover:bg-accent rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Cart</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Menu */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍨</div>
            <h2 className="text-2xl font-bold mb-2">No products available</h2>
            <p className="text-muted-foreground">
              This outlet hasn't added any products yet.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6">Our Menu</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const quantity = getItemQuantityInCart(product.id);
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-1">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      {product.category && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-secondary/50 text-secondary-foreground rounded mb-2">
                          {product.category}
                        </span>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xl font-bold text-primary">
                          ₹{parseFloat(product.price).toFixed(2)}
                        </span>
                        {quantity === 0 ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="w-8 h-8 flex items-center justify-center bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">{quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background to-transparent pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-primary text-primary-foreground rounded-xl shadow-lg py-4 px-6 flex items-center justify-between hover:bg-primary/90 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center font-bold">
                  {getCartItemCount()}
                </span>
                <span className="font-medium">View Cart</span>
              </div>
              <span className="font-bold text-lg">
                ₹{getCartTotal().toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Component */}
      <CartDrawer
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        cart={cart}
        outletId={outletId}
        isAuthenticated={!!session}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
}
