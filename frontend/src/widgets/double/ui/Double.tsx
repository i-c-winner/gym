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
          bgcolor: "background.paper",
          px: { xs: 2.5, sm: 3.5, md: 5 },
          py: { xs: 3, sm: 4, md: 5 },
          minWidth: 0,
        }}
      >
        <Typography className="double-title">
          Мягкая практика с устойчивым прогрессом
        </Typography>

        <Typography className="double-body">
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
                bgcolor: "background.paper",
                px: 2,
                py: 2,
                minWidth: 0,
              }}
            >
              <Typography className="double-mini-title">
                {item.title}
              </Typography>

              <Typography className="double-mini-text">
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
          bgcolor: "background.paper",
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
