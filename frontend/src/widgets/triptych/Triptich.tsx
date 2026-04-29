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
      mt: 5,
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

        <Typography

          sx={{
            mt: 2.5,
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "28px", md: "34px" },
            lineHeight: 1.1,
            color: "#3e382f",
          }}
        >
          {pillar.title}
        </Typography>

        <Typography
          sx={{
            mt: 1.5,
            fontSize: { xs: "16px", md: "17px" },
            lineHeight: 1.7,
            color: "#544d44",
          }}
        >
          {pillar.description}
        </Typography>
      </Box>
    ))}
  </Box>
}
export {Triptich};
