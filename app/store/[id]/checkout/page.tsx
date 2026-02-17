'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useNotification } from '@/lib/notification-context';
import { Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface CartItem {
  productId: string;
  name: string;
  price: string;
  imageUrl: string;
  description?: string;
  quantity: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const outletId = params.id as string;
  const { data: session, isPending } = useSession();
  const { showNotification } = useNotification();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [outlet, setOutlet] = useState<any>(null);
  const [pincode, setPincode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isPending) return;

    if (session?.user) {
      // Set user data if logged in
      setCustomerName(session.user.name || '');
      setCustomerEmail(session.user.email || '');
    }
    // Guest checkout is allowed - no redirect needed
  }, [session, isPending]);

  // Load cart and outlet details
  useEffect(() => {
    if (isPending) return;

    const loadCheckoutData = async () => {
      try {
        // Load cart from localStorage
        const savedCart = localStorage.getItem(`cart_${outletId}`);
        if (!savedCart) {
          showNotification('error', 'Your cart is empty');
          router.push(`/store/${outletId}`);
          return;
        }

        const cartData = JSON.parse(savedCart);
        if (!cartData || cartData.length === 0) {
          showNotification('error', 'Your cart is empty');
          router.push(`/store/${outletId}`);
          return;
        }

        setCart(cartData);

        // Load pincode from customer_pincode
        let savedPincode = localStorage.getItem('customer_pincode');

        // Fetch outlet details from menu API
        const response = await fetch(`/api/store/${outletId}/menu`);
        if (!response.ok) throw new Error('Failed to fetch outlet details');
        const result = await response.json();
        if (result.success && result.data.outlet) {
          setOutlet(result.data.outlet);
          
          // If no saved pincode from user's search, use outlet's pincode
          if (!savedPincode && result.data.outlet.pincode) {
            savedPincode = result.data.outlet.pincode;
            localStorage.setItem('customer_pincode', result.data.outlet.pincode);
          }
        }

        if (savedPincode) {
          setPincode(savedPincode);
        }
      } catch (error) {
        console.error('Failed to load checkout data:', error);
        showNotification('error', 'Failed to load checkout data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, [outletId, router, isPending]);

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      return total + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerPhone || !deliveryAddress) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    // Pincode should be available from localStorage (from store selection)
    if (!pincode) {
      showNotification('error', 'Unable to determine delivery location. Please go back and select a store.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/store/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          outletId,
          customerName,
          customerPhone,
          customerEmail,
          deliveryAddress,
          pincode,
          notes,
          items: cart.map(item => ({
            productId: item.productId,
            productName: item.name,
            productPrice: item.price,
            productImage: item.imageUrl,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const order = await response.json();

      // Clear cart
      localStorage.removeItem(`cart_${outletId}`);

      showNotification('success', 'Order placed successfully! We will contact you shortly.');
      
      // Redirect based on auth status
      if (session?.user) {
        router.push('/orders');
      } else {
        router.push(`/store/${outletId}`);
      }
    } catch (error: any) {
      console.error('Failed to place order:', error);
      showNotification('error', error.message || 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  const total = calculateTotal();

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/store/${outletId}`)}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Menu
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {outlet && (
            <p className="text-gray-600 mt-1">
              {outlet.name} • {pincode}
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Delivery Fee</span>
                <span>₹0.00</span>
              </div>
              <div className="border-t pt-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Details</h2>
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  Full Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-1">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email {!session && <span className="text-gray-400">(Optional)</span>}
                </label>
                <input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required={!!session}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium mb-1">
                  Delivery Address *
                </label>
                <textarea
                  id="address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  rows={3}
                  placeholder="Enter your complete address"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium mb-1">
                  Order Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any special instructions?"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-pink-500 text-white py-3 rounded-md font-semibold hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order • ₹${total.toFixed(2)}`
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
