import { Text, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface OtpEmailProps extends Partial<BaseLayoutProps> {
  code: string;
  expiresIn?: string;
}

export function OtpEmail({ code, expiresIn = "10 דקות", ...base }: OtpEmailProps) {
  return (
    <BaseLayout preview={`קוד האימות שלך: ${code}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום,
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 24px" }}>
        קוד האימות שלך:
      </Text>
      <Section style={{ textAlign: "center", padding: "16px 0" }}>
        <Text style={{
          fontSize: "36px",
          fontWeight: "bold",
          letterSpacing: "8px",
          color: "#1e293b",
          backgroundColor: "#f1f5f9",
          borderRadius: "8px",
          padding: "16px 32px",
          display: "inline-block",
          margin: 0,
        }}>
          {code}
        </Text>
      </Section>
      <Text style={{ fontSize: "14px", color: "#64748b", margin: "24px 0 0" }}>
        הקוד תקף ל-{expiresIn}. אם לא ביקשת קוד זה, התעלם מהודעה זו.
      </Text>
    </BaseLayout>
  );
}
