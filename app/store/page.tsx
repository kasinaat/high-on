"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { getCurrentLocation, formatDistance } from "@/lib/geolocation";
import { useNotification } from "@/lib/notification-context";
import type { Outlet } from "@/lib/types";

type OutletWithDistance = Outlet & { distance?: number };

export default function StorePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { showNotification } = useNotification();
  const [pincode, setPincode] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");
  const [outlets, setOutlets] = useState<OutletWithDistance[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [locationDenied, setLocationDenied] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Check if user has a previously selected outlet
    const savedOutletId = localStorage.getItem("selected_outlet_id");
    if (savedOutletId) {
      // Redirect directly to the outlet page
      router.push(`/store/${savedOutletId}`);
      return;
    }

    setIsInitialLoad(false);
    // Automatically request location on mount
    findNearbyStores();
  }, []);

  const findNearbyStores = async () => {
    setIsChecking(true);
    setError("");
    setOutlets([]);
    setLocationDenied(false);

    try {
      const result = await getCurrentLocation();

      if (!result.success) {
        // Location permission denied or unavailable
        setLocationDenied(true);
        setError(result.errorMessage || "Unable to access your location");
        setIsChecking(false);
        return;
      }

      setUserLocation({
        lat: result.coordinates!.latitude,
        lng: result.coordinates!.longitude,
      });

      // Fetch nearby outlets
      const response = await fetch("/api/store/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: result.coordinates!.latitude,
          longitude: result.coordinates!.longitude,
          maxDistance: 50, // 50 km radius
        }),
      });

      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setOutlets(data.data);
      } else {
        setError("No outlets found within 50 km of your location");
      }
    } catch (error) {
      console.error("Error finding nearby stores:", error);
      setError("Failed to find nearby stores. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const checkPincode = async (pincodeToCheck: string) => {
    setIsChecking(true);
    setError("");
    setOutlets([]);

    try {
      const response = await fetch(
        `/api/store/check-pincode?pincode=${pincodeToCheck}`
      );
      const result = await response.json();

      if (result.success && result.data.serviceable) {
        setOutlets(result.data.outlets);
        // Save pincode to localStorage
        localStorage.setItem("customer_pincode", pincodeToCheck);
      } else {
        setError(result.error || "Sorry, we don't serve this area yet");
        // Clear saved pincode if not serviceable
        localStorage.removeItem("customer_pincode");
      }
    } catch (error) {
      console.error("Error checking pincode:", error);
      setError("Failed to check pincode. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pincode.length !== 6 || !/^\d+$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    await checkPincode(pincode);
  };

  const handleReset = () => {
    setOutlets([]);
    setPincode("");
    setError("");
    setUserLocation(null);
    localStorage.removeItem("customer_pincode");
    localStorage.removeItem("selected_outlet_id");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF6B9D]/5 via-[#C8E6C9]/5 to-[#FFF9C4]/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🍦</span>
              <h1 className="text-xl sm:text-2xl font-bold text-primary">
                High On Ice Cream
              </h1>
            </div>
            {session && (
              <button
                onClick={() => router.push('/orders')}
                className="px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium text-foreground bg-card border border-border rounded-md hover:bg-accent transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span>My Orders</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Location/Pincode Banner - Show when outlets are loaded */}
      {outlets.length > 0 && (
        <div className="bg-secondary/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-secondary-foreground">
                  {userLocation ? "Showing stores near you" : `Delivering to ${pincode}`}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Search Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {isInitialLoad ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking your area...</p>
          </div>
        ) : isChecking ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full mb-6 animate-pulse">
              <span className="text-5xl sm:text-6xl">🍨</span>
            </div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-xl font-semibold mb-2">Finding stores near you...</p>
            <p className="text-muted-foreground">We're requesting your location permission</p>
          </div>
        ) : outlets.length === 0 ? (
          <div className="text-center">
            {/* Hero Section */}
            <div className="mb-8 sm:mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full mb-6">
                <span className="text-5xl sm:text-6xl">🍨</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {locationDenied ? "Enter Your Pincode" : "Craving Some Ice Cream?"}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                {locationDenied 
                  ? "We need your pincode to find stores in your area"
                  : "Let us help you find the perfect scoop!"
                }
              </p>
            </div>

            {locationDenied ? (
              <div className="max-w-md mx-auto">
                {error && (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Location access unavailable</p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-lg font-semibold mb-2">Enter Your Pincode</h3>
                    <p className="text-sm text-muted-foreground">
                      Check if we deliver to your area
                    </p>
                  </div>
                  <form onSubmit={handleCheckPincode} className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          if (value.length <= 6) {
                            setPincode(value);
                            setError("");
                          }
                        }}
                        placeholder="Enter 6-digit pincode"
                        className="w-full px-6 py-4 text-lg text-center border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        maxLength={6}
                      />
                      {pincode && (
                        <button
                          type="button"
                          onClick={() => {
                            setPincode("");
                            setError("");
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isChecking || pincode.length !== 6}
                      className="w-full px-6 py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                    >
                      {isChecking ? (
                        <>
                          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Check Availability
                        </>
                      )}
                    </button>
                  </form>

                  {error && !error.includes("Location") && !error.includes("location") && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setLocationDenied(false);
                      setError("");
                      findNearbyStores();
                    }}
                    className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Or try using my location
                  </button>
                </div>

                <p className="mt-6 text-sm text-muted-foreground text-center">
                  We're expanding fast! Can't find your area?
                  <br />
                  Check back soon or contact us to request service.
                </p>
              </div>
            ) : (
              /* No outlets found after successful location or pincode check */
              <div className="max-w-md mx-auto">
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Stores Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error || "We couldn't find any stores in your area"}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {!locationDenied && (
                      <button
                        onClick={findNearbyStores}
                        className="px-6 py-3 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors"
                      >
                        Try Location Again
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setLocationDenied(true);
                        setError("");
                        setPincode("");
                      }}
                      className="px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {locationDenied ? "Search Again" : "Try with Pincode"}
                    </button>
                  </div>
                </div>
                <p className="mt-6 text-sm text-muted-foreground text-center">
                  We're expanding fast! Check back soon or contact us.
                </p>
              </div>
            )}
          </div>
        ) : (
          // Outlets List
          <div>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                Available Outlets 🎉
              </h2>
              <p className="text-muted-foreground">
                Select an outlet to view their menu
              </p>
            </div>

            <div className="grid gap-4">
              {outlets.map((outlet) => (
                <button
                  key={outlet.id}
                  onClick={() => {
                    localStorage.setItem("selected_outlet_id", outlet.id);
                    router.push(`/store/${outlet.id}`);
                  }}
                  className="w-full p-6 bg-white border-2 border-border rounded-xl hover:border-primary hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {outlet.name}
                        </h3>
                        {outlet.distance !== undefined && (
                          <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            {formatDistance(outlet.distance)} away
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {outlet.address}
                        </p>
                        {outlet.phone && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {outlet.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <svg className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
