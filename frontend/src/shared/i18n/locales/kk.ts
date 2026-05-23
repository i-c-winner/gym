const kk = {
  header: {
    registration: "Тіркелу",
    main: "Басты бет",
    programs: "Бағдарламалар",
    account: "Менің кеңістігім",
    language: "Тілді таңдау",
  },
  programs: {
    title: "Барлық бағдарламалар",
    subtitle: "Бағдарламаны таңдап, бүгін бастаңыз",
    open: "Толығырақ",
    empty: "Бағдарламалар әлі қосылмаған",
  },
  programDetail: {
    plansTitle: "Тариф таңдаңыз",
    goToMyPrograms: "Менің бағдарламаларым",
  },
  programBuyPage: {
    plan: "Таңдалған тариф",
    chooseMethod: "Төлем әдісін таңдаңыз",
    buyClick: "CLICK арқылы сатып алу",
    buyPayme: "PayMe арқылы сатып алу",
    creating: "Тапсырыс жасалуда...",
    processing: "{{provider}} арқылы төлем өңделуде...",
    processingHint: "Бұл бірнеше секунд алады",
    successTitle: "Төлем сәтті өтті!",
    successDesc: "Бағдарламаға қол жетімділік ашылды.",
    openProgram: "Бағдарламаға өту",
    error: { generic: "Тапсырыс жасалмады. Кейінірек қайталаңыз." },
    errorModal: { title: "Төлем қатесі", close: "Жабу" },
  },
  accountMyPrograms: {
    loading: "Бағдарламалар жүктелуде...",
    noPrograms: "Сізде әзірше қол жетімді бағдарламалар жоқ.",
    title: "Менің бағдарламаларым",
    subtitle: "Қосылған бағдарламалар және әр бағыт бойынша ағымдағы прогресс",
    navigation: {
      home: "Басты бет",
      programs: "Менің бағдарламаларым",
      lessons: "Сабақтар",
      workouts: "Офлайн сабақтар",
      calendar: "Күнтізбе",
      favorites: "Таңдаулылар",
      settings: "Баптаулар",
      logout: "Шығу",
    },
    profile: {
      fallbackName: "Пайдаланушы",
      fallbackPlan: "Негізгі жоспар",
    },
    labels: {
      lessons: "Сабақтар",
      duration: "Ұзақтығы",
      progress: "Бағдарлама прогресі",
    },
    actions: {
      open: "Ашу",
    },
    access: {
      locked: "Қолжетім жоқ",
    },
    program: {
      loading: "Бағдарлама жүктелуде...",
      accessDenied: {
        title: "Бұл бағдарламаға қолжетімділік жоқ",
        description: "Бағдарламаны ашу үшін жазылымды сатып алыңыз",
        back: "Бағдарламаларға оралу",
      },
      notFound: {
        title: "Бағдарлама табылмады",
        description: "Мұндай бағдарлама жоқ",
      },
    },
    programs: {
      flexibility: {
        status: "Белсенді",
        title: "Дене икемділігі",
        description: "Жеңіл созылу, буын қозғалғыштығы және жүктемеден кейін қалпына келу.",
        lessons: "12 сабақ",
        duration: "4 апта",
      },
      strength: {
        status: "Қосылған",
        title: "Күш пен төзімділік",
        description: "Дене орталығы, аяқ және тұрақты қарқынға арналған жаттығулар кешені.",
        lessons: "10 сабақ",
        duration: "3 апта",
      },
      split: {
        status: "Қосылған",
        title: "30 күнде шпагат",
        description: "Қауіпсіз терең созылу және техниканы бақылауға арналған кезеңдік бағдарлама.",
        lessons: "15 сабақ",
        duration: "30 күн",
      },
      rhythmic: {
        status: "Белсенді",
        title: "Көркем гимнастика",
        description: "Сымбат, тепе-теңдік, үйлестіру және сенімді қозғалысқа арналған базалық элементтер.",
        lessons: "11 сабақ",
        duration: "5 апта",
      },
    },
  },
  calendarPage: {
    title: "Менің күнтізбем",
    subtitle: "Офлайн сабақтарға қатысу тарихы",
    noEvents: "Бұл кезеңде сабақтар жоқ",
    legend: {
      attended: "Қатысты",
      missed: "Жіберіп алды",
      unmarked: "Жаттықтырушы әлі белгілемеді",
      upcoming: "Алдағы сабақ",
    },
  },
  programBuy: {
    subtitle: "Бағдарламаға қол жеткізу үшін тариф таңдаңыз",
    loading: "Тарифтер жүктелуде...",
    buy: "Сатып алу",
    buying: "Рәсімделуде...",
    ordered: "Тапсырыс берілді",
    successTitle: "Тапсырыс берілді",
    successDescription: "Төлем расталғаннан кейін қол жетімділік автоматты түрде ашылады.",
    backToPrograms: "Бағдарламаларға оралу",
    error: {
      generic: "Тапсырыс жасалмады. Кейінірек қайталаңыз.",
    },
    plans: {
      "1m": { title: "1 ай", description: "30 күндік қол жетімділік" },
      "3m": { title: "3 ай", description: "90 күндік қол жетімділік" },
      "6m": { title: "6 ай", description: "180 күндік қол жетімділік" },
      lifetime: { title: "Мәңгілік", description: "Мерзімсіз қол жетімділік" },
    },
  },
} as const;

export { kk };
