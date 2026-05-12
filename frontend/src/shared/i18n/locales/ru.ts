const ru = {
  header: {
    registration: "Регистрация",
    main: "Главная",
    account: "Кабинет",
    language: "Выбрать язык",
  },
  accountMyPrograms: {
    loading: "Загружаем программы...",
    title: "Мои программы",
    subtitle: "Подключенные программы и текущий прогресс по каждому направлению",
    navigation: {
      home: "Главная",
      programs: "Программы",
      lessons: "Уроки",
      workouts: "Тренировки",
      calendar: "Календарь",
      favorites: "Избранное",
      settings: "Настройки",
      logout: "Выйти",
    },
    profile: {
      fallbackName: "Пользователь",
      fallbackPlan: "Базовый план",
    },
    labels: {
      lessons: "Уроки",
      duration: "Длительность",
      progress: "Прогресс программы",
    },
    actions: {
      open: "Открыть",
    },
    access: {
      locked: "Нет доступа",
    },
    programs: {
      flexibility: {
        status: "Активна",
        title: "Гибкость тела",
        description: "Мягкая растяжка, мобильность суставов и восстановление после нагрузок.",
        lessons: "12 уроков",
        duration: "4 недели",
      },
      strength: {
        status: "Подключена",
        title: "Сила и выносливость",
        description: "Комплекс тренировок для устойчивости корпуса, ног и ровного темпа.",
        lessons: "10 уроков",
        duration: "3 недели",
      },
      split: {
        status: "Подключена",
        title: "Шпагат за 30 дней",
        description: "Пошаговая программа для безопасной глубокой растяжки и контроля техники.",
        lessons: "15 уроков",
        duration: "30 дней",
      },
      rhythmic: {
        status: "Активна",
        title: "Художественная гимнастика",
        description: "Грация, баланс, координация и базовые элементы для уверенного движения.",
        lessons: "11 уроков",
        duration: "5 недель",
      },
    },
  },
} as const;

export { ru };
