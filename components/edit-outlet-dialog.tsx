"use client";

import { useState, useEffect } from "react";
import type { UpdateOutletInput, Outlet } from "@/lib/types";

interface EditOutletDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  outlet: Outlet;
}

export function EditOutletDialog({ isOpen, onClose, onSuccess, outlet }: EditOutletDialogProps) {
  const [formData, setFormData] = useState<UpdateOutletInput>({
    name: "",
    address: "",
    pincode: "",
    phone: "",
    latitude: "",
    longitude: "",
    deliveryRadius: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Initialize form with outlet data when dialog opens
  useEffect(() => {
    if (isOpen && outlet) {
      setFormData({
        name: outlet.name,
        address: outlet.address,
        pincode: outlet.pincode,
        phone: outlet.phone || "",
        latitude: outlet.latitude || "",
        longitude: outlet.longitude || "",
        deliveryRadius: outlet.deliveryRadius || "10",
      });
    }
  }, [isOpen, outlet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/outlets/${outlet.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Failed to update outlet");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-border p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold">Edit Outlet</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Outlet Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              placeholder="Sweet Scoops Downtown"
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-2">
              Address *
            </label>
            <textarea
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base resize-none"
              placeholder="123 Main St, City, State 12345"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="pincode" className="block text-sm font-medium mb-2">
              Pincode *
            </label>
            <input
              id="pincode"
              type="text"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              placeholder="123456"
              maxLength={6}
              pattern="[0-9]{6}"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <label htmlFor="deliveryRadius" className="block text-sm font-medium mb-2">
              Delivery Radius (km) *
            </label>
            <input
              id="deliveryRadius"
              type="number"
              required
              min="1"
              max="100"
              step="0.5"
              value={formData.deliveryRadius}
              onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm sm:text-base"
              placeholder="10"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Maximum distance for deliveries from this outlet
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">
                Coordinates (Optional)
              </label>
              <p className="text-xs text-muted-foreground">
                Update location for better store finding. <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Get coordinates from Google Maps</a>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="latitude" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Latitude
                </label>
                <input
                  id="latitude"
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="28.6139"
                  pattern="^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]+)?$"
                />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-xs font-medium mb-1.5 text-muted-foreground">
                  Longitude
                </label>
                <input
                  id="longitude"
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="77.2090"
                  pattern="^-?([0-9]{1,2}|1[0-7][0-9]|180)(\.[0-9]+)?$"
                />
              </div>
            </div>
            
            <details className="mt-3">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                How to get coordinates from Google Maps?
              </summary>
              <ol className="text-xs text-muted-foreground mt-2 space-y-1 pl-4 list-decimal">
                <li>Open Google Maps and find your outlet location</li>
                <li>Right-click on the exact location</li>
                <li>Click the coordinates at the top to copy them</li>
                <li>Paste the first number in Latitude, second in Longitude</li>
              </ol>
            </details>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm sm:text-base font-medium border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm sm:text-base font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Outlet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
