"use client";

import { useEffect, useState } from "react";
import { X, Plus, UserMinus, Edit, Check } from "lucide-react";
import type { DeliveryAgent, CreateDeliveryAgentInput } from "@/lib/types";

interface DeliveryAgentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  outletId: string;
  outletName: string;
}

export function DeliveryAgentsDialog({
  isOpen,
  onClose,
  outletId,
  outletName,
}: DeliveryAgentsDialogProps) {
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateDeliveryAgentInput>({
    name: "",
    phone: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen, outletId]);

  const fetchAgents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/delivery-agents`
      );
      const result = await response.json();
      if (result.success) {
        setAgents(result.data);
      }
    } catch (error) {
      console.error("Error fetching delivery agents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId
        ? `/api/outlets/${outletId}/delivery-agents/${editingId}`
        : `/api/outlets/${outletId}/delivery-agents`;
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        fetchAgents();
        setShowAddForm(false);
        setEditingId(null);
        setFormData({ name: "", phone: "", email: "" });
      } else {
        alert(result.error || "Failed to save delivery agent");
      }
    } catch (error) {
      console.error("Error saving delivery agent:", error);
      alert("Failed to save delivery agent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agent: DeliveryAgent) => {
    setEditingId(agent.id);
    setFormData({
      name: agent.name,
      phone: agent.phone,
      email: agent.email || "",
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (agent: DeliveryAgent) => {
    try {
      const response = await fetch(
        `/api/outlets/${outletId}/delivery-agents/${agent.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !agent.isActive }),
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchAgents();
      } else {
        alert(result.error || "Failed to update delivery agent");
      }
    } catch (error) {
      console.error("Error updating delivery agent:", error);
      alert("Failed to update delivery agent");
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm("Are you sure you want to delete this delivery agent?")) {
      return;
    }

    setDeletingId(agentId);

    try {
      const response = await fetch(
        `/api/outlets/${outletId}/delivery-agents/${agentId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        fetchAgents();
      } else {
        alert(result.error || "Failed to delete delivery agent");
      }
    } catch (error) {
      console.error("Error deleting delivery agent:", error);
      alert("Failed to delete delivery agent");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({ name: "", phone: "", email: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">
              Delivery Agents
            </h2>
            <p className="text-sm text-muted-foreground">{outletName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mb-4 px-4 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Delivery Agent
            </button>
          )}

          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="mb-6 p-4 bg-muted rounded-lg space-y-3"
            >
              <h3 className="font-medium">
                {editingId ? "Edit Agent" : "Add New Agent"}
              </h3>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Agent name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Email (optional)"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : editingId
                    ? "Update"
                    : "Add"}
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">
                Loading agents...
              </p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No delivery agents yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className={`p-4 border rounded-lg ${
                    agent.isActive
                      ? "border-border bg-card"
                      : "border-border bg-muted opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{agent.name}</h4>
                        {!agent.isActive && (
                          <span className="text-xs px-2 py-0.5 bg-muted-foreground/20 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📱 {agent.phone}
                      </p>
                      {agent.email && (
                        <p className="text-sm text-muted-foreground">
                          ✉️ {agent.email}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(agent)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleActive(agent)}
                        className={`p-2 hover:bg-accent rounded-lg transition-colors ${
                          agent.isActive ? "text-green-600" : "text-gray-400"
                        }`}
                        title={agent.isActive ? "Active" : "Inactive"}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(agent.id)}
                        disabled={deletingId === agent.id}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === agent.id ? (
                          <div className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
