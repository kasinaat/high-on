"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Loader2, Package, MapPin, Phone, Clock, CheckCircle } from "lucide-react";
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
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  pincode: string;
  totalAmount: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  outletName: string;
  outletAddress: string;
  outletPhone: string;
  items: OrderItem[];
};

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

export default function DeliveryPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [assignedOrderCount, setAssignedOrderCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Replace this URL with your Cloudinary notification sound URL
  const NOTIFICATION_SOUND_URL = "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/notification.mp3";

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callbackUrl=/delivery");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
      
      // Poll for new assigned orders every 10 seconds
      const interval = setInterval(checkForNewOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/delivery/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
        const active = data.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled');
        setAssignedOrderCount(active.length);
      } else if (response.status === 403) {
        // Not a delivery agent
        alert("You are not registered as a delivery agent");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkForNewOrders = async () => {
    try {
      const response = await fetch("/api/delivery/orders");
      if (response.ok) {
        const data = await response.json();
        const active = data.filter((o: Order) => o.status !== 'delivered' && o.status !== 'cancelled');
        
        if (active.length > assignedOrderCount && assignedOrderCount > 0) {
          // New order assigned, play sound
          playNotificationSound();
        }
        setAssignedOrderCount(active.length);
        setOrders(data);
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

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch("/api/delivery/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
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

  if (isPending || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50">
      {/* Audio element for notifications */}
      <audio ref={audioRef} src={NOTIFICATION_SOUND_URL} preload="auto" />

      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Delivery Console</h1>
            <p className="text-xs sm:text-sm text-gray-600">{session.user?.name}</p>
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
      </header>

      <main className="px-4 py-6 max-w-6xl mx-auto">
        {/* Active Orders */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Active Deliveries ({activeOrders.length})
          </h2>

          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600">No active deliveries</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border shadow-sm overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{order.customerName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                            {STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                          <MapPin className="h-4 w-4" />
                          {order.deliveryAddress}, {order.pincode}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">₹{order.totalAmount}</p>
                        <p className="text-sm text-gray-500">{order.items.length} items</p>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="border-t bg-gray-50 p-4 space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Customer</h4>
                          <p className="text-sm flex items-center gap-2 mb-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${order.customerPhone}`} className="text-primary hover:underline">
                              {order.customerPhone}
                            </a>
                          </p>
                          {order.notes && (
                            <p className="text-sm text-gray-600 italic mt-2">Note: {order.notes}</p>
                          )}
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-2">Pickup Location</h4>
                          <p className="text-sm font-medium">{order.outletName}</p>
                          <p className="text-sm text-gray-600">{order.outletAddress}</p>
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${order.outletPhone}`} className="text-primary hover:underline">
                              {order.outletPhone}
                            </a>
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded">
                              {item.productImage && (
                                <div className="relative w-10 h-10 rounded overflow-hidden">
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
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm mb-2">Update Status</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleUpdateStatus(order.id, "out_for_delivery")}
                            disabled={order.status === "out_for_delivery"}
                            className={`px-4 py-2 rounded text-sm font-medium ${
                              order.status === "out_for_delivery"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                            }`}
                          >
                            Out for Delivery
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, "delivered")}
                            className="px-4 py-2 rounded text-sm font-medium bg-green-500 text-white hover:bg-green-600 flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Mark Delivered
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Orders */}
        {completedOrders.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-gray-600">
              Completed ({completedOrders.length})
            </h2>
            <div className="space-y-2">
              {completedOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg border p-4 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">₹{order.totalAmount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
