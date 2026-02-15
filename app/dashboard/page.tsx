"use client";

import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddOutletDialog } from "@/components/add-outlet-dialog";
import { InviteAdminDialog } from "@/components/invite-admin-dialog";
import { ManageOutletDialog } from "@/components/manage-outlet-dialog";
import { OutletProductsDialog } from "@/components/outlet-products-dialog";
import { DeliveryAgentsDialog } from "@/components/delivery-agents-dialog";
import { OutletCard } from "@/components/outlet-card";
import { ProductDialog } from "@/components/product-dialog";
import { ProductCard } from "@/components/product-card";
import type { Outlet, Product } from "@/lib/types";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"outlets" | "products">("outlets");
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [inviteDialogState, setInviteDialogState] = useState<{
    isOpen: boolean;
    outlet: Outlet | null;
  }>({ isOpen: false, outlet: null });
  const [manageOutletDialogState, setManageOutletDialogState] = useState<{
    isOpen: boolean;
    outlet: Outlet | null;
  }>({ isOpen: false, outlet: null });
  const [outletProductsDialogState, setOutletProductsDialogState] = useState<{
    isOpen: boolean;
    outlet: Outlet | null;
  }>({ isOpen: false, outlet: null });
  const [deliveryAgentsDialogState, setDeliveryAgentsDialogState] = useState<{
    isOpen: boolean;
    outlet: Outlet | null;
  }>({ isOpen: false, outlet: null });

  // Check if user owns any outlets
  const isOwner = outlets.some((outlet) => outlet.isOwner);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchOutlets();
      if (isOwner) {
        fetchProducts();
      }
    }
  }, [session, isOwner]);

  const fetchOutlets = async () => {
    try {
      const response = await fetch("/api/outlets");
      const result = await response.json();
      if (result.success) {
        setOutlets(result.data);
      }
    } catch (error) {
      console.error("Error fetching outlets:", error);
    } finally {
      setIsLoadingOutlets(false);
    }
  };

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch("/api/products");
      const result = await response.json();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchProducts();
      } else {
        alert(result.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  const handleDeleteOutlet = async (outletId: string) => {
    if (!confirm("Are you sure you want to delete this outlet? This action cannot be undone and will remove all associated data including orders, delivery agents, and admin assignments.")) {
      return;
    }

    try {
      const response = await fetch(`/api/outlets/${outletId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchOutlets();
      } else {
        alert(result.error || "Failed to delete outlet");
      }
    } catch (error) {
      console.error("Error deleting outlet:", error);
      alert("Failed to delete outlet");
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-semibold">High On</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm font-medium hidden sm:inline">{session.user?.name}</span>
            </div>
            <button
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
              className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* Tabs for owners */}
          {isOwner && (
            <div className="flex gap-2 sm:gap-4 mb-6 border-b border-border">
              <button
                onClick={() => setActiveTab("outlets")}
                className={`px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                  activeTab === "outlets"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Outlets
              </button>
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
                  activeTab === "products"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Products
              </button>
            </div>
          )}

          {/* Outlets Tab */}
          {activeTab === "outlets" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">My Outlets</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isOwner ? "Manage your ice cream outlets and teams" : "Manage assigned outlets"}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => setShowAddOutlet(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="hidden sm:inline">Add Outlet</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                )}
              </div>

              {isLoadingOutlets ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : outlets.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Outlets Yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Get started by adding your first ice cream outlet
                  </p>
                  <button
                    onClick={() => setShowAddOutlet(true)}
                    className="px-6 py-2.5 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add Your First Outlet
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {outlets.map((outlet) => (
                    <OutletCard
                      key={outlet.id}
                      outlet={outlet}
                      onManageOutlet={(outlet) =>
                        setManageOutletDialogState({ isOpen: true, outlet })
                      }
                      onDelete={outlet.isOwner ? handleDeleteOutlet : undefined}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Products Tab */}
          {activeTab === "products" && isOwner && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Product Catalog</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage your central product repository
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setShowProductDialog(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {isLoadingProducts ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-8 sm:p-12 text-center">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-primary"
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
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">No Products Yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">
                    Add products to your catalog to make them available at outlets
                  </p>
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductDialog(true);
                    }}
                    className="px-6 py-2.5 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEdit={(product) => {
                        setEditingProduct(product);
                        setShowProductDialog(true);
                      }}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <AddOutletDialog
        isOpen={showAddOutlet}
        onClose={() => setShowAddOutlet(false)}
        onSuccess={fetchOutlets}
      />

      <ProductDialog
        isOpen={showProductDialog}
        onClose={() => {
          setShowProductDialog(false);
          setEditingProduct(null);
        }}
        onSuccess={fetchProducts}
        product={editingProduct}
      />

      {inviteDialogState.outlet && (
        <InviteAdminDialog
          isOpen={inviteDialogState.isOpen}
          onClose={() => setInviteDialogState({ isOpen: false, outlet: null })}
          outletId={inviteDialogState.outlet.id}
          outletName={inviteDialogState.outlet.name}
          onSuccess={() => {}}
        />
      )}

      {manageOutletDialogState.outlet && (
        <ManageOutletDialog
          isOpen={manageOutletDialogState.isOpen}
          onClose={() =>
            setManageOutletDialogState({ isOpen: false, outlet: null })
          }
          outletId={manageOutletDialogState.outlet.id}
          outletName={manageOutletDialogState.outlet.name}
          onOpenInvite={() => {
            setInviteDialogState({
              isOpen: true,
              outlet: manageOutletDialogState.outlet,
            });
          }}
          onDeleted={fetchOutlets}
          onManageProducts={() => {
            setOutletProductsDialogState({
              isOpen: true,
              outlet: manageOutletDialogState.outlet,
            });
          }}
          onManageDeliveryAgents={() => {
            setDeliveryAgentsDialogState({
              isOpen: true,
              outlet: manageOutletDialogState.outlet,
            });
          }}
        />
      )}

      {outletProductsDialogState.outlet && (
        <OutletProductsDialog
          isOpen={outletProductsDialogState.isOpen}
          onClose={() =>
            setOutletProductsDialogState({ isOpen: false, outlet: null })
          }
          outletId={outletProductsDialogState.outlet.id}
          outletName={outletProductsDialogState.outlet.name}
        />
      )}

      {deliveryAgentsDialogState.outlet && (
        <DeliveryAgentsDialog
          isOpen={deliveryAgentsDialogState.isOpen}
          onClose={() =>
            setDeliveryAgentsDialogState({ isOpen: false, outlet: null })
          }
          outletId={deliveryAgentsDialogState.outlet.id}
          outletName={deliveryAgentsDialogState.outlet.name}
        />
      )}
    </div>
  );
}
