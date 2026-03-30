const workspaceSwitcher = {
  // Section labels
  sections: {
    personal: "Personal",
    business: "Business",
    groups: "Groups",
    platform: "Platform"
  },

  // Workspaces
  workspaces: {
    personal: {
      name: "vBrain — Personal",
      desc: "Basic tools, profile, settings"
    },
    gamBusiness: {
      name: "G.A.M Construction",
      desc: "Business page — 12 members"
    },
    gallor: {
      name: "Gallor Ventures",
      desc: "Business page — 3 members"
    },
    groups: {
      name: "vBrain Groups",
      desc: "Collaborative workspaces"
    },
    vbrainOffice: {
      name: "vBrain Office",
      desc: "Back-office — platform management"
    },
    commandCenter: {
      name: "Command Center",
      desc: "Full system control"
    },
    gamTools: {
      name: "Gallor GAM Tools",
      desc: "GAM internal tools"
    },
    gamSite: {
      name: "GAM.co.il",
      desc: "GAM website management"
    }
  },

  // Badges
  badges: {
    owner: "Owner",
    admin: "Admin",
    soon: "Soon"
  }
} as const;

export default workspaceSwitcher;