import { Text, Button } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface ResetPasswordEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  resetUrl: string;
}

export function ResetPasswordEmail({ name, resetUrl, ...base }: ResetPasswordEmailProps) {
  return (
    <BaseLayout preview="איפוס סיסמה" {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 24px" }}>
        קיבלנו בקשה לאיפוס הסיסמה שלך. לחץ על הכפתור למטה כדי לבחור סיסמה חדשה:
      </Text>
      <Button
        href={resetUrl}
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
        איפוס סיסמה
      </Button>
      <Text style={{ fontSize: "14px", color: "#64748b", margin: "24px 0 0" }}>
        אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו. הקישור תקף ל-60 דקות.
      </Text>
    </BaseLayout>
  );
}
