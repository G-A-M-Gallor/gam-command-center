const workspaceSwitcher = {
  // Section labels
  sections: {
    personal: "אישי",
    business: "עסקי",
    groups: "קבוצות",
    platform: "ניהול פלטפורמה"
  },

  // Workspaces
  workspaces: {
    personal: {
      name: "vBrain — פרופיל אישי",
      desc: "כלים בסיסיים, פרופיל, הגדרות"
    },
    gamBusiness: {
      name: "G.A.M שירותי בניין",
      desc: "דף עסקי — 12 חברי צוות"
    },
    gallor: {
      name: "גלאור יזמות",
      desc: "דף עסקי — 3 חברי צוות"
    },
    groups: {
      name: "קבוצות vBrain",
      desc: "מרחבי עבודה שיתופיים"
    },
    vbrainOffice: {
      name: "vBrain Office",
      desc: "בק-אופיס — ניהול הפלטפורמה"
    },
    commandCenter: {
      name: "Command Center",
      desc: "ניהול מערכת מלא"
    },
    gamTools: {
      name: "Gallor GAM כלים",
      desc: "כלים פנימיים של GAM"
    },
    gamSite: {
      name: "GAM.co.il",
      desc: "ניהול אתר GAM"
    }
  },

  // Badges
  badges: {
    owner: "בעלים",
    admin: "אדמין",
    soon: "בקרוב"
  }
} as const;

export default workspaceSwitcher;