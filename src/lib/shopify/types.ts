export type CartLine = {
  variantId: string;
  quantity: number;
};

export type Cart = {
  id: string;
  /** Real Shopify URL or `mock:<id>` when running without credentials. */
  checkoutUrl: string;
  totalQuantity: number;
};
