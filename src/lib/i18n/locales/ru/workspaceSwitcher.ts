const workspaceSwitcher = {
  // Section labels
  sections: {
    personal: "Личное",
    business: "Бизнес",
    groups: "Группы",
    platform: "Платформа"
  },

  // Workspaces
  workspaces: {
    personal: {
      name: "vBrain — Личный",
      desc: "Основные инструменты, профиль, настройки"
    },
    gamBusiness: {
      name: "G.A.M Construction",
      desc: "Бизнес-страница — 12 участников"
    },
    gallor: {
      name: "Gallor Ventures",
      desc: "Бизнес-страница — 3 участника"
    },
    groups: {
      name: "Группы vBrain",
      desc: "Совместные рабочие пространства"
    },
    vbrainOffice: {
      name: "vBrain Office",
      desc: "Бэк-офис — управление платформой"
    },
    commandCenter: {
      name: "Command Center",
      desc: "Полный контроль системы"
    },
    gamTools: {
      name: "Инструменты Gallor GAM",
      desc: "Внутренние инструменты GAM"
    },
    gamSite: {
      name: "GAM.co.il",
      desc: "Управление сайтом GAM"
    }
  },

  // Badges
  badges: {
    owner: "Владелец",
    admin: "Администратор",
    soon: "Скоро"
  }
} as const;

export default workspaceSwitcher;