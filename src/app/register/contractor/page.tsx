"use client";

import { Suspense } from "react";
import ContractorWizard from "@/components/registration/ContractorWizard";

export default function ContractorRegistrationPage() {
  return (
    <Suspense>
      <ContractorWizard />
    </Suspense>
  );
}
