import { NextResponse } from 'next/server';
import { db } from '@/db';
import { order as orderTable, orderItem as orderItemTable } from '@/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { nanoid } from 'nanoid';

interface OrderItem {
  productId: string;
  productName: string;
  productPrice: string;
  productImage: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      outletId,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      pincode,
      notes,
      items,
    } = body;

    // Validate required fields
    if (
      !outletId ||
      !customerName ||
      !customerPhone ||
      !customerEmail ||
      !deliveryAddress ||
      !pincode ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce((total: number, item: OrderItem) => {
      return total + parseFloat(item.productPrice) * item.quantity;
    }, 0);

    // Create order
    const orderId = nanoid();
    const [newOrder] = await db
      .insert(orderTable)
      .values({
        id: orderId,
        customerId: session.user.id,
        outletId,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        pincode,
        totalAmount: totalAmount.toFixed(2),
        status: 'pending',
        notes: notes || null,
      })
      .returning();

    // Create order items
    const orderItems = items.map((item: OrderItem) => ({
      id: nanoid(),
      orderId: newOrder.id,
      productId: item.productId,
      productName: item.productName,
      productPrice: item.productPrice,
      productImage: item.productImage,
      quantity: item.quantity,
      subtotal: (parseFloat(item.productPrice) * item.quantity).toFixed(2),
    }));

    await db.insert(orderItemTable).values(orderItems);

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get all orders for current user
export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await db.query.order.findMany({
      where: (order, { eq }) => eq(order.customerId, session.user.id),
      orderBy: (order, { desc }) => [desc(order.createdAt)],
      with: {
        outlet: true,
        items: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
