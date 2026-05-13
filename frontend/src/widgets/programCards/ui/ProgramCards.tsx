"use client";

import { Grid } from "@mui/material";
import { ProgramCard, sizeConfig } from "./ProgramCard";
import type { ProgramCardItem, ProgramCardSize } from "./types";

type ProgramCardsProps = {
  items: ProgramCardItem[];
  size?: ProgramCardSize;
  actionLabel?: string;
  disabledActionLabel?: string;
  durationLabel?: string;
  lessonsLabel?: string;
  lockedLabel?: string;
  progressLabel?: string;
};

function ProgramCards({
  items,
  size = "middle",
  actionLabel,
  durationLabel,
  lessonsLabel,
  progressLabel,
}: ProgramCardsProps) {
  const config = sizeConfig[size];

  return (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid key={item.id} size={config.columns}>
          <ProgramCard
            item={item}
            size={size}
            actionLabel={actionLabel}
            durationLabel={durationLabel}
            lessonsLabel={lessonsLabel}
            progressLabel={progressLabel}
          />
        </Grid>
      ))}
    </Grid>
  );
}

export { ProgramCards };
export type { ProgramCardItem, ProgramCardSize };