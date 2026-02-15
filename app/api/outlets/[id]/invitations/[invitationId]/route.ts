import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation, outlet } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type { ApiResponse } from "@/lib/types";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; invitationId: string }> }
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
    const invitationId = params.invitationId;

    // Check if invitation exists and belongs to the outlet
    const invitationData = await db
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.id, invitationId),
          eq(invitation.outletId, outletId)
        )
      )
      .limit(1);

    if (invitationData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invitation not found" } as ApiResponse<never>,
        { status: 404 }
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
          error: "Only the outlet owner can cancel invitations",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Delete the invitation
    await db.delete(invitation).where(eq(invitation.id, invitationId));

    return NextResponse.json({
      success: true,
      data: { message: "Invitation cancelled successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error cancelling invitation:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to cancel invitation",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
