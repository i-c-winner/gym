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
        backgroundColor: "secondary.main",
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
          <Typography className="thumbnail-title">
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
              bgcolor: "background.paper",
              boxShadow: "0 8px 20px rgba(34, 28, 22, 0.18)",
            }}
          >
            <PlayArrowRoundedIcon sx={{ fontSize: 28, color: "#1f1c19", ml: "2px" }} />
          </Box>

          <Typography className="thumbnail-meta">
            {watchTime}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export { Thumbnail };
export type { ThumbnailProps };
