const uz = {
  header: {
    registration: "Ro'yxatdan o'tish",
    main: "Asosiy",
    account: "Kabinet",
    language: "Tilni tanlash",
  },
  accountMyPrograms: {
    loading: "Dasturlar yuklanmoqda...",
    title: "Mening dasturlarim",
    subtitle: "Ulangan dasturlar va har bir yo'nalish bo'yicha joriy natija",
    navigation: {
      home: "Asosiy",
      programs: "Dasturlar",
      lessons: "Darslar",
      workouts: "Mashg'ulotlar",
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
      noAccess: "Ruxsat yo'q",
    },
    access: {
      locked: "Ruxsat yo'q",
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
} as const;

export { uz };
