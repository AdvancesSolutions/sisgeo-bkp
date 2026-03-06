import Mode from "../mode/mode";
import Notifications from "../notifications/notifications";
import Search from "../search/search";
import Shortcuts from "../shortcuts/shortcuts";
import User from "../user/user";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Box, Button, Fade, Typography, useMediaQuery, useTheme } from "@mui/material";

import { useLayoutContext } from "@/components/layout/layout-context";
import { useCompanyLogo } from "@/contexts/CompanyLogoContext";
import Logo from "@/components/logo/Logo";
import NiListSquare from "@/icons/nexture/ni-list-square";
import NiMenuSplit from "@/icons/nexture/ni-menu-split";
import { cn } from "@/lib/utils";
import { MenuShowState } from "@/types/types";

const FALLBACK_LOGO_SRC = "/logo-empresa.svg";

export default function Header() {
  const { showLeftInMobile, showLeftMobileButton, leftPrimaryCurrent, leftShowBackdrop } = useLayoutContext();
  const { companyLogoUrl } = useCompanyLogo();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [rightButtonsVisibleMobile, setRightButtonsVisibleMobile] = useState(false);
  const logoSrc = companyLogoUrl || FALLBACK_LOGO_SRC;

  const handleRightButtonsMobileToggle = () => {
    setRightButtonsVisibleMobile((prevValue) => !prevValue);
  };

  return (
    <Box className="mui-fixed fixed z-20 h-20 w-full" component="header">
      <Box
        className={cn(
          "bg-background-paper shadow-darker-xs flex h-full w-full flex-none flex-row items-center rounded-b-3xl sm:h-20",
          leftShowBackdrop && "pointer-events-none",
        )}
        style={{ padding: `0 var(--main-padding)` }}
      >
        <Box
          className={cn(
            "bg-background-paper absolute inset-0 -z-10 rounded-b-3xl",
            leftPrimaryCurrent !== MenuShowState.Hide && "rounded-bl-none! rtl:rounded-br-none!",
          )}
        ></Box>
        {/* Left menu button */}
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary [&.active]:bg-grey-25 hover:bg-grey-25",
            showLeftMobileButton ? "flex" : "hidden",
            leftPrimaryCurrent !== MenuShowState.Hide && "active",
          )}
          onClick={() => showLeftInMobile()}
          startIcon={<NiMenuSplit size={24} />}
        />

        <Box className="flex h-full flex-1 flex-row items-center gap-4 md:gap-6">
          {/* Logo do SIGEO: link para /dashboard */}
          <Link to="/dashboard" className="flex items-center gap-2 no-underline">
            <Logo classNameFull="ms-2 hidden md:block" classNameMobile="ms-2 md:hidden" />
            <Typography variant="h6" component="span" className="font-semibold text-text-primary">
              SISGEO
            </Typography>
          </Link>
          {/* Espaço entre SISGEO e a logo da empresa */}
          <Box className="min-w-4 shrink-0" aria-hidden />
          {/* Área da logo da empresa: configurável em Configurações; imagem com object-contain para não distorcer */}
          <Box
            className="flex max-h-10 min-h-8 min-w-[7rem] max-w-40 items-center justify-center overflow-hidden rounded border border-dashed border-[var(--mui-palette-divider)] bg-grey-500/5 px-3 py-1.5"
            title="Logo da empresa (configure em Configurações)"
          >
            <Box
              component="img"
              src={logoSrc}
              alt="Logo da empresa"
              sx={{
                maxHeight: "100%",
                maxWidth: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                objectPosition: "center",
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Box>
        </Box>

        {/* Right buttons */}
        <Box className="flex flex-row sm:gap-1">
          <Fade in={rightButtonsVisibleMobile || !isMobile}>
            <Box className={cn("hidden flex-row sm:flex! sm:gap-1", rightButtonsVisibleMobile ? "flex" : "hidden")}>
              <Search />
              <Shortcuts />
              <Notifications />
              <Mode />
            </Box>
          </Fade>

          {/* The button to turn on and off the mobile version of the right buttons and version select */}
          <Button
            variant="text"
            size="large"
            color="text-primary"
            className={cn(
              "icon-only hover-icon-shrink [&.active]:text-primary hover:bg-grey-25 ms-1 sm:hidden",
              rightButtonsVisibleMobile && "active",
            )}
            onClick={handleRightButtonsMobileToggle}
            startIcon={<NiListSquare size={"large"} />}
          />
        </Box>

        {/* User Avatar and Menu */}
        <User />
      </Box>
    </Box>
  );
}
