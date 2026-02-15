import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outletAdmin, outlet } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
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
    const userIdToRemove = params.userId;

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
          error: "Only the outlet owner can remove admins",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Cannot remove yourself if you're the owner
    if (session.user.id === userIdToRemove) {
      return NextResponse.json(
        {
          success: false,
          error: "Owners cannot be removed from their outlets",
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Remove admin
    const deleted = await db
      .delete(outletAdmin)
      .where(
        and(
          eq(outletAdmin.outletId, outletId),
          eq(outletAdmin.userId, userIdToRemove)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin not found for this outlet",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Admin removed successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error removing admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove admin",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
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
    const userIdToUpdate = params.userId;
    const body = await req.json();
    const { role } = body;

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role is required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

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
          error: "Only the outlet owner can update admin roles",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Update admin role
    const updated = await db
      .update(outletAdmin)
      .set({ role })
      .where(
        and(
          eq(outletAdmin.outletId, outletId),
          eq(outletAdmin.userId, userIdToUpdate)
        )
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin not found for this outlet",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Admin role updated successfully", admin: updated[0] },
    } as ApiResponse<{ message: string; admin: typeof updated[0] }>);
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update admin",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
