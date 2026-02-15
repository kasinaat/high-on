import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiResponse, Outlet } from "@/lib/types";

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

    // Find active outlets serving this pincode
    const outlets = await db
      .select()
      .from(outlet)
      .where(
        and(
          eq(outlet.pincode, pincode),
          eq(outlet.isActive, true)
        )
      );

    if (outlets.length === 0) {
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
        outlets: outlets,
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
