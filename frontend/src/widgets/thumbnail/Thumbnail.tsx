import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { Typography } from "@mui/material";
import { Box } from "@mui/system";

type ThumbnailProps = {
  title: string;
  duration: string;
  watchTime: string;
  width?: number | string;
  height?: number | string;
  image: string;
  label?: string;
};

function Thumbnail({
  title,
  duration,
  watchTime,
  width = "100%",
  height = 320,
  image,
  label,
}: ThumbnailProps) {
  return (
    <Box
      sx={{
        position: "relative",
        width,
        height,
        overflow: "hidden",
        borderRadius: "16px",
        backgroundColor: "#c7b6a8",
        backgroundImage: `linear-gradient(180deg, rgba(42, 35, 28, 0.08) 0%, rgba(42, 35, 28, 0.42) 100%), url('${image}')`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        boxShadow: "0 18px 40px rgba(34, 28, 22, 0.12)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: { xs: 2, md: 2.5 },
        }}
      >


        <Box sx={{ maxWidth: "72%" }}>
          <Typography
            sx={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: { xs: "34px", md: "42px" },
              fontWeight: 700,
              lineHeight: 1.06,
              color: "#fff9f2",
              textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
            }}
          >
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: { xs: 44, md: 48 },
              height: { xs: 44, md: 48 },
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 8px 20px rgba(34, 28, 22, 0.18)",
            }}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 28, color: "#1f1c19", ml: "2px" }} />
          </Box>

          <Typography
            sx={{
              fontSize: { xs: "18px", md: "20px" },
              fontWeight: 700,
              lineHeight: 1,
              color: "#fff9f2",
              textShadow: "0 2px 18px rgba(38, 31, 24, 0.32)",
            }}
          >
            {watchTime}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export { Thumbnail };
export type { ThumbnailProps };
