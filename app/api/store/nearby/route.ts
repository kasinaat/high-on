import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet } from "@/db/schema";
import { eq } from "drizzle-orm";
import { calculateDistance } from "@/lib/geocoding";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { latitude, longitude } = body;

    if (!latitude || !longitude) {
      return NextResponse.json(
        { success: false, error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const userLat = parseFloat(latitude);
    const userLon = parseFloat(longitude);

    if (isNaN(userLat) || isNaN(userLon)) {
      return NextResponse.json(
        { success: false, error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    // Fetch all active outlets with coordinates
    const outlets = await db
      .select()
      .from(outlet)
      .where(eq(outlet.isActive, true));

    // Calculate distance for each outlet and filter by outlet's delivery radius
    const outletsWithDistance = outlets
      .filter((o) => o.latitude && o.longitude) // Only outlets with coordinates
      .map((o) => {
        const outletLat = parseFloat(o.latitude!);
        const outletLon = parseFloat(o.longitude!);
        const distance = calculateDistance(userLat, userLon, outletLat, outletLon);
        const outletDeliveryRadius = parseFloat(o.deliveryRadius || '10');

        return {
          ...o,
          distance,
          deliveryRadius: outletDeliveryRadius,
        };
      })
      .filter((o) => o.distance <= o.deliveryRadius) // Filter by outlet's delivery radius
      .sort((a, b) => a.distance - b.distance); // Sort by distance (nearest first)

    return NextResponse.json({
      success: true,
      data: outletsWithDistance,
    });
  } catch (error) {
    console.error("Error fetching nearby outlets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch nearby outlets" },
      { status: 500 }
    );
  }
}
