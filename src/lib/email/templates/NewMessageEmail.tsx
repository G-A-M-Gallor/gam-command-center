import { Text, Button, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface NewMessageEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  senderName: string;
  preview: string;
  replyUrl?: string;
}

export function NewMessageEmail({ name, senderName, preview: msgPreview, replyUrl, ...base }: NewMessageEmailProps) {
  return (
    <BaseLayout preview={`הודעה חדשה מ-${senderName}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        קיבלת הודעה חדשה מ-<strong>{senderName}</strong>:
      </Text>
      <Section style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 24px",
        borderRight: `4px solid ${base.brandColor || "#7c3aed"}`,
      }}>
        <Text style={{ fontSize: "15px", color: "#334155", fontStyle: "italic", margin: 0 }}>
          &ldquo;{msgPreview}&rdquo;
        </Text>
      </Section>
      {replyUrl && (
        <Button
          href={replyUrl}
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
          צפייה והשבה
        </Button>
      )}
    </BaseLayout>
  );
}
