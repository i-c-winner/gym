import { Typography } from "@mui/material";
import { Box } from "@mui/system";

function Double() {
  return (
    <Box
      sx={{
        maxWidth: "80%",
        margin: "5px auto 0",
        my: { xs: 6, md: 10 },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
        gap: { xs: 3, sm: 4, md: 5 },
        alignItems: "stretch",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          borderRadius: "12px",
          backgroundColor: "#efe6d7",
          px: { xs: 2.5, sm: 3.5, md: 5 },
          py: { xs: 3, sm: 4, md: 5 },
          minWidth: 0,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: { xs: "30px", sm: "38px", md: "46px" },
            lineHeight: 1.08,
            color: "#3e382f",
          }}
        >
          Мягкая практика с устойчивым прогрессом
        </Typography>

        <Typography
          sx={{
            mt: 2,
            fontSize: { xs: "16px", md: "18px" },
            lineHeight: 1.75,
            color: "#5d564d",
            maxWidth: "56ch",
          }}
        >
          Мы соединяем спокойный ритм, точную технику и понятную нагрузку, чтобы
          тренировки дома были не хаотичными, а последовательными и действительно
          поддерживали ваше тело.
        </Typography>

        <Box
          sx={{
            mt: 3,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {[
            {
              title: "Понятный темп",
              text: "Каждое занятие выстроено так, чтобы вы могли тренироваться без спешки и перегруза.",
            },
            {
              title: "Фокус на теле",
              text: "Мы работаем над подвижностью, контролем и ощущением опоры в каждом движении.",
            },
          ].map((item) => (
            <Box
              key={item.title}
              sx={{
                borderRadius: "10px",
                backgroundColor: "rgba(255,255,255,0.58)",
                px: 2,
                py: 2,
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "18px",
                  fontWeight: 600,
                  lineHeight: 1.25,
                  color: "#3e382f",
                }}
              >
                {item.title}
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  fontSize: "14px",
                  lineHeight: 1.65,
                  color: "#5d564d",
                }}
              >
                {item.text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        sx={{
          minHeight: { xs: "340px", sm: "460px", md: "100%" },
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#e5ddd0",
          backgroundImage: "url('/images/double.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
    </Box>
  );
}

export { Double };
