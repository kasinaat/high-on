import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { ApiResponse, Outlet } from "@/lib/types";
import { geocodeAddress, calculateDistance } from "@/lib/geocoding";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const pincode = searchParams.get("pincode");

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: "Pincode is required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Geocode the pincode to get its coordinates
    const pincodeCoordinates = await geocodeAddress("", pincode);

    if (!pincodeCoordinates) {
      return NextResponse.json({
        success: false,
        error: "Could not find location for this pincode",
        data: { serviceable: false },
      } as ApiResponse<{ serviceable: boolean }>);
    }

    const userLat = pincodeCoordinates.latitude;
    const userLon = pincodeCoordinates.longitude;

    // Find all active outlets with coordinates
    const outlets = await db
      .select()
      .from(outlet)
      .where(eq(outlet.isActive, true));

    // Filter outlets that can deliver to this location
    const serviceableOutlets = outlets
      .filter((o) => o.latitude && o.longitude)
      .map((o) => {
        const outletLat = parseFloat(o.latitude!);
        const outletLon = parseFloat(o.longitude!);
        const distance = calculateDistance(userLat, userLon, outletLat, outletLon);
        const outletDeliveryRadius = parseFloat(o.deliveryRadius || '10');

        return {
          ...o,
          distance,
        };
      })
      .filter((o) => o.distance <= parseFloat(o.deliveryRadius || '10'))
      .sort((a, b) => a.distance - b.distance);

    if (serviceableOutlets.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Sorry, we don't serve this area yet",
        data: { serviceable: false },
      } as ApiResponse<{ serviceable: boolean }>);
    }

    return NextResponse.json({
      success: true,
      data: {
        serviceable: true,
        outlets: serviceableOutlets,
      },
    } as ApiResponse<{ serviceable: boolean; outlets: Outlet[] }>);
  } catch (error) {
    console.error("Error checking pincode:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check pincode",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
