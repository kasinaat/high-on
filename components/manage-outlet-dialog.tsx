"use client";

import { useEffect, useState } from "react";
import { X, UserMinus, ShieldCheck, Trash2, Clock, Package } from "lucide-react";
import type { Invitation } from "@/lib/types";
import { OutletOrders } from "./outlet-orders";

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

interface ManageOutletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
  onOpenInvite: () => void;
  onDeleted: () => void;
  onManageProducts: () => void;
  onManageDeliveryAgents: () => void;
}

export function ManageOutletDialog({
  isOpen,
  onClose,
  outletId,
  outletName,
  onOpenInvite,
  onDeleted,
  onManageProducts,
  onManageDeliveryAgents,
}: ManageOutletDialogProps) {
  const [activeTab, setActiveTab] = useState<"management" | "orders">("management");
  const [admins, setAdmins] = useState<AdminWithUser[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("management");
      fetchAdmins();
    }
  }, [isOpen, outletId]);

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

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this admin?")) {
      return;
    }

    setRemovingId(userId);
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/admins/${userId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        setAdmins(admins.filter((admin) => admin.userId !== userId));
      } else {
        alert(result.error || "Failed to remove admin");
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      alert("Failed to remove admin");
    } finally {
      setRemovingId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setUpdatingRoleId(userId);
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/admins/${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );
      const result = await response.json();
      if (result.success) {
        setAdmins(admins.map(admin => 
          admin.userId === userId ? { ...admin, role: newRole } : admin
        ));
      } else {
        alert(result.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }

    setCancellingInviteId(invitationId);
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/invitations/${invitationId}`,
        {
          method: "DELETE",
        }
      );
      const result = await response.json();
      if (result.success) {
        setPendingInvitations(pendingInvitations.filter(inv => inv.id !== invitationId));
      } else {
        alert(result.error || "Failed to cancel invitation");
      }
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      alert("Failed to cancel invitation");
    } finally {
      setCancellingInviteId(null);
    }
  };

  const handleDeleteOutlet = async () => {
    if (!confirm(`Are you sure you want to delete "${outletName}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/outlets/${outletId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        onDeleted();
        onClose();
      } else {
        alert(result.error || "Failed to delete outlet");
      }
    } catch (error) {
      console.error("Error deleting outlet:", error);
      alert("Failed to delete outlet");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Manage Outlet</h2>
            <p className="text-sm text-muted-foreground mt-1">{outletName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 px-4 sm:px-6 pt-4 border-b border-border">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Orders Tab */}
          {activeTab === "orders" && (
            <OutletOrders outletId={outletId} outletName={outletName} />
          )}

          {/* Management Tab */}
          {activeTab === "management" && (
            <div className="space-y-6">
          {/* Admins Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Admins</h3>
              {isOwner && (
                <button
                  onClick={onOpenInvite}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Invite
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-6 bg-card border border-border rounded-lg">
                <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No admins assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                  >
                    {admin.user.image ? (
                      <img
                        src={admin.user.image}
                        alt={admin.user.name}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {admin.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{admin.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {admin.user.email}
                      </p>
                      {isOwner ? (
                        <select
                          value={admin.role}
                          onChange={(e) => handleChangeRole(admin.userId, e.target.value)}
                          disabled={updatingRoleId === admin.userId}
                          className="mt-1 px-2 py-0.5 text-xs font-medium bg-secondary/50 text-secondary-foreground rounded border border-border focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                        </select>
                      ) : (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-secondary/50 text-secondary-foreground rounded">
                          {admin.role}
                        </span>
                      )}
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.userId)}
                        disabled={removingId === admin.userId}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Remove admin"
                      >
                        {removingId === admin.userId ? (
                          <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations Section */}
          {isOwner && pendingInvitations.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pending Invitations
              </h3>
              <div className="space-y-2">
                {pendingInvitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-amber-200 text-amber-800 rounded">
                        {invite.role}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCancelInvitation(invite.id)}
                      disabled={cancellingInviteId === invite.id}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Cancel invitation"
                    >
                      {cancellingInviteId === invite.id ? (
                        <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-base font-semibold mb-3">Products</h3>
            <button
              onClick={onManageProducts}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-secondary/50 hover:bg-secondary/70 border border-border rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              Manage Outlet Products
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Select which products are available at this outlet
            </p>
          </div>

          {/* Delivery Agents Section */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-base font-semibold mb-3">Delivery Agents</h3>
            <button
              onClick={onManageDeliveryAgents}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-secondary/50 hover:bg-secondary/70 border border-border rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Manage Delivery Agents
            </button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Add and manage delivery agents for this outlet
            </p>
          </div>

          {/* Danger Zone - Delete Outlet */}
          {isOwner && (
            <div className="pt-4 border-t border-border">
              <h3 className="text-base font-semibold text-destructive mb-3">Danger Zone</h3>
              <button
                onClick={handleDeleteOutlet}
                disabled={isDeleting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Outlet
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                This will permanently delete the outlet and all associated data
              </p>
            </div>
          )}
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
