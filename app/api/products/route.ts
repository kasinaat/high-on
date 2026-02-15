import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { product } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { CreateProductInput, ApiResponse, Product } from "@/lib/types";

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

    // Get all products created by the user
    const products = await db
      .select()
      .from(product)
      .where(eq(product.createdBy, session.user.id));

    return NextResponse.json({
      success: true,
      data: products,
    } as ApiResponse<Product[]>);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" } as ApiResponse<never>,
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

    const body = (await req.json()) as CreateProductInput;

    if (!body.name || !body.basePrice || !body.imageUrl) {
      return NextResponse.json(
        { success: false, error: "Name, base price, and image are required" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // Validate price is a valid number
    const price = parseFloat(body.basePrice);
    if (isNaN(price) || price < 0) {
      return NextResponse.json(
        { success: false, error: "Invalid price" } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const newProduct = await db
      .insert(product)
      .values({
        id: nanoid(),
        name: body.name,
        description: body.description || null,
        basePrice: body.basePrice,
        category: body.category || null,
        imageUrl: body.imageUrl,
        createdBy: session.user.id,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newProduct[0],
      } as ApiResponse<Product>,
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create product" } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
