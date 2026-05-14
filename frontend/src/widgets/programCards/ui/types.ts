export type ProgramCardSize = "small" | "middle" | "high";

export type ProgramCardItem = {
  id: string;
  title: string;
  image: string;
  accent?: string;
  actionLabel?: string;
  description?: string;
  duration?: string;
  href?: string;
  lessons?: string;
  progress?: number;
  status?: string;
};