import { Text, Button, Section } from "@react-email/components";
import { BaseLayout, type BaseLayoutProps } from "./BaseLayout";

interface MeetingReminderEmailProps extends Partial<BaseLayoutProps> {
  name: string;
  date: string;
  time: string;
  location?: string;
  link?: string;
}

export function MeetingReminderEmail({ name, date, time, location, link, ...base }: MeetingReminderEmailProps) {
  return (
    <BaseLayout preview={`תזכורת פגישה — ${date} ${time}`} {...base}>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        שלום {name},
      </Text>
      <Text style={{ fontSize: "16px", color: "#334155", margin: "0 0 16px" }}>
        תזכורת לפגישה הקרובה:
      </Text>
      <Section style={{
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        padding: "16px",
        margin: "0 0 24px",
      }}>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>📅 תאריך</Text>
        <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 12px" }}>
          {date}
        </Text>
        <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>🕐 שעה</Text>
        <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: "0 0 12px" }}>
          {time}
        </Text>
        {location && (
          <>
            <Text style={{ fontSize: "14px", color: "#64748b", margin: "0 0 4px" }}>📍 מיקום</Text>
            <Text style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b", margin: 0 }}>
              {location}
            </Text>
          </>
        )}
      </Section>
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
          פרטים נוספים
        </Button>
      )}
    </BaseLayout>
  );
}
