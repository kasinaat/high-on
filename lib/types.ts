import { outlet, outletAdmin, invitation, product, outletProduct, deliveryAgent } from "@/db/schema";

// Infer types from schema
export type Outlet = typeof outlet.$inferSelect & {
  isOwner?: boolean; // Whether the current user owns this outlet
};
export type NewOutlet = typeof outlet.$inferInsert;

export type OutletAdmin = typeof outletAdmin.$inferSelect;
export type NewOutletAdmin = typeof outletAdmin.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;

export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;

export type OutletProduct = typeof outletProduct.$inferSelect;
export type NewOutletProduct = typeof outletProduct.$inferInsert;

export type DeliveryAgent = typeof deliveryAgent.$inferSelect;
export type NewDeliveryAgent = typeof deliveryAgent.$inferInsert;

// Extended types with relations
export type OutletWithAdmins = Outlet & {
  admins: Array<OutletAdmin & { user: { id: string; name: string; email: string; image: string | null } }>;
};

export type InvitationWithDetails = Invitation & {
  outlet: { id: string; name: string };
  inviter: { id: string; name: string; email: string };
};

// API Response types
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Form types
export type CreateOutletInput = {
  name: string;
  address: string;
  pincode: string;
  phone?: string;
  adminEmail?: string;
  latitude?: string;
  longitude?: string;
  deliveryRadius?: string;
};

export type UpdateOutletInput = {
  name?: string;
  address?: string;
  pincode?: string;
  phone?: string;
  latitude?: string;
  longitude?: string;
  deliveryRadius?: string;
};

export type InviteAdminInput = {
  email: string;
  outletId: string;
  role?: string;
};

export type CreateProductInput = {
  name: string;
  description?: string;
  basePrice: string;
  category?: string;
  imageUrl?: string;
};

export type UpdateProductInput = {
  name?: string;
  description?: string;
  basePrice?: string;
  category?: string;
  imageUrl?: string;
  isActive?: boolean;
};

export type CreateDeliveryAgentInput = {
  name: string;
  phone: string;
  email?: string;
};

export type UpdateDeliveryAgentInput = {
  name?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};
