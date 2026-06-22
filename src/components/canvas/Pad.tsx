"use client";

import { Suspense } from "react";
import { PadModel } from "./PadModel";

type Props = {
  url: string;
  tintColor: string;
};

/**
 * Thin Pad shell — wraps PadModel in Suspense so a loading GLB doesn't break
 * the carousel layout. Render position/animation lives in CarouselPad in
 * Showroom.tsx, not here.
 */
export function Pad({ url, tintColor }: Props) {
  return (
    <Suspense fallback={null}>
      <PadModel url={url} tintColor={tintColor} />
    </Suspense>
  );
}
