import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outletAdmin, outlet, user, invitation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type { ApiResponse, Invitation } from "@/lib/types";

type AdminWithUser = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

export async function GET(
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

    // Check if user owns the outlet or is an admin
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

    // Check if user is an admin of this outlet
    const adminCheck = await db
      .select()
      .from(outletAdmin)
      .where(
        and(
          eq(outletAdmin.outletId, outletId),
          eq(outletAdmin.userId, session.user.id)
        )
      )
      .limit(1);

    const isAdmin = adminCheck.length > 0;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to view admins for this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Get all admins for this outlet
    const admins = await db
      .select({
        id: outletAdmin.id,
        userId: outletAdmin.userId,
        role: outletAdmin.role,
        createdAt: outletAdmin.createdAt,
        userName: user.name,
        userEmail: user.email,
        userImage: user.image,
      })
      .from(outletAdmin)
      .innerJoin(user, eq(outletAdmin.userId, user.id))
      .where(eq(outletAdmin.outletId, outletId));

    const formattedAdmins: AdminWithUser[] = admins.map((admin) => ({
      id: admin.id,
      userId: admin.userId,
      role: admin.role,
      createdAt: admin.createdAt,
      user: {
        id: admin.userId,
        name: admin.userName,
        email: admin.userEmail,
        image: admin.userImage,
      },
    }));

    // Get pending invitations (only for owners)
    let pendingInvitations: Invitation[] = [];
    if (isOwner) {
      pendingInvitations = await db
        .select()
        .from(invitation)
        .where(
          and(
            eq(invitation.outletId, outletId),
            eq(invitation.status, "pending")
          )
        );
    }

    return NextResponse.json({
      success: true,
      data: { admins: formattedAdmins, isOwner, pendingInvitations },
    } as ApiResponse<{ admins: AdminWithUser[]; isOwner: boolean; pendingInvitations: Invitation[] }>);
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch admins",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
