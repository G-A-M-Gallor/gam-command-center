// Base Layout — wraps all email templates with logo, brand color, signature, RTL
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export interface BaseLayoutProps {
  preview?: string;
  logoUrl?: string | null;
  brandColor?: string;
  signatureHtml?: string | null;
  unsubscribeUrl?: string | null;
  direction?: "rtl" | "ltr";
  children: ReactNode;
}

export function BaseLayout({
  preview,
  logoUrl,
  brandColor = "#7c3aed",
  signatureHtml,
  unsubscribeUrl,
  direction = "rtl",
  children,
}: BaseLayoutProps) {
  return (
    <Html lang={direction === "rtl" ? "he" : "en"} dir={direction}>
      <Head />
      {preview && <Preview>{preview}</Preview>}
      <Body style={{ backgroundColor: "#f8fafc", fontFamily: "Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
          {/* Logo Header */}
          <Section style={{ textAlign: "center", padding: "20px 0 10px" }}>
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt="Logo"
                width={160}
                height={48}
                style={{ margin: "0 auto" }}
              />
            ) : (
              <Text style={{ fontSize: "24px", fontWeight: "bold", color: brandColor, margin: 0 }}>
                vBrain.io
              </Text>
            )}
          </Section>

          {/* Brand color bar */}
          <Hr style={{ borderColor: brandColor, borderWidth: "2px", margin: "0 0 20px" }} />

          {/* Content */}
          <Section style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "32px 24px",
            direction,
          }}>
            {children}
          </Section>

          {/* Signature */}
          {signatureHtml && (
            <Section style={{ padding: "20px 0 0", direction }}>
              <Hr style={{ borderColor: "#e2e8f0", margin: "0 0 16px" }} />
              <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
            </Section>
          )}

          {/* Footer */}
          <Section style={{ textAlign: "center", padding: "20px 0" }}>
            <Text style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
              {direction === "rtl"
                ? "הודעה זו נשלחה באמצעות vBrain.io"
                : "This email was sent via vBrain.io"}
            </Text>
            {unsubscribeUrl && (
              <Text style={{ fontSize: "12px", margin: "4px 0 0" }}>
                <a href={unsubscribeUrl} style={{ color: "#94a3b8", textDecoration: "underline" }}>
                  {direction === "rtl" ? "הסרה מרשימת תפוצה" : "Unsubscribe"}
                </a>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
