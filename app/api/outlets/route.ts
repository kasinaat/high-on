import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { outlet, outletAdmin, invitation } from "@/db/schema";
import { auth } from "@/lib/auth";
import { sendInvitationEmail } from "@/lib/email";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CreateOutletInput, ApiResponse, Outlet } from "@/lib/types";

export async function GET(req: NextRequest) {
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

    // Get outlets owned by user or where user is an admin
    const ownedOutlets = await db
      .select()
      .from(outlet)
      .where(eq(outlet.ownerId, session.user.id));

    const adminOutlets = await db
      .select({
        id: outlet.id,
        name: outlet.name,
        address: outlet.address,
        pincode: outlet.pincode,
        phone: outlet.phone,
        ownerId: outlet.ownerId,
        isActive: outlet.isActive,
        createdAt: outlet.createdAt,
        updatedAt: outlet.updatedAt,
      })
      .from(outletAdmin)
      .innerJoin(outlet, eq(outletAdmin.outletId, outlet.id))
      .where(eq(outletAdmin.userId, session.user.id));

    // Add isOwner flag to owned outlets
    const ownedOutletsWithFlag = ownedOutlets.map(o => ({ ...o, isOwner: true }));
    const adminOutletsWithFlag = adminOutlets.map(o => ({ ...o, isOwner: false }));

    const allOutlets = [...ownedOutletsWithFlag, ...adminOutletsWithFlag];

    return NextResponse.json({
      success: true,
      data: allOutlets,
    } as ApiResponse<Outlet[]>);
  } catch (error) {
    console.error("Error fetching outlets:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch outlets" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

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

    const body = (await req.json()) as CreateOutletInput;

    if (!body.name || !body.address || !body.pincode) {
      return NextResponse.json(
        { success: false, error: "Name, address, and pincode are required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const newOutlet = await db
      .insert(outlet)
      .values({
        id: nanoid(),
        name: body.name,
        address: body.address,
        pincode: body.pincode,
        phone: body.phone,
        ownerId: session.user.id,
      })
      .returning();

    const createdOutlet = newOutlet[0];

    // If admin email is provided, create invitation and send email
    if (body.adminEmail && body.adminEmail.trim() !== "") {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const inviteToken = nanoid(32);

      try {
        // Create invitation
        await db.insert(invitation).values({
          id: nanoid(),
          email: body.adminEmail,
          outletId: createdOutlet.id,
          invitedBy: session.user.id,
          role: "admin",
          token: inviteToken,
          expiresAt,
          status: "pending",
        });

        // Send invitation email
        await sendInvitationEmail({
          to: body.adminEmail,
          outletName: createdOutlet.name,
          inviterName: session.user.name || "Someone",
          token: inviteToken,
        });
      } catch (emailError) {
        console.error("Error sending invitation email:", emailError);
        // Continue even if email fails - outlet is still created
      }
    }

    return NextResponse.json({
      success: true,
      data: createdOutlet,
    } as ApiResponse<Outlet>);
  } catch (error) {
    console.error("Error creating outlet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create outlet" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
