import UserModeSwitch from "./user-mode-switch";
import UserThemeSwitch from "./user-theme-switch";
import type { SyntheticEvent } from "react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Fade,
  ListItemIcon,
  Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Popper from "@mui/material/Popper";

import NiSettings from "@/icons/nexture/ni-settings";
import NiUser from "@/icons/nexture/ni-user";
import { cn } from "@/lib/utils";

export default function User() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const displayName = user?.name ?? "";
  const displayEmail = user?.email ?? "";

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  const navigate = useNavigate();

  return (
    <>
      <Box ref={anchorRef}>
        <Button
          variant="text"
          color="text-primary"
          className={cn(
            "group hover:bg-grey-25 ms-2 hidden gap-2 rounded-lg py-0! pe-0! hover:py-1! hover:pe-1.5! md:flex",
            open && "active bg-grey-25 py-1! pe-1.5!",
          )}
          onClick={handleToggle}
        >
          <Box>{displayName || t("user-overview")}</Box>
          <Avatar alt="avatar" src={undefined} className={cn("large transition-all group-hover:ms-0.5 group-hover:h-8 group-hover:w-8", open && "ms-0.5 h-8! w-8!")} />
        </Button>
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn("icon-only hover:bg-grey-25 hover-icon-shrink [&.active]:text-primary group ms-1 me-1 p-0! hover:p-1.5! md:hidden", open && "active bg-grey-25 p-1.5!")}
          onClick={handleToggle}
          startIcon={<Avatar alt="avatar" src={undefined} className={cn("large transition-all group-hover:h-7 group-hover:w-7", open && "h-7! w-7!")} />}
        />
      </Box>

      <Popper open={open} anchorEl={() => anchorRef.current!} role={undefined} placement="bottom-end" className="mt-3!" transition>
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Box>
              <ClickAwayListener onClickAway={handleClose}>
                <Card className="shadow-darker-sm!">
                  <CardContent>
                    <Box className="max-w-64 sm:w-72 sm:max-w-none">
                      <Box className="mb-4 flex flex-col items-center">
                        <Avatar alt="avatar" src={undefined} className="large mb-2" />
                        <Typography variant="subtitle1" component="p">{displayName || t("user-overview")}</Typography>
                        <Typography variant="body2" component="p" className="text-text-secondary -mt-2">{displayEmail}</Typography>
                      </Box>
                      <Divider className="large" />
                      <MenuList className="p-0">
                        <MenuItem onClick={(event) => { handleClose(event); navigate("/dashboard"); }}>
                          <ListItemIcon><NiUser size={20} /></ListItemIcon>
                          {t("user-overview")}
                        </MenuItem>
                        <MenuItem onClick={(event) => { handleClose(event); navigate("/perfil"); }}>
                          <ListItemIcon><NiSettings size={20} /></ListItemIcon>
                          {t("user-profile")}
                        </MenuItem>
                        <Divider className="large" />
                        <UserModeSwitch />
                        <UserThemeSwitch />
                        {/* Idioma: habilitar futuramente
                        <UserLanguageSwitch />
                        */}
                        <Divider className="large" />
                      </MenuList>
                      <Box className="my-8"></Box>
                      <Button
                        variant="outlined"
                        size="tiny"
                        color="grey"
                        className="w-full"
                        onClick={(event) => { handleClose(event); logout(); navigate("/login"); }}
                      >
                        {t("user-sign-out")}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
