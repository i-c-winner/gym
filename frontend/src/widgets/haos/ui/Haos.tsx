import { Grid, Typography } from "@mui/material";
import { Box } from "@mui/system";

const reviews = [
  {
    text: "Занятия здесь ощущаются глубже обычной тренировки. В каждом уроке чувствуется внимание к деталям, ритму и состоянию тела.",
    size: { xs: 12, md: 5, lg: 4 },
    py: { xs: 2, md: 2.5 },
  },
  {
    text: "Спокойная подача, понятные объяснения и продуманная структура помогают мне оставаться собранной и получать удовольствие от практики.",
    size: { xs: 12, md: 7, lg: 4 },
    py: { xs: 2.5, md: 3 },
  },
  {
    text: "Мне особенно нравится, что тренировки поддерживают тело мягко, но при этом дают заметный результат без перегруза.",
    size: { xs: 12, md: 6, lg: 4 },
    py: { xs: 2, md: 2.25 },
  },
  {
    text: "Раньше я откладывала занятия, а теперь жду их. В этой методике есть одновременно деликатность и настоящая работа мышц.",
    size: { xs: 12, md: 4, lg: 4 },
    py: { xs: 2, md: 2.25 },
  },
  {
    text: "После практики я чувствую себя собраннее и спокойнее. Это тот редкий формат, где сила сочетается с ментальным восстановлением.",
    size: { xs: 12, md: 4, lg: 4 },
    py: { xs: 2.25, md: 2.75 },
  },
  {
    text: "Даже через экран ощущается качественное сопровождение. Уроки понятные, точные и очень человечные по подаче.",
    size: { xs: 12, md: 4, lg: 4 },
    py: { xs: 2, md: 2.25 },
  },
  {
    text: "Мне нравится, что прогресс идет без резких скачков. Тело постепенно открывается, а сами тренировки остаются бережными.",
    size: { xs: 12, md: 6, lg: 5 },
    py: { xs: 2.25, md: 2.75 },
  },
  {
    text: "Это почти медитативный опыт, но при этом он действительно работает на выносливость, подвижность и внутренний фокус.",
    size: { xs: 12, md: 6, lg: 7 },
    py: { xs: 2.5, md: 3.25 },
  },
];

function Haos() {
  return (
    <Box
      sx={{
        mt: { xs: 6, md: 10 },
        px: { xs: 2, sm: 3, md: 0 },
      }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: { xs: "14px", md: "18px" },
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, sm: 5, md: 6 },
          backgroundColor: "#cec3b6",
          backgroundImage:
            "linear-gradient(180deg, rgba(116, 101, 86, 0.18) 0%, rgba(116, 101, 86, 0.3) 100%), url('/images/haos.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      >
        <Typography
          sx={{
            position: "relative",
            zIndex: 1,
            mb: { xs: 3, md: 4 },
            textAlign: "center",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "32px", sm: "40px", md: "52px" },
            lineHeight: 1.08,
            color: "#fffaf3",
            textShadow: "0 2px 16px rgba(62, 56, 47, 0.22)",
          }}
        >
          Что любят наши участники
        </Typography>

        <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ position: "relative", zIndex: 1 }}>
          {reviews.map((review, index) => (
            <Grid key={`${index}-${review.text.slice(0, 12)}`} size={review.size}>
              <Box
                sx={{
                  height: "100%",
                  borderRadius: "10px",
                  px: { xs: 2, md: 2.5 },
                  py: review.py,
                  backgroundColor: "rgba(250, 246, 239, 0.92)",
                  boxShadow: "0 10px 24px rgba(71, 58, 45, 0.08)",
                  backdropFilter: "blur(2px)",
                }}
              >
                <Typography
                  sx={{
                    textAlign: "center",
                    fontSize: { xs: "14px", md: "15px" },
                    lineHeight: 1.6,
                    color: "#52493f",
                  }}
                >
                  {review.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export { Haos };
