"use client";

import { useState, useEffect } from "react";
import { Loader2, Package, User, Phone, MapPin, Clock } from "lucide-react";
import Image from "next/image";

type OrderItem = {
  id: string;
  productName: string;
  productPrice: string;
  productImage: string | null;
  quantity: number;
  subtotal: string;
};

type Order = {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerImage: string | null;
  deliveryAddress: string;
  pincode: string;
  totalAmount: string;
  status: string;
  deliveryAgentId: string | null;
  deliveryAgentName: string | null;
  deliveryAgentPhone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

type DeliveryAgent = {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
};

interface OutletOrdersProps {
  outletId: string;
  outletName: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-800",
  out_for_delivery: "bg-orange-100 text-orange-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OutletOrders({ outletId, outletName }: OutletOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryAgents();
  }, [outletId]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeliveryAgents = async () => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/delivery-agents`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDeliveryAgents(result.data.filter((agent: DeliveryAgent) => agent.isActive));
        }
      }
    } catch (error) {
      console.error("Failed to fetch delivery agents:", error);
    }
  };

  const handleAssignAgent = async (orderId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          deliveryAgentId: agentId || null,
        }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to assign agent:", error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/outlets/${outletId}/orders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
        }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center p-8">
        <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No orders yet</p>
        <p className="text-sm text-gray-500 mt-1">Orders will appear here when customers place them</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">{outletName} - Orders</h3>
      
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Order Header */}
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {order.customerImage ? (
                  <Image
                    src={order.customerImage}
                    alt={order.customerName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{order.customerName}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-lg">₹{order.totalAmount}</p>
              <p className="text-sm text-gray-500">{order.items.length} items</p>
            </div>
          </div>

          {/* Expanded Order Details */}
          {expandedOrder === order.id && (
            <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Customer Details</h4>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {order.customerPhone}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{order.deliveryAddress}, {order.pincode}</span>
                    </p>
                    {order.notes && (
                      <p className="text-gray-600 italic mt-2">Note: {order.notes}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-2">Delivery Agent</h4>
                  {order.deliveryAgentId ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">{order.deliveryAgentName}</span>
                        <br />
                        <span className="text-gray-600">{order.deliveryAgentPhone}</span>
                      </p>
                      <button
                        onClick={() => handleAssignAgent(order.id, "")}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Unassign
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => handleAssignAgent(order.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      defaultValue=""
                    >
                      <option value="">Select delivery agent...</option>
                      {deliveryAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} - {agent.phone}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded">
                      {item.productImage && (
                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.productPrice}</p>
                      </div>
                      <p className="font-semibold text-sm">₹{item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Update Status</h4>
                <div className="flex flex-wrap gap-2">
                  {["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(order.id, status)}
                      disabled={order.status === status}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        order.status === status
                          ? STATUS_COLORS[status]
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
