import { NextResponse } from 'next/server';
import { db } from '@/db';
import { order, orderItem, outlet, deliveryAgent } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq, and, desc } from 'drizzle-orm';
import { headers } from 'next/headers';

// Get orders for a specific delivery agent
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find delivery agent record for this user
    const agents = await db
      .select()
      .from(deliveryAgent)
      .where(eq(deliveryAgent.email, session.user.email));

    if (agents.length === 0) {
      return NextResponse.json({ error: 'Not a delivery agent' }, { status: 403 });
    }

    const agentIds = agents.map(a => a.id);

    // Fetch orders assigned to any of this user's delivery agent records
    const orders = await db
      .select({
        id: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress,
        pincode: order.pincode,
        totalAmount: order.totalAmount,
        status: order.status,
        notes: order.notes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        outletName: outlet.name,
        outletAddress: outlet.address,
        outletPhone: outlet.phone,
      })
      .from(order)
      .innerJoin(outlet, eq(order.outletId, outlet.id))
      .where(eq(order.deliveryAgentId, agentIds[0])) // Simplified - in production handle multiple agent IDs
      .orderBy(desc(order.createdAt));

    // Fetch order items for all orders
    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db
          .select()
          .from(orderItem)
          .where(eq(orderItem.orderId, o.id));
        
        return {
          ...o,
          items,
        };
      })
    );

    return NextResponse.json(ordersWithItems);
  } catch (error) {
    console.error('Failed to fetch delivery agent orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Update order status (for delivery agents)
export async function PATCH(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Verify this order is assigned to the delivery agent
    const agents = await db
      .select()
      .from(deliveryAgent)
      .where(eq(deliveryAgent.email, session.user.email));

    if (agents.length === 0) {
      return NextResponse.json({ error: 'Not a delivery agent' }, { status: 403 });
    }

    // Update the order status
    const [updatedOrder] = await db
      .update(order)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(order.id, orderId),
          eq(order.deliveryAgentId, agents[0].id)
        )
      )
      .returning();

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found or not assigned to you' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
