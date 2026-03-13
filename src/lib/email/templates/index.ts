// Email template registry — maps template names to React components
import { createElement, type ReactElement } from "react";
import type { BaseLayoutProps } from "./BaseLayout";
import { OtpEmail } from "./OtpEmail";
import { WelcomeEmail } from "./WelcomeEmail";
import { ResetPasswordEmail } from "./ResetPasswordEmail";
import { CaseUpdateEmail } from "./CaseUpdateEmail";
import { DocumentReadyEmail } from "./DocumentReadyEmail";
import { MeetingReminderEmail } from "./MeetingReminderEmail";
import { InvoiceEmail } from "./InvoiceEmail";
import { NewMessageEmail } from "./NewMessageEmail";
import { MonthlySummaryEmail } from "./MonthlySummaryEmail";

export { BaseLayout } from "./BaseLayout";
export { OtpEmail, WelcomeEmail, ResetPasswordEmail, CaseUpdateEmail };
export { DocumentReadyEmail, MeetingReminderEmail, InvoiceEmail };
export { NewMessageEmail, MonthlySummaryEmail };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TemplateComponent = (props: any) => ReactElement;

const TEMPLATES: Record<string, TemplateComponent> = {
  otp: OtpEmail as TemplateComponent,
  welcome: WelcomeEmail as TemplateComponent,
  "reset-password": ResetPasswordEmail as TemplateComponent,
  "case-update": CaseUpdateEmail as TemplateComponent,
  "document-ready": DocumentReadyEmail as TemplateComponent,
  "meeting-reminder": MeetingReminderEmail as TemplateComponent,
  invoice: InvoiceEmail as TemplateComponent,
  "new-message": NewMessageEmail as TemplateComponent,
  "monthly-summary": MonthlySummaryEmail as TemplateComponent,
};

/**
 * Create a React element for a named template with given props.
 * Returns null if template name is not found.
 */
export function getTemplateElement(
  name: string,
  props: Record<string, unknown> & Partial<BaseLayoutProps>,
): ReactElement | null {
  const Component = TEMPLATES[name];
  if (!Component) return null;
  return createElement(Component, props);
}

export const TEMPLATE_NAMES = Object.keys(TEMPLATES);
