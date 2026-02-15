import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";

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
