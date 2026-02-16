import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet } from "@/db/schema";
import { auth } from "@/lib/auth";
import { geocodeAddress } from "@/lib/geocoding";
import { eq } from "drizzle-orm";
import type { ApiResponse, UpdateOutletInput, Outlet } from "@/lib/types";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const params = await context.params;
    const outletId = params.id;

    // Check if user owns the outlet
    const outletData = await db
      .select()
      .from(outlet)
      .where(eq(outlet.id, outletId))
      .limit(1);

    if (outletData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Outlet not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const isOwner = outletData[0].ownerId === session.user.id;

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the outlet owner can delete this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Delete the outlet (cascade will handle related records)
    await db.delete(outlet).where(eq(outlet.id, outletId));

    return NextResponse.json({
      success: true,
      data: { message: "Outlet deleted successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error deleting outlet:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete outlet",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" } as ApiResponse<never>,
        { status: 401 }
      );
    }

    const params = await context.params;
    const outletId = params.id;
    const body = (await req.json()) as UpdateOutletInput;

    // Check if user owns the outlet
    const outletData = await db
      .select()
      .from(outlet)
      .where(eq(outlet.id, outletId))
      .limit(1);

    if (outletData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Outlet not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const isOwner = outletData[0].ownerId === session.user.id;

    if (!isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Only the outlet owner can update this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    let latitude: string | null | undefined = undefined;
    let longitude: string | null | undefined = undefined;

    // Handle coordinates update
    if (body.latitude !== undefined || body.longitude !== undefined) {
      // If both provided and valid, use them
      if (body.latitude && body.longitude) {
        const lat = parseFloat(body.latitude);
        const lon = parseFloat(body.longitude);
        
        if (!isNaN(lat) && !isNaN(lon)) {
          latitude = body.latitude;
          longitude = body.longitude;
        }
      }
      // If address or pincode changed, try geocoding
      else if (body.address || body.pincode) {
        const addressToGeocode = body.address || outletData[0].address;
        const pincodeToGeocode = body.pincode || outletData[0].pincode;
        
        const coordinates = await geocodeAddress(addressToGeocode, pincodeToGeocode);
        
        if (coordinates) {
          latitude = coordinates.latitude.toString();
          longitude = coordinates.longitude.toString();
        }
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<Outlet> = {};
    if (body.name) updateData.name = body.name;
    if (body.address) updateData.address = body.address;
    if (body.pincode) updateData.pincode = body.pincode;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.deliveryRadius !== undefined) updateData.deliveryRadius = body.deliveryRadius;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;

    // Update the outlet
    const updatedOutlet = await db
      .update(outlet)
      .set(updateData)
      .where(eq(outlet.id, outletId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedOutlet[0],
    } as ApiResponse<Outlet>);
  } catch (error) {
    console.error("Error updating outlet:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update outlet",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
