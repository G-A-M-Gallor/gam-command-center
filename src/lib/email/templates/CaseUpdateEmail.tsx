import { Text, Button, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface CaseUpdateEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  caseNumber: string;
  status: string;
  details?: string;
  link?: string;
}

export function CaseUpdateEmail({ name, caseNumber, status, details, link, ...base }: CaseUpdateEmailProps) {
  return (
    <BaseLayout preview={`תיק ${caseNumber} — ${status}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        עדכון לגבי התיק שלך:
      </Text>
      <Section style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 16px",
        borderRight: `4px solid ${base.brandColor || "#7c3aed"}`,
      }}>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>
          מספר תיק
        </Text>
        <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 12px" }}>
          {caseNumber}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>
          סטטוס חדש
        </Text>
        <Text style={{ fontSize: "16px", fontWeight: "bold", color: base.brandColor || "#7c3aed", margin: 0 }}>
          {status}
        </Text>
      </Section>
      {details && (
        <Text style={{ fontSize: "15px", color: "#475569", margin: "0 0 24px" }}>
          {details}
        </Text>
      )}
      {link && (
        <Button
          href={link}
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
          צפייה בתיק
        </Button>
      )}
    </BaseLayout>
  );
}
