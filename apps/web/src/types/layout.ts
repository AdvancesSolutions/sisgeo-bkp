import type { ButtonProps } from "@mui/material";

export type Screens = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
};

export type MenuItem = {
  id: string;
  label: string;
  description?: string;
  listIcon?: React.ReactNode;
  icon?: React.ReactNode;
  href?: string;
  color?: ButtonProps["color"];
  children?: MenuItem[];
  canAccess?: ("VIEWER" | "MODERATOR" | "ADMIN")[];
  isExternalLink?: boolean;
  content?: React.ReactNode;
  hideInMenu?: boolean;
};

export const ContentType = {
  Boxed: "boxed",
  Fluid: "fluid",
} as const;
export type ContentType = (typeof ContentType)[keyof typeof ContentType];

export const MenuType = {
  Minimal: "minimal",
  Comfort: "comfort",
  SingleLayer: "single-layer",
} as const;
export type MenuType = (typeof MenuType)[keyof typeof MenuType];

export const MenuShowState = {
  Show: "SHOW",
  Hide: "HIDE",
  TemporaryShow: "TEMPORARY_SHOW",
} as const;
export type MenuShowState = (typeof MenuShowState)[keyof typeof MenuShowState];

export type MenuWidth = { primary: number; secondary: number };
export type MenuDefaultWidth = Record<MenuType, MenuWidth>;
