import {Box} from "@mui/system";
import {Typography} from "@mui/material";
import {Triptich} from "@/widgets/triptych/Triptich";

function Main() {

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "#f5f0e7",
      }}
    >
      <Box
        className={"top-image"}
        sx={{
          backgroundImage: "url('/images/top.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            width: "100%",
            minHeight: "100px",
            px: 2,
            py: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Typography variant="h6" color="white">
              Меню
            </Typography>
            <Typography variant="h6" color="white">
              Кабинет
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        className="content"
        sx={{
          width: "100%",
          backgroundColor: "#f5f0e7",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 6, sm: 8, md: 10 },
        }}
      >
        <Box
          sx={{
            maxWidth: "1100px",
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "34px", sm: "42px", md: "52px" },
              lineHeight: 1.05,
              color: "#3e382f",
            }}
          >
            Добро пожаловать в метод Gym Balance
          </Typography>

          <Typography
            sx={{
              mt: 2,
              maxWidth: "860px",
              fontSize: { xs: "16px", md: "18px" },
              lineHeight: 1.75,
              color: "#544d44",
            }}
          >
            Каждое занятие сочетает комфортную нагрузку и восстановление, чтобы вы
            становились сильнее, чувствовали тело лучше и тренировались в устойчивом,
            спокойном ритме без перегруза.
          </Typography>

          <Typography
            sx={{
              mt: 4,
              fontSize: { xs: "16px", md: "18px" },
              lineHeight: 1.7,
              color: "#544d44",
            }}
          >
            Подход строится вокруг трех ключевых принципов.
          </Typography>
         <Triptich/>
        </Box>
      </Box>
    </Box>
  );
}

export { Main };
