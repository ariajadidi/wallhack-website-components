"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { TopBar } from "@/components/ui/TopBar";
import { ProductPanel } from "@/components/ui/ProductPanel";
import { Loader } from "@/components/ui/Loader";
import { UrlSync } from "@/components/UrlSync";
import { GestureLayer } from "@/components/GestureLayer";

const Studio = dynamic(() => import("@/components/Studio"), { ssr: false });

export default function Page() {
  return (
    <main style={{ position: "fixed", inset: 0, background: "#ebebed" }}>
      <Studio />
      <GestureLayer />
      <TopBar />
      <ProductPanel />
      <Loader />
      <Suspense fallback={null}>
        <UrlSync />
      </Suspense>
    </main>
  );
}
