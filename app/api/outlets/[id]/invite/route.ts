import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invitation, outlet, outletAdmin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { InviteAdminInput, ApiResponse, Invitation } from "@/lib/types";

export async function POST(
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
    const body = (await req.json()) as InviteAdminInput;

    if (!body.email) {
      return NextResponse.json(
        { success: false, error: "Email is required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Verify user owns the outlet or is an admin
    const outletData = await db
      .select()
      .from(outlet)
      .where(eq(outlet.id, outletId))
      .limit(1);

    if (!outletData.length) {
      return NextResponse.json(
        { success: false, error: "Outlet not found" } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const isOwner = outletData[0].ownerId === session.user.id;

    if (!isOwner) {
      return NextResponse.json(
        { success: false, error: "Only the outlet owner can invite admins" } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const inviteToken = nanoid(32);

    const newInvitation = await db
      .insert(invitation)
      .values({
        id: nanoid(),
        email: body.email,
        outletId,
        invitedBy: session.user.id,
        role: body.role || "admin",
        token: inviteToken,
        expiresAt,
        status: "pending",
      })
      .returning();

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: body.email,
      outletName: outletData[0].name,
      inviterName: session.user.name || "Someone",
      token: inviteToken,
    });

    if (!emailResult.success) {
      console.error("Failed to send invitation email:", emailResult.error);
      // Still return success since the invitation was created
      // The user can be notified separately or retry sending
    }

    return NextResponse.json({
      success: true,
      data: newInvitation[0],
    } as ApiResponse<Invitation>);
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create invitation" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
