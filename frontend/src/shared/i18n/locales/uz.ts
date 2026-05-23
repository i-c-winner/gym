const uz = {
  header: {
    registration: "Ro'yxatdan o'tish",
    main: "Asosiy",
    programs: "Dasturlar",
    account: "Mening maydonim",
    language: "Tilni tanlash",
  },
  programs: {
    title: "Barcha dasturlar",
    subtitle: "Dasturni tanlang va bugun boshlang",
    open: "Batafsil",
    empty: "Dasturlar hali qo'shilmagan",
  },
  programDetail: {
    plansTitle: "Tarifni tanlang",
    goToMyPrograms: "Mening dasturlarim",
  },
  programBuyPage: {
    plan: "Tanlangan tarif",
    chooseMethod: "To'lov usulini tanlang",
    buyClick: "CLICK orqali sotib olish",
    buyPayme: "PayMe orqali sotib olish",
    creating: "Buyurtma yaratilyapti...",
    processing: "{{provider}} orqali to'lov ishlanmoqda...",
    processingHint: "Bu bir necha soniya oladi",
    successTitle: "To'lov muvaffaqiyatli o'tdi!",
    successDesc: "Dasturga kirish ochildi.",
    openProgram: "Dasturga o'tish",
    error: { generic: "Buyurtma yaratib bo'lmadi. Keyinroq urinib ko'ring." },
    errorModal: { title: "To'lov xatosi", close: "Yopish" },
  },
  accountMyPrograms: {
    loading: "Dasturlar yuklanmoqda...",
    noPrograms: "Sizda hozircha mavjud dasturlar yo'q.",
    title: "Mening dasturlarim",
    subtitle: "Ulangan dasturlar va har bir yo'nalish bo'yicha joriy natija",
    navigation: {
      home: "Asosiy",
      programs: "Mening dasturlarim",
      lessons: "Darslar",
      workouts: "Oflayn mashg'ulotlar",
      calendar: "Kalendar",
      favorites: "Tanlanganlar",
      settings: "Sozlamalar",
      logout: "Chiqish",
    },
    profile: {
      fallbackName: "Foydalanuvchi",
      fallbackPlan: "Asosiy reja",
    },
    labels: {
      lessons: "Darslar",
      duration: "Davomiyligi",
      progress: "Dastur natijasi",
    },
    actions: {
      open: "Ochish",
    },
    access: {
      locked: "Ruxsat yo'q",
    },
    program: {
      loading: "Dastur yuklanmoqda...",
      accessDenied: {
        title: "Bu dasturga kirish imkoni yo'q",
        description: "Dasturni ochish uchun obuna sotib oling",
        back: "Dasturlarga qaytish",
      },
      notFound: {
        title: "Dastur topilmadi",
        description: "Bunday dastur mavjud emas",
      },
    },
    programs: {
      flexibility: {
        status: "Faol",
        title: "Tana moslashuvchanligi",
        description: "Yengil cho'zilish, bo'g'im harakatchanligi va yuklamadan keyin tiklanish.",
        lessons: "12 dars",
        duration: "4 hafta",
      },
      strength: {
        status: "Ulangan",
        title: "Kuch va chidamlilik",
        description: "Tana markazi, oyoqlar va barqaror temp uchun mashg'ulotlar majmuasi.",
        lessons: "10 dars",
        duration: "3 hafta",
      },
      split: {
        status: "Ulangan",
        title: "30 kunda shpagat",
        description: "Xavfsiz chuqur cho'zilish va texnika nazorati uchun bosqichma-bosqich dastur.",
        lessons: "15 dars",
        duration: "30 kun",
      },
      rhythmic: {
        status: "Faol",
        title: "Badiiy gimnastika",
        description: "Nafislik, muvozanat, koordinatsiya va ishonchli harakat uchun asosiy elementlar.",
        lessons: "11 dars",
        duration: "5 hafta",
      },
    },
  },
  calendarPage: {
    title: "Mening kalendarim",
    subtitle: "Oflayn mashg'ulotlarga qatnashish tarixi",
    noEvents: "Bu davr uchun mashg'ulotlar yo'q",
    legend: {
      attended: "Qatnashdi",
      missed: "O'tkazib yubordi",
      unmarked: "Murabbiy hali belgilamadi",
      upcoming: "Kelasi mashg'ulot",
    },
  },
  programBuy: {
    subtitle: "Dasturga kirish uchun tarifni tanlang",
    loading: "Tariflar yuklanmoqda...",
    buy: "Sotib olish",
    buying: "Rasmiylashtirilmoqda...",
    ordered: "Buyurtma berildi",
    successTitle: "Buyurtma rasmiylashtirildi",
    successDescription: "To'lov tasdiglanganidan keyin kirish avtomatik ravishda ochiladi.",
    backToPrograms: "Dasturlarga qaytish",
    error: {
      generic: "Buyurtma yaratib bo'lmadi. Keyinroq urinib ko'ring.",
    },
    plans: {
      "1m": { title: "1 oy", description: "30 kunlik kirish" },
      "3m": { title: "3 oy", description: "90 kunlik kirish" },
      "6m": { title: "6 oy", description: "180 kunlik kirish" },
      lifetime: { title: "Abadiy", description: "Muddatsiz kirish" },
    },
  },
} as const;

export { uz };
