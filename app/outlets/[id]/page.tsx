"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { ArrowLeft, ShieldCheck, Package, UserMinus, Trash2, Clock, X, Loader2, Truck } from "lucide-react";
import { OutletOrders } from "@/components/outlet-orders";
import { OutletProductsDialog } from "@/components/outlet-products-dialog";
import { DeliveryAgentsDialog } from "@/components/delivery-agents-dialog";
import { InviteAdminDialog } from "@/components/invite-admin-dialog";
import type { Invitation } from "@/lib/types";

type AdminWithUser = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type Outlet = {
  id: string;
  name: string;
  address: string;
  pincode: string;
  phone: string;
  isActive: boolean;
};

export default function OutletManagePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const outletId = params.id as string;

  const [activeTab, setActiveTab] = useState<"orders" | "management">("orders");
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [admins, setAdmins] = useState<AdminWithUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  const [showDeliveryAgentsDialog, setShowDeliveryAgentsDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Replace this URL with your Cloudinary notification sound URL
  const NOTIFICATION_SOUND_URL = "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/notification.mp3";

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchOutletData();
      fetchAdmins();
      
      // Poll for new orders every 10 seconds
      const interval = setInterval(checkForNewOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [session, outletId]);

  const fetchOutletData = async () => {
    try {
      const response = await fetch("/api/outlets");
      const result = await response.json();
      if (result.success) {
        const currentOutlet = result.data.find((o: any) => o.id === outletId);
        if (currentOutlet) {
          setOutlet(currentOutlet);
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error fetching outlet:", error);
    }
  };

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/outlets/${outletId}/admins`);
      const result = await response.json();
      if (result.success) {
        setAdmins(result.data.admins);
        setIsOwner(result.data.isOwner);
        setPendingInvitations(result.data.pendingInvitations || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForNewOrders = async () => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/orders`);
      if (response.ok) {
        const orders = await response.json();
        const pendingOrders = orders.filter((o: any) => o.status === 'pending');
        
        if (pendingOrders.length > orderCount && orderCount > 0) {
          // New order detected, play sound
          playNotificationSound();
        }
        setOrderCount(pendingOrders.length);
      }
    } catch (error) {
      console.error("Error checking orders:", error);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch(err => {
        console.error("Failed to play notification sound:", err);
        // On mobile, audio might need user interaction first
        // You can add a "Enable Sound" button if needed
      });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) {
      return;
    }

    try {
      const response = await fetch(`/api/outlets/${outletId}/admins/${userId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setAdmins(admins.filter((admin) => admin.userId !== userId));
      } else {
        alert(result.error || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("Failed to remove admin");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/admins/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();
      if (result.success) {
        setAdmins(
          admins.map((admin) =>
            admin.userId === userId ? { ...admin, role: newRole } : admin
          )
        );
      } else {
        alert(result.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/invitations/${invitationId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        setPendingInvitations(pendingInvitations.filter((inv) => inv.id !== invitationId));
      } else {
        alert(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("Failed to cancel invitation");
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session || !outlet) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Audio element for notifications */}
      <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto" />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold">{outlet.name}</h1>
              <p className="text-sm text-muted-foreground">{outlet.address}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
              activeTab === "orders"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </div>
          </button>
          <button
            onClick={() => setActiveTab("management")}
            className={`px-4 py-2 text-sm sm:text-base font-medium border-b-2 transition-colors ${
              activeTab === "management"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Management
            </div>
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <OutletOrders outletId={outletId} outletName={outlet.name} />
        )}

        {/* Management Tab */}
        {activeTab === "management" && (
          <div className="space-y-6">
            {/* Admins Section */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Admins</h3>
                {isOwner && (
                  <button
                    onClick={() => setShowInviteDialog(true)}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                  >
                    Invite Admin
                  </button>
                )}
              </div>

              {admins.length === 0 ? (
                <div className="text-center py-8">
                  <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No admins assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3 p-4 bg-background border border-border rounded-lg">
                      {admin.user.image ? (
                        <img
                          src={admin.user.image}
                          alt={admin.user.name}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {admin.user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{admin.user.name}</p>
                        <p className="text-sm text-muted-foreground">{admin.user.email}</p>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-2">
                          <select
                            value={admin.role}
                            onChange={(e) => handleChangeRole(admin.userId, e.target.value)}
                            className="px-3 py-1 text-sm border border-border rounded-md"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="staff">Staff</option>
                          </select>
                          <button
                            onClick={() => handleRemoveAdmin(admin.userId)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Pending Invitations
                  </h4>
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{invitation.email}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent {new Date(invitation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            onClick={() => handleCancelInvitation(invitation.id)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => setShowProductsDialog(true)}
                className="p-6 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left"
              >
                <Package className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Manage Products</h3>
                <p className="text-sm text-muted-foreground">
                  Select products available at this outlet
                </p>
              </button>

              <button
                onClick={() => setShowDeliveryAgentsDialog(true)}
                className="p-6 bg-card border border-border rounded-xl hover:bg-accent transition-colors text-left"
              >
                <Truck className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold mb-1">Delivery Agents</h3>
                <p className="text-sm text-muted-foreground">
                  Add and manage delivery agents
                </p>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Product Management Dialog */}
      {outlet && (
        <OutletProductsDialog
          isOpen={showProductsDialog}
          onClose={() => setShowProductsDialog(false)}
          outletId={outletId}
          outletName={outlet.name}
        />
      )}

      {/* Delivery Agents Dialog */}
      {outlet && (
        <DeliveryAgentsDialog
          isOpen={showDeliveryAgentsDialog}
          onClose={() => setShowDeliveryAgentsDialog(false)}
          outletId={outletId}
          outletName={outlet.name}
        />
      )}

      {/* Invite Admin Dialog */}
      {outlet && (
        <InviteAdminDialog
          isOpen={showInviteDialog}
          onClose={() => {
            setShowInviteDialog(false);
            fetchAdmins(); // Refresh admins list after invite
          }}
          outletId={outletId}
          outletName={outlet.name}
          onSuccess={() => {
            fetchAdmins(); // Refresh to show new pending invitation
          }}
        />
      )}
    </div>
  );
}
