"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Package, ChevronDown, ChevronUp, MapPin, Phone, Store, ArrowLeft, ShoppingBag } from "lucide-react";
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
  outletId: string;
  outlet: {
    name: string;
    address: string;
    phone: string;
  };
  items: OrderItem[];
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-blue-100 text-blue-800 border-blue-300",
  preparing: "bg-purple-100 text-purple-800 border-purple-300",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login?callbackUrl=/orders");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/store/orders");
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

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
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

  const filteredOrders = selectedStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/store")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-semibold">My Orders</h1>
              <p className="text-xs sm:text-sm text-gray-600">{session.user?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedStatus("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setSelectedStatus("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "pending"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Pending ({orders.filter(o => o.status === "pending").length})
          </button>
          <button
            onClick={() => setSelectedStatus("confirmed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "confirmed"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Confirmed ({orders.filter(o => o.status === "confirmed").length})
          </button>
          <button
            onClick={() => setSelectedStatus("out_for_delivery")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "out_for_delivery"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            On the Way ({orders.filter(o => o.status === "out_for_delivery").length})
          </button>
          <button
            onClick={() => setSelectedStatus("delivered")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStatus === "delivered"
                ? "bg-primary text-primary-foreground"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Delivered ({orders.filter(o => o.status === "delivered").length})
          </button>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedStatus === "all" ? "No orders yet" : `No ${STATUS_LABELS[selectedStatus]?.toLowerCase()} orders`}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === "all" ? "Start ordering your favorite ice cream!" : "Try a different filter"}
            </p>
            <button
              onClick={() => router.push("/store")}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => toggleExpand(order.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full border ${
                            STATUS_COLORS[order.status]
                          }`}
                        >
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 mb-1">
                        <Store className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">{order.outlet.name}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{order.outlet.address}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-lg font-bold text-primary">₹{order.totalAmount}</span>
                      {expandedOrder === order.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedOrder === order.id && (
                  <div className="border-t border-gray-200">
                    {/* Order Items */}
                    <div className="p-4 bg-gray-50">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 bg-white p-3 rounded-lg"
                          >
                            {item.productImage ? (
                              <Image
                                src={item.productImage}
                                alt={item.productName}
                                width={60}
                                height={60}
                                className="rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{item.productName}</p>
                              <p className="text-sm text-gray-600">
                                ₹{item.productPrice} × {item.quantity}
                              </p>
                            </div>
                            <p className="font-semibold text-gray-900">₹{item.subtotal}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                        <p className="text-sm text-gray-600">PIN: {order.pincode}</p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Contact
                        </h4>
                        <p className="text-sm text-gray-700">{order.customerName}</p>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {order.customerPhone}
                        </a>
                      </div>

                      {order.notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">Notes</h4>
                          <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-900">Total Amount</span>
                          <span className="text-xl font-bold text-primary">₹{order.totalAmount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reorder Button */}
                    {order.status === "delivered" && (
                      <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button
                          onClick={() => router.push(`/store/${order.outletId}`)}
                          className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                        >
                          Order Again
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
