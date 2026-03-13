import { Text, Button, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface InvoiceEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  payUrl?: string;
}

export function InvoiceEmail({ name, invoiceNumber, amount, dueDate, payUrl, ...base }: InvoiceEmailProps) {
  return (
    <BaseLayout preview={`חשבונית ${invoiceNumber} — ₪${amount}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        חשבונית חדשה הופקה עבורך:
      </Text>
      <Section style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 24px",
      }}>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>מספר חשבונית</Text>
        <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 12px" }}>
          {invoiceNumber}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>סכום לתשלום</Text>
        <Text style={{ fontSize: "24px", fontWeight: "bold", color: base.brandColor || "#7c3aed", margin: "0 0 12px" }}>
          ₪{amount}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>תאריך פירעון</Text>
        <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          {dueDate}
        </Text>
      </Section>
      {payUrl && (
        <Button
          href={payUrl}
          style={{
            backgroundColor: "#10b981",
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "bold",
            padding: "12px 32px",
            borderRadius: "6px",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          תשלום מאובטח
        </Button>
      )}
    </BaseLayout>
  );
}
