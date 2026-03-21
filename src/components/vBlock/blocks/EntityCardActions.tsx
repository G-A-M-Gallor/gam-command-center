"use client";

import type { FieldActionType } from "./entityCard.types";

export function executeFieldAction(
  type: FieldActionType,
  value: string,
  entityId?: string,
  routerPush?: (url: string) => void,
  showToast?: (msg: string) => void,
) {
  switch (type) {
    case "call":
      window.open(`tel:${value}`, "_self");
      break;
    case "whatsapp":
      window.open(
        `https://wa.me/${value.replace(/\D/g, "")}`,
        "_blank",
      );
      break;
    case "email":
      window.open(`mailto:${value}`, "_self");
      break;
    case "navigate":
      if (entityId && routerPush) {
        routerPush(`/dashboard/entities/${entityId}`);
      }
      break;
    case "copy":
      navigator.clipboard.writeText(value).then(() => {
        showToast?.("הועתק ללוח");
      });
      break;
  }
}
