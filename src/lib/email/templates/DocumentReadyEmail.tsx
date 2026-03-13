import { Text, Button, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface DocumentReadyEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  docName: string;
  downloadUrl: string;
  expiresAt?: string;
}

export function DocumentReadyEmail({ name, docName, downloadUrl, expiresAt, ...base }: DocumentReadyEmailProps) {
  return (
    <BaseLayout preview={`מסמך מוכן: ${docName}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        מסמך חדש מוכן עבורך:
      </Text>
      <Section style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 24px",
        textAlign: "center",
      }}>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>📄</Text>
        <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
          {docName}
        </Text>
      </Section>
      <Button
        href={downloadUrl}
        style={{
          backgroundColor: base.brandColor || "#7c3aed",
          color: "#ffffff",
          fontSize: "16px",
          fontWeight: "bold",
          padding: "12px 32px",
          borderRadius: "6px",
          textDecoration: "none",
          display: "inline-block",
        }}
      >
        הורדת המסמך
      </Button>
      {expiresAt && (
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "16px 0 0" }}>
          הקישור תקף עד {expiresAt}
        </Text>
      )}
    </BaseLayout>
  );
}
