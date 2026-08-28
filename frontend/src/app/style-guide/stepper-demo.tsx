"use client";

import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useState } from "react";

export function StepperDemo() {
  const [v, setV] = useState(1);
  return <QuantityStepper value={v} onChange={setV} max={9} />;
}
