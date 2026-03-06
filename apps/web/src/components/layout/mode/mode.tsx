import { useTranslation } from "react-i18next";

import { Button, Tooltip } from "@mui/material";

import NiMoon from "@/icons/nexture/ni-moon";
import NiSun from "@/icons/nexture/ni-sun";
import { cn } from "@/lib/utils";
import { useThemeContext } from "@/theme/theme-provider";

export default function Mode() {
  const { t } = useTranslation();
  const { isDarkMode, setMode } = useThemeContext();

  const handleToggle = () => {
    setMode(isDarkMode ? "light" : "dark");
  };

  return (
    <>
      <Tooltip title={isDarkMode ? t("mode-light") : t("mode-dark")} placement="bottom" arrow>
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn("icon-only hover-icon-shrink [&.active]:text-primary hover:bg-grey-25")}
          onClick={handleToggle}
          startIcon={isDarkMode ? <NiSun size={"large"} /> : <NiMoon size={"large"} />}
        />
      </Tooltip>
    </>
  );
}
