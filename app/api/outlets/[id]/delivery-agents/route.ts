import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliveryAgent, outlet, outletAdmin } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type {
  CreateDeliveryAgentInput,
  ApiResponse,
  DeliveryAgent,
} from "@/lib/types";

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
          error: "You don't have permission to view delivery agents for this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Get all delivery agents for this outlet
    const agents = await db
      .select()
      .from(deliveryAgent)
      .where(eq(deliveryAgent.outletId, outletId));

    return NextResponse.json({
      success: true,
      data: agents,
    } as ApiResponse<DeliveryAgent[]>);
  } catch (error) {
    console.error("Error fetching delivery agents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch delivery agents",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}

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
    const body = (await req.json()) as CreateDeliveryAgentInput;

    if (!body.name || !body.phone) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and phone are required",
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

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
          error: "You don't have permission to add delivery agents to this outlet",
        } as ApiResponse<never>,
        { status: 403 }
      );
    }

    // Create delivery agent
    const newAgent = await db
      .insert(deliveryAgent)
      .values({
        id: nanoid(),
        outletId,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newAgent[0],
    } as ApiResponse<DeliveryAgent>);
  } catch (error) {
    console.error("Error creating delivery agent:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create delivery agent",
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
