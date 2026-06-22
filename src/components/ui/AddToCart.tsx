"use client";

import { useState } from "react";
import { useConfigurator } from "@/lib/store/configurator";
import { SKUS } from "@/config/skus";
import { useCart } from "@/hooks/useCart";

export function AddToCart() {
  const activeSku = useConfigurator((s) => s.activeSku);
  const colorBySku = useConfigurator((s) => s.colorBySku);
  const sku = SKUS.find((s) => s.id === activeSku)!;
  const color = colorBySku[activeSku] ?? sku.defaultColor;

  const { add, status, lastCheckoutUrl } = useCart();
  const [error, setError] = useState<string | null>(null);

  const onAdd = async () => {
    setError(null);
    try {
      const cart = await add(activeSku, color);
      // In live mode this redirects to Shopify checkout; in mock mode we just log.
      if (cart.checkoutUrl && cart.checkoutUrl.startsWith("http")) {
        window.location.href = cart.checkoutUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "cart error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
      <button
        onClick={onAdd}
        disabled={status === "pending"}
        style={{
          background: "#141416",
          color: "#ededee",
          border: "none",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 12,
          letterSpacing: "0.18em",
          fontWeight: 500,
          opacity: status === "pending" ? 0.7 : 1,
          cursor: status === "pending" ? "wait" : "pointer",
        }}
      >
        <span>{status === "pending" ? "ADDING…" : "ADD"}</span>
        <span>
          {sku.currency}
          {sku.price}
        </span>
      </button>
      {lastCheckoutUrl && lastCheckoutUrl.startsWith("mock:") && (
        <div style={{ fontSize: 10, color: "#7a7a7e" }}>
          mock cart: {lastCheckoutUrl}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 10, color: "#b03030" }}>{error}</div>
      )}
    </div>
  );
}
