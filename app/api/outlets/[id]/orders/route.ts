import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { order, orderItem, user, deliveryAgent } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const outletId = params.id;

    // Fetch orders for this outlet
    const ordersData = await db
      .select()
      .from(order)
      .where(eq(order.outletId, outletId))
      .orderBy(desc(order.createdAt));

    // Fetch related data for each order
    const ordersWithDetails = await Promise.all(
      ordersData.map(async (o) => {
        // Get customer info if customerId exists (null for guest orders)
        let customer = null;
        if (o.customerId) {
          [customer] = await db
            .select()
            .from(user)
            .where(eq(user.id, o.customerId))
            .limit(1);
        }

        // Get delivery agent info if assigned
        let agent = null;
        if (o.deliveryAgentId) {
          [agent] = await db
            .select()
            .from(deliveryAgent)
            .where(eq(deliveryAgent.id, o.deliveryAgentId))
            .limit(1);
        }

        // Get order items
        const items = await db
          .select()
          .from(orderItem)
          .where(eq(orderItem.orderId, o.id));

        return {
          id: o.id,
          customerId: o.customerId,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          customerEmail: o.customerEmail,
          deliveryAddress: o.deliveryAddress,
          pincode: o.pincode,
          totalAmount: o.totalAmount,
          status: o.status,
          deliveryAgentId: o.deliveryAgentId,
          notes: o.notes,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
          customerImage: customer?.image || null,
          deliveryAgentName: agent?.name || null,
          deliveryAgentPhone: agent?.phone || null,
          items,
        };
      })
    );

    return NextResponse.json(ordersWithDetails);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Update order (assign delivery agent, change status)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const outletId = params.id;
    const body = await request.json();
    const { orderId, deliveryAgentId, status } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (deliveryAgentId !== undefined) {
      updateData.deliveryAgentId = deliveryAgentId;
      // Auto-update status when agent is assigned
      if (deliveryAgentId && !status) {
        updateData.status = 'confirmed';
      }
    }

    if (status) {
      updateData.status = status;
    }

    // Update the order
    const [updatedOrder] = await db
      .update(order)
      .set(updateData)
      .where(eq(order.id, orderId))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
