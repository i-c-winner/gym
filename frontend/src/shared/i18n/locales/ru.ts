const ru = {
  header: {
    registration: "Регистрация",
    main: "Главная",
    programs: "Программы",
    account: "Моё пространство",
    language: "Выбрать язык",
  },
  programs: {
    title: "Все программы",
    subtitle: "Выберите программу и начните тренироваться уже сегодня",
    open: "Подробнее",
    empty: "Программы пока не добавлены",
  },
  programDetail: {
    plansTitle: "Выберите тариф",
    goToMyPrograms: "Мои программы",
  },
  programBuyPage: {
    plan: "Выбранный тариф",
    chooseMethod: "Выберите способ оплаты",
    buyClick: "Купить с помощью CLICK",
    buyPayme: "Купить с помощью PayMe",
    creating: "Создаём заказ...",
    processing: "Обрабатываем платёж через {{provider}}...",
    processingHint: "Это займёт несколько секунд",
    successTitle: "Оплата прошла успешно!",
    successDesc: "Доступ к программе открыт. Можно приступать.",
    openProgram: "Перейти к программе",
    error: { generic: "Не удалось создать заказ. Попробуйте позже." },
    errorModal: { title: "Ошибка оплаты", close: "Закрыть" },
  },
  accountMyPrograms: {
    loading: "Загружаем программы...",
    noPrograms: "У вас пока нет доступных программ.",
    title: "Мои программы",
    subtitle: "Подключенные программы и текущий прогресс по каждому направлению",
    navigation: {
      home: "Главная",
      programs: "Мои программы",
      lessons: "Уроки",
      workouts: "Offline занятия",
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
    program: {
      loading: "Загружаем программу...",
      accessDenied: {
        title: "Нет доступа к этой программе",
        description: "Приобретите подписку, чтобы открыть программу",
        back: "Вернуться к программам",
      },
      notFound: {
        title: "Программа не найдена",
        description: "Такой программы не существует",
      },
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
  calendarPage: {
    title: "Мой календарь",
    subtitle: "История посещений offline-занятий",
    noEvents: "Нет занятий на этот период",
    legend: {
      attended: "Посетил",
      missed: "Пропустил",
      unmarked: "Тренер ещё не отметил",
      upcoming: "Предстоящее занятие",
    },
  },
  programBuy: {
    subtitle: "Выберите тариф для доступа к программе",
    loading: "Загружаем тарифы...",
    buy: "Купить",
    buying: "Оформляем...",
    ordered: "Заказ создан",
    successTitle: "Заказ оформлен",
    successDescription: "Ожидайте подтверждения оплаты. После её поступления доступ откроется автоматически.",
    backToPrograms: "Вернуться к программам",
    error: {
      generic: "Не удалось создать заказ. Попробуйте позже.",
    },
    plans: {
      "1m": { title: "1 месяц", description: "Доступ на 30 дней" },
      "3m": { title: "3 месяца", description: "Доступ на 90 дней" },
      "6m": { title: "6 месяцев", description: "Доступ на 180 дней" },
      lifetime: { title: "Навсегда", description: "Бессрочный доступ" },
    },
  },
} as const;

export { ru };
