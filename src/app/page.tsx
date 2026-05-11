import { Suspense } from "react";

import { HomePage } from "@/components/HomePage";

export default function Home() {
  return (
    <Suspense fallback={<div className="p-6">Laddar tävlingssök...</div>}>
      <HomePage />
    </Suspense>
  );
}
