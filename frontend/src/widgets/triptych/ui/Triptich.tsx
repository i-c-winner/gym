import {Typography} from "@mui/material";
import {Box} from "@mui/system";

const pillars = [
  {
    title: "Сила",
    description:
      "Упражнения мягко развивают силу, улучшают осанку, баланс и помогают почувствовать уверенность в собственном теле.",
    image: "/images/assets_page-editor_1.1720702264.png",
  },
  {
    title: "Осознанность",
    description:
      "Через спокойный ритм, дыхание и точные движения практика помогает лучше чувствовать тело и сохранять внутренний фокус.",
    image: "/images/assets_page-editor_2.1720702297.png",
  },
  {
    title: "Комфорт",
    description:
      "Тренировки остаются бережными к суставам и понятными для новичков, поэтому заниматься приятно и без перегруза.",
    image: "/images/assets_page-editor_3.1720616225.png",
  },
];
function Triptich() {
  return <Box
  sx={{
    maxWidth: "80%",
    margin: "5px auto 0",
  }}
  >
    <Typography>
      Добро пожаловать в метод Gym Balance
    </Typography>

    <Typography >
      Каждое занятие сочетает комфортную нагрузку и восстановление, чтобы вы
      становились сильнее, чувствовали тело лучше и тренировались в устойчивом,
      спокойном ритме без перегруза.
    </Typography>

    <Typography>
      Подход строится вокруг трех ключевых принципов.
    </Typography>
    <Box
      sx={{
        display: "grid",
        gap: { xs: 4, md: 3 },
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
      }}
    >

      {pillars.map((pillar) => (
        <Box key={pillar.title} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              width: "100%",
              aspectRatio: "0.9 / 1",
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: "#e8e0d3",
              backgroundImage: `url('${pillar.image}')`,
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
            }}
          />

          <Typography>
            {pillar.title}
          </Typography>
          <Typography>
            {pillar.description}
          </Typography>
        </Box>
      ))}
    </Box>
  </Box>


}
export {Triptich};
