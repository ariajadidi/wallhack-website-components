import type { Cart } from "./types";

/**
 * Shopify Storefront API client + mock fallback.
 *
 * In production set:
 *   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=wallhack.myshopify.com
 *   NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=shpat_xxx
 *
 * Without those env vars, the mock client below simulates a successful cart
 * mutation so the full configurator flow is testable end-to-end before the
 * Shopify side is wired up.
 */
const STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = "2025-01";

export const isShopifyConfigured = Boolean(STORE_DOMAIN && STOREFRONT_TOKEN);

type GraphQLResult<T> = { data?: T; errors?: { message: string }[] };

async function storefront<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  if (!isShopifyConfigured) {
    throw new Error("Shopify is not configured — set NEXT_PUBLIC_SHOPIFY_* env vars.");
  }
  const res = await fetch(
    `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN!,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json: GraphQLResult<T> = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  if (!json.data) throw new Error("Shopify returned empty data");
  return json.data;
}

const CART_CREATE = /* GraphQL */ `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD = /* GraphQL */ `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl totalQuantity }
      userErrors { field message }
    }
  }
`;

export async function createCart(
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  if (!isShopifyConfigured) return mockCreateCart(variantId, quantity);
  const data = await storefront<{
    cartCreate: { cart: Cart; userErrors: { field: string; message: string }[] };
  }>(CART_CREATE, {
    input: { lines: [{ merchandiseId: variantId, quantity }] },
  });
  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors[0].message);
  }
  return data.cartCreate.cart;
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity = 1,
): Promise<Cart> {
  if (!isShopifyConfigured) return mockAddToCart(cartId, variantId, quantity);
  const data = await storefront<{
    cartLinesAdd: { cart: Cart; userErrors: { field: string; message: string }[] };
  }>(CART_LINES_ADD, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });
  if (data.cartLinesAdd.userErrors.length) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }
  return data.cartLinesAdd.cart;
}

// ---- Mock implementation (used until Shopify env vars are set) ----

let mockCartCounter = 0;
function mockCreateCart(variantId: string, quantity: number): Cart {
  const id = `mock:cart-${++mockCartCounter}`;
  console.info(`[mock-shopify] cartCreate variant=${variantId} qty=${quantity} → ${id}`);
  return { id, checkoutUrl: `mock:checkout-${mockCartCounter}`, totalQuantity: quantity };
}

function mockAddToCart(cartId: string, variantId: string, quantity: number): Cart {
  console.info(`[mock-shopify] cartLinesAdd cart=${cartId} variant=${variantId} qty=${quantity}`);
  return {
    id: cartId,
    checkoutUrl: cartId.replace("cart-", "checkout-"),
    totalQuantity: quantity,
  };
}
