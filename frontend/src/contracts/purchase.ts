/**
 * ClickLess AI – Purchase Contract
 */
import { z } from 'zod';
import { NormalizedProductSchema } from './product';

export const DeliveryInfoSchema = z.object({
    address: z.string(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
    estimate_days: z.number().optional(),
    estimate_label: z.string().optional(),
});
export type DeliveryInfo = z.infer<typeof DeliveryInfoSchema>;

export const PaymentInfoSchema = z.object({
    method_type: z.string(), // e.g. "Visa", "Mastercard", "PayPal"
    last_four: z.string().length(4).optional(),
    billing_name: z.string().optional(),
});
export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;

export const PurchaseConfirmationSchema = z.object({
    confirmation_id: z.string(),
    status: z.enum(['pending', 'confirmed', 'cancelled', 'expired']),
    created_at: z.string(),
    expires_at: z.string().optional(),
    product: NormalizedProductSchema,
    delivery: DeliveryInfoSchema,
    payment: PaymentInfoSchema,
    user_confirmed: z.boolean().optional(),
    confirmed_at: z.string().optional(),
    order_id: z.string().optional(),
    confirmation_screenshot: z.string().optional(),
    return_summary: z.string().optional(),
    total_price: z.number().optional(),
});
export type PurchaseConfirmation = z.infer<typeof PurchaseConfirmationSchema>;

export const OrderRecordSchema = z.object({
    order_id: z.string(),
    confirmation_id: z.string().optional(),
    product_name: z.string(),
    source: z.enum(['amazon', 'walmart', 'other']),
    price: z.number(),
    currency: z.string().default('USD'),
    status: z.enum(['placed', 'shipped', 'delivered', 'cancelled', 'failed']),
    placed_at: z.string(),
    delivered_at: z.string().optional(),
    image_url: z.string().optional(),
});
export type OrderRecord = z.infer<typeof OrderRecordSchema>;
