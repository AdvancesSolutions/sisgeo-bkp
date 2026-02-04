import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Box, Button, Typography } from "@mui/material";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <Box component="footer" className="flex h-10 w-full items-center justify-between px-4">
      <Box className="flex items-center gap-0">
        <Button
          size="tiny"
          color="text-secondary"
          variant="text"
          className="hover:text-primary bg-transparent! font-normal"
          component={Link}
          to="/"
        >
          {t("footer-about")}
        </Button>
        <Button
          size="tiny"
          color="text-secondary"
          variant="text"
          className="hover:text-primary bg-transparent! font-normal"
          component={Link}
          to="/docs"
        >
          {t("footer-docs")}
        </Button>
        <Button
          size="tiny"
          color="text-secondary"
          variant="text"
          className="hover:text-primary bg-transparent! font-normal"
          component="a"
          href="https://www.advances.com.br/suporte"
          target="_blank"
          rel="noreferrer"
        >
          {t("footer-purchase")}
        </Button>
      </Box>
      <Typography variant="caption" className="text-text-secondary shrink-0">
        Advances - SIGEO V2.1.2
      </Typography>
    </Box>
  );
}
