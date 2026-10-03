'use client';

import { UnifiedCheckout, ActivePaymentGateway, DEFAULT_GATEWAYS, getGatewayStyle } from '@/components/checkout/UnifiedCheckout';

export type { ActivePaymentGateway };
export { DEFAULT_GATEWAYS, getGatewayStyle };

export default function CheckoutPage() {
  return <UnifiedCheckout mode="cart" />;
}
