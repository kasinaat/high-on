"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";

type ProductWithAvailability = {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  outletProductId: string | null;
  isAvailable: boolean | null;
  customPrice: string | null;
};

interface OutletProductsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
}

export function OutletProductsDialog({
  isOpen,
  onClose,
  outletId,
  outletName,
}: OutletProductsDialogProps) {
  const [products, setProducts] = useState<ProductWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, outletId]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/outlets/${outletId}/products`);
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error fetching outlet products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProduct = async (product: ProductWithAvailability) => {
    setUpdatingId(product.id);
    try {
      if (product.outletProductId) {
        // Toggle availability
        const response = await fetch(
          `/api/outlets/${outletId}/products/${product.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              isAvailable: !product.isAvailable,
            }),
          }
        );
        const result = await response.json();
        if (result.success) {
          fetchProducts();
        } else {
          alert(result.error || "Failed to update product");
        }
      } else {
        // Add product to outlet
        const response = await fetch(
          `/api/outlets/${outletId}/products`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: product.id,
            }),
          }
        );
        const result = await response.json();
        if (result.success) {
          fetchProducts();
        } else {
          alert(result.error || "Failed to add product");
        }
      }
    } catch (error) {
      console.error("Error toggling product:", error);
      alert("Failed to update product");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm("Remove this product from the outlet?")) {
      return;
    }

    setUpdatingId(productId);
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/products/${productId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        fetchProducts();
      } else {
        alert(result.error || "Failed to remove product");
      }
    } catch (error) {
      console.error("Error removing product:", error);
      alert("Failed to remove product");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Outlet Products</h2>
            <p className="text-sm text-muted-foreground mt-1">{outletName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-12 h-12 text-muted-foreground mx-auto mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <p className="text-muted-foreground">
                No products available. Add products to the catalog first.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product) => {
                const isEnabled = product.outletProductId && product.isAvailable;
                const isAdded = product.outletProductId !== null;

                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 p-3 sm:p-4 border rounded-lg transition-colors ${
                      isEnabled
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card border-border"
                    }`}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-8 h-8 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm sm:text-base truncate">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-primary">
                          ₹{product.basePrice}
                        </p>
                      </div>
                      {product.category && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-secondary/50 text-secondary-foreground rounded">
                          {product.category}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {isAdded && (
                        <button
                          onClick={() => handleRemoveProduct(product.id)}
                          disabled={updatingId === product.id}
                          className="px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleProduct(product)}
                        disabled={updatingId === product.id}
                        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                          isEnabled
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {updatingId === product.id ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : isEnabled ? (
                          <Check className="w-3 h-3" />
                        ) : null}
                        {isAdded ? (isEnabled ? "Enabled" : "Enable") : "Add"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 border-t border-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium bg-card border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
