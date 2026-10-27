"use client";

import { use } from "react";
import { LandingForm } from "@/components/admin/LandingForm";

export default function EditLandingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <LandingForm id={id} />;
}
