import { pgTable, text, timestamp, boolean, integer, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Better Auth User Schema
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Outlets Schema
export const outlet = pgTable('outlet', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  pincode: text('pincode').notNull(),
  phone: text('phone'),
  latitude: decimal('latitude', { precision: 10, scale: 7 }),
  longitude: decimal('longitude', { precision: 10, scale: 7 }),
  deliveryRadius: decimal('deliveryRadius', { precision: 5, scale: 2 }).notNull().default('10'),
  ownerId: text('ownerId')
    .notNull()
    .references(() => user.id),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Outlet Admins - Many to Many relationship
export const outletAdmin = pgTable('outletAdmin', {
  id: text('id').primaryKey(),
  outletId: text('outletId')
    .notNull()
    .references(() => outlet.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('admin'), // admin, manager, etc.
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Invitations for outlet admins
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  outletId: text('outletId')
    .notNull()
    .references(() => outlet.id, { onDelete: 'cascade' }),
  invitedBy: text('invitedBy')
    .notNull()
    .references(() => user.id),
  role: text('role').notNull().default('admin'),
  status: text('status').notNull().default('pending'), // pending, accepted, expired
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  acceptedAt: timestamp('acceptedAt'),
});

// Products - Central repository managed by super admins
export const product = pgTable('product', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  basePrice: decimal('basePrice', { precision: 10, scale: 2 }).notNull(),
  category: text('category'),
  imageUrl: text('imageUrl').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  createdBy: text('createdBy')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Outlet Products - Junction table for which products are available at which outlets
export const outletProduct = pgTable('outletProduct', {
  id: text('id').primaryKey(),
  outletId: text('outletId')
    .notNull()
    .references(() => outlet.id, { onDelete: 'cascade' }),
  productId: text('productId')
    .notNull()
    .references(() => product.id, { onDelete: 'cascade' }),
  isAvailable: boolean('isAvailable').notNull().default(true),
  customPrice: decimal('customPrice', { precision: 10, scale: 2 }), // Optional outlet-specific price override
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Delivery Agents - Managed by outlet admins and owners
export const deliveryAgent = pgTable('deliveryAgent', {
  id: text('id').primaryKey(),
  outletId: text('outletId')
    .notNull()
    .references(() => outlet.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  isActive: boolean('isActive').notNull().default(true),
  createdBy: text('createdBy')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Orders - Customer orders from outlets
export const order = pgTable('order', {
  id: text('id').primaryKey(),
  customerId: text('customerId')
    .references(() => user.id),
  outletId: text('outletId')
    .notNull()
    .references(() => outlet.id, { onDelete: 'cascade' }),
  customerName: text('customerName').notNull(),
  customerPhone: text('customerPhone').notNull(),
  customerEmail: text('customerEmail').notNull(),
  deliveryAddress: text('deliveryAddress').notNull(),
  pincode: text('pincode').notNull(),
  totalAmount: decimal('totalAmount', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'), // pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  deliveryAgentId: text('deliveryAgentId').references(() => deliveryAgent.id),
  notes: text('notes'), // Optional customer notes
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

// Order Items - Products in each order
export const orderItem = pgTable('orderItem', {
  id: text('id').primaryKey(),
  orderId: text('orderId')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  productId: text('productId')
    .notNull()
    .references(() => product.id),
  productName: text('productName').notNull(), // Snapshot at order time
  productPrice: decimal('productPrice', { precision: 10, scale: 2 }).notNull(), // Snapshot at order time
  productImage: text('productImage'), // Snapshot at order time
  quantity: integer('quantity').notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});

// Relations
export const orderRelations = relations(order, ({ one, many }) => ({
  outlet: one(outlet, {
    fields: [order.outletId],
    references: [outlet.id],
  }),
  customer: one(user, {
    fields: [order.customerId],
    references: [user.id],
  }),
  items: many(orderItem),
  deliveryAgent: one(deliveryAgent, {
    fields: [order.deliveryAgentId],
    references: [deliveryAgent.id],
  }),
}));

export const orderItemRelations = relations(orderItem, ({ one }) => ({
  order: one(order, {
    fields: [orderItem.orderId],
    references: [order.id],
  }),
  product: one(product, {
    fields: [orderItem.productId],
    references: [product.id],
  }),
}));


