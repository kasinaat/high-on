import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryAgent, outlet, outletAdmin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import type {
  UpdateDeliveryAgentInput,
  ApiResponse,
  DeliveryAgent,
} from "@/lib/types";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; agentId: string }> }
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
    const agentId = params.agentId;
    const body = (await req.json()) as UpdateDeliveryAgentInput;

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
          error: "You don't have permission to update delivery agents for this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // Update delivery agent
    const updated = await db
      .update(deliveryAgent)
      .set(updateData)
      .where(
        and(eq(deliveryAgent.id, agentId), eq(deliveryAgent.outletId, outletId))
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Delivery agent not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated[0],
    } as ApiResponse<DeliveryAgent>);
  } catch (error) {
    console.error("Error updating delivery agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update delivery agent",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; agentId: string }> }
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
    const agentId = params.agentId;

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
          error: "You don't have permission to delete delivery agents from this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Delete delivery agent
    const deleted = await db
      .delete(deliveryAgent)
      .where(
        and(eq(deliveryAgent.id, agentId), eq(deliveryAgent.outletId, outletId))
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Delivery agent not found",
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: "Delivery agent deleted successfully" },
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error("Error deleting delivery agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete delivery agent",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
