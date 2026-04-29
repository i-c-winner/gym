"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { IconButton, Typography } from "@mui/material";
import { Box } from "@mui/system";
import { useRef, useState } from "react";
import { Thumbnail } from "@/widgets/thumbnail/Thumbnail";

type GalleryItem = {
  title: string;
  duration: string;
  watchTime: string;
  label?: string;
};

type GaleryProps = {
  items: GalleryItem[];
  thumbnailWidth?: number | string;
  thumbnailHeight?: number | string;
};

const PREVIEW_IMAGE = "/images/thumbiline.jpeg";

function Galery({
  items,
  thumbnailWidth = 380,
  thumbnailHeight = 230,
}: GaleryProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }

    const safeIndex = Math.max(0, Math.min(index, items.length - 1));
    const child = container.children.item(safeIndex) as HTMLElement | null;

    if (!child) {
      return;
    }

    child.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

    setActiveIndex(safeIndex);
  };

  const handlePrev = () => {
    scrollToIndex(activeIndex - 1);
  };

  const handleNext = () => {
    scrollToIndex(activeIndex + 1);
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "80%",
        px: { xs: 0, sm: 6, md: 8 },
        py: { xs: 2, md: 3 },
        margin: "0 auto",
      }}
    >
      <IconButton
        aria-label="Предыдущий слайд"
        onClick={handlePrev}
        disabled={activeIndex === 0}
        sx={{
          position: "absolute",
          left: { xs: -6, sm: 8, md: 12 },
          top: "42%",
          zIndex: 2,
          display: { xs: "none", sm: "inline-flex" },
          width: 42,
          height: 42,
          borderRadius: "4px",
          border: "1px solid rgba(93, 86, 77, 0.28)",
          backgroundColor: "rgba(246, 239, 229, 0.96)",
          color: "#5a5147",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.98)",
          },
        }}
      >
        <ChevronLeftRoundedIcon />
      </IconButton>

      <IconButton
        aria-label="Следующий слайд"
        onClick={handleNext}
        disabled={activeIndex === items.length - 1}
        sx={{
          position: "absolute",
          right: { xs: -6, sm: 8, md: 12 },
          top: "42%",
          zIndex: 2,
          display: { xs: "none", sm: "inline-flex" },
          width: 42,
          height: 42,
          borderRadius: "4px",
          border: "1px solid rgba(93, 86, 77, 0.28)",
          backgroundColor: "rgba(246, 239, 229, 0.96)",
          color: "#5a5147",
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.98)",
          },
        }}
      >
        <ChevronRightRoundedIcon />
      </IconButton>

      <Box
        ref={scrollRef}
        sx={{
          display: "flex",
          gap: { xs: 2, md: 3 },
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {items.map((item, index) => (
          <Box
            key={`${item.title}-${index}`}
            sx={{
              flex: "0 0 auto",
              width: {
                xs: "86vw",
                sm: typeof thumbnailWidth === "number" ? `${thumbnailWidth}px` : thumbnailWidth,
              },
              scrollSnapAlign: "center",
            }}
          >
            <Thumbnail
              title={item.title}
              duration={item.duration}
              watchTime={item.watchTime}
              width="100%"
              height={thumbnailHeight}
              image={PREVIEW_IMAGE}
              label={item.label}
            />
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;

          return (
            <Box
              key={`${item.title}-dot-${index}`}
              component="button"
              type="button"
              aria-label={`Перейти к слайду ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              sx={{
                width: isActive ? 10 : 8,
                height: isActive ? 10 : 8,
                borderRadius: "999px",
                border: "none",
                p: 0,
                cursor: "pointer",
                backgroundColor: isActive ? "#cfaeb4" : "rgba(207, 174, 180, 0.5)",
              }}
            />
          );
        })}
      </Box>

      <Typography
        sx={{
          mt: 1.5,
          textAlign: "center",
          fontSize: "13px",
          color: "#7a7065",
          display: { xs: "block", sm: "none" },
        }}
      >
        Листайте влево и вправо, чтобы посмотреть все превью.
      </Typography>
    </Box>
  );
}

export { Galery };
export type { GalleryItem, GaleryProps };
