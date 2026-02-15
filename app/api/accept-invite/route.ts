import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation, outletAdmin, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiResponse } from "@/lib/types";

export async function POST(req: NextRequest) {
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

    const { token } = (await req.json()) as { token: string };

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await db
      .select()
      .from(invitation)
      .where(eq(invitation.token, token))
      .limit(1);

    if (!invite.length) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const inviteData = invite[0];

    // Check if invitation has expired
    if (new Date() > inviteData.expiresAt) {
      return NextResponse.json(
        { success: false, error: "Invitation has expired" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if invitation is already accepted
    if (inviteData.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "Invitation already accepted" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Check if user's email matches the invitation
    if (session.user.email !== inviteData.email) {
      return NextResponse.json(
        {
          success: false,
          error: "This invitation was sent to a different email address",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Check if user is already an admin for this outlet
    const existingAdmin = await db
      .select()
      .from(outletAdmin)
      .where(
        and(
          eq(outletAdmin.outletId, inviteData.outletId),
          eq(outletAdmin.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingAdmin.length) {
      return NextResponse.json(
        { success: false, error: "You are already an admin for this outlet" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Add user as outlet admin
    await db.insert(outletAdmin).values({
      id: nanoid(),
      outletId: inviteData.outletId,
      userId: session.user.id,
      role: inviteData.role,
    });

    // Update invitation status
    await db
      .update(invitation)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(invitation.id, inviteData.id));

    return NextResponse.json({
      success: true,
      data: { outletId: inviteData.outletId },
    } as ApiResponse<{ outletId: string }>);
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
