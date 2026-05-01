import {Box} from "@mui/system";
import {Triptich} from "@/widgets/triptych/ui/Triptich";
import {Double} from "@/widgets/double/ui/Double";
import {Haos} from "@/widgets/haos/ui/Haos";
import {Galery} from "@/entities/galery/Galery";
import {Orders} from "@/entities/orders/Orders";
import {Header} from "@/entities/heders/api/Header";

const items=[
  {
    title: "Упражнения на спину",
    duration: "25:00",
    watchTime: "10:25"
  },
  {
    title: "Подготовка",
    duration: "25:00",
    watchTime: "10:25"
  },
  {
    title: "Усиление рук",
    duration: "25:00",
    watchTime: "10:25"
  },
  {
    title: "Усиление ног",
    duration: "25:00",
    watchTime: "10:25"
  },
  {
    title: "Профессиональные упражнения",
    duration: "25:00",
    watchTime: "10:25"
  },
]

function Main() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        bgcolor: "background.default",
        overflowX: "hidden",
      }}
    >
      <Header />

      <Box
        className="top-image"
        sx={{
          width: "100%",
          maxWidth: "1280px",
          mx: "auto",
          mt: { xs: 2, sm: 2.5 },
          borderRadius: { xs: 3, md: 4 },
          overflow: "hidden",
          backgroundImage: "url('/images/top.jpeg')",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />

      <Box
        className="content"

        sx={{
          width: "100%",
          bgcolor: "background.default",
          maxWidth: "1280px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
          <Triptich/>
          <Haos />
          <Double />
        <Galery items={items} />
        <Orders/>
      </Box>
    </Box>
  );
}

export { Main };
