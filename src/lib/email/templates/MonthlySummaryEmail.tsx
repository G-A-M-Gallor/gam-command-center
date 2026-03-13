import { Text, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface SummaryStats {
  label: string;
  value: string;
}

interface MonthlySummaryEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  period?: string;
  stats: SummaryStats[];
  highlights?: string[];
}

export function MonthlySummaryEmail({ name, period, stats, highlights, ...base }: MonthlySummaryEmailProps) {
  return (
    <BaseLayout preview={`סיכום חודשי${period ? ` — ${period}` : ""}`} {...base}>
      <Text style={{ fontSize: "18px", fontWeight: "bold", color: "#1e293b", margin: "0 0 16px" }}>
        שלום {name}, הנה הסיכום שלך 📊
      </Text>
      {period && (
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 20px" }}>
          תקופה: {period}
        </Text>
      )}

      {/* Stats grid */}
      <Section style={{ margin: "0 0 24px" }}>
        {stats.map((stat, i) => (
          <Section key={i} style={{
            backgroundColor: i % 2 === 0 ? "#f8fafc" : "#f1f5f9",
            padding: "12px 16px",
            borderRadius: i === 0 ? "8px 8px 0 0" : i === stats.length - 1 ? "0 0 8px 8px" : "0",
            display: "flex",
            justifyContent: "space-between",
          }}>
            <Text style={{ fontSize: "14px", color: "#64748b", margin: 0, display: "inline" }}>
              {stat.label}
            </Text>
            <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0, display: "inline", float: "left" }}>
              {stat.value}
            </Text>
          </Section>
        ))}
      </Section>

      {/* Highlights */}
      {highlights && highlights.length > 0 && (
        <>
          <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 12px" }}>
            נקודות חשובות
          </Text>
          {highlights.map((h, i) => (
            <Text key={i} style={{ fontSize: "15px", color: "#334155", margin: "0 0 8px", paddingRight: "16px" }}>
              • {h}
            </Text>
          ))}
        </>
      )}
    </BaseLayout>
  );
}
