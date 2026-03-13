import { Text, Button } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface WelcomeEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  company?: string;
  loginUrl?: string;
}

export function WelcomeEmail({ name, company = "vBrain.io", loginUrl = "", ...base }: WelcomeEmailProps) {
  return (
    <BaseLayout preview={`ברוך הבא ל-${company}`} {...base}>
      <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 16px" }}>
        שלום {name}, ברוך הבא! 👋
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        החשבון שלך ב-{company} נוצר בהצלחה. אתה מוכן להתחיל.
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 24px" }}>
        כדי להתחיל, היכנס לדשבורד:
      </Text>
      {loginUrl && (
        <Button
          href={loginUrl}
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
          כניסה לדשבורד
        </Button>
      )}
    </BaseLayout>
  );
}
