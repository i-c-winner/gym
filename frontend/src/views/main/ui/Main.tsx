import {Box} from "@mui/system";
import {Triptich} from "@/widgets/triptych/ui/Triptich";
import {Double} from "@/widgets/double/ui/Double";
import {Haos} from "@/widgets/haos/ui/Haos";
import {Galery} from "@/entities/galery/Galery";
import {Orders} from "@/entities/orders/Orders";

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
      }}
    >
      <Box
        className="top-image"
        sx={{
          width: "100%",
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
          px: { xs: 2, sm: 3, md: 5 },
          py: { xs: 6, sm: 8, md: 10 },
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
