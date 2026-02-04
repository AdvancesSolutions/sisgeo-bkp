import { useRef, useState } from "react";
import type { SyntheticEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  ClickAwayListener,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Popper,
  Tooltip,
  Typography,
} from "@mui/material";

import NiBasket from "@/icons/nexture/ni-basket";
import NiCells from "@/icons/nexture/ni-cells";
import NiChartPie from "@/icons/nexture/ni-chart-pie";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiClock from "@/icons/nexture/ni-clock";
import NiDocumentFull from "@/icons/nexture/ni-document-full";
import NiHome from "@/icons/nexture/ni-home";
import NiListSquare from "@/icons/nexture/ni-list-square";
import NiPlus from "@/icons/nexture/ni-plus";
import NiSigns from "@/icons/nexture/ni-signs";
import NiUsers from "@/icons/nexture/ni-users";
import { cn } from "@/lib/utils";

const SIGEO_SHORTCUTS = [
  { labelKey: "shortcut-dashboard", href: "/dashboard", icon: NiHome, colorClass: "bg-primary-light/10 text-primary" },
  { labelKey: "shortcut-tasks", href: "/tasks", icon: NiListSquare, colorClass: "bg-secondary-light/10 text-secondary" },
  { labelKey: "shortcut-timeclock", href: "/timeclock", icon: NiClock, colorClass: "bg-accent-1-light/10 text-accent-1" },
  { labelKey: "shortcut-employees", href: "/employees", icon: NiUsers, colorClass: "bg-accent-2-light/10 text-accent-2" },
  { labelKey: "shortcut-locations", href: "/locations", icon: NiSigns, colorClass: "bg-accent-3-light/10 text-accent-3" },
  { labelKey: "shortcut-areas", href: "/areas", icon: NiCells, colorClass: "bg-accent-4-light/10 text-accent-4" },
  { labelKey: "shortcut-validation", href: "/validation", icon: NiCheckSquare, colorClass: "bg-primary-light/10 text-primary" },
  { labelKey: "shortcut-materials", href: "/materials", icon: NiBasket, colorClass: "bg-secondary-light/10 text-secondary" },
  { labelKey: "shortcut-reports", href: "/reports", icon: NiChartPie, colorClass: "bg-accent-1-light/10 text-accent-1" },
  { labelKey: "shortcut-audit", href: "/audit", icon: NiDocumentFull, colorClass: "bg-accent-2-light/10 text-accent-2" },
] as const;

export default function Shortcuts() {
  const { t } = useTranslation();
  const [tooltipShow, setTooltipShow] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={t("shortcuts")} placement="bottom" arrow open={!open && tooltipShow}>
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary hover:bg-grey-25",
            open && "active bg-grey-25",
          )}
          onClick={handleToggle}
          onMouseEnter={() => setTooltipShow(true)}
          onMouseLeave={() => setTooltipShow(false)}
          ref={anchorRef}
          startIcon={<NiCells variant={open ? "contained" : "outlined"} size={24} />}
        />
      </Tooltip>
      <Popper
        open={open}
        anchorEl={() => anchorRef.current!}
        role={undefined}
        placement="bottom-end"
        className="mt-3!"
        transition
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps}>
            <Box>
              <ClickAwayListener onClickAway={handleClose}>
                <Card className="shadow-darker-sm! w-xs">
                  <Box className="flex flex-1 flex-row items-start justify-between pe-4">
                    <Typography variant="h6" component="h6" className="card-title px-4 pt-4">
                      {t("shortcuts")}
                    </Typography>
                    <Button
                      className="icon-only mt-3"
                      size="tiny"
                      color="grey"
                      variant="text"
                      startIcon={<NiPlus size={"small"} />}
                    />
                  </Box>
                  <Box className="mb-4">
                    <List className="max-h-72 overflow-auto">
                      {SIGEO_SHORTCUTS.map(({ labelKey, href, icon: Icon, colorClass }) => (
                        <ListItem key={labelKey} className="py-0 ps-0 pe-4">
                          <ListItemButton
                            component={Link}
                            to={href}
                            onClick={handleClose}
                            classes={{ root: "group items-start" }}
                          >
                            <ListItemAvatar>
                              <Avatar className={cn("medium me-3", colorClass)}>
                                <Icon size="medium" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Typography component="p" variant="subtitle2" className="leading-4">
                                  {t(labelKey)}
                                </Typography>
                              }
                              secondary={href}
                              slotProps={{ primary: { className: "leading-4" } }}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                  <CardActions disableSpacing>
                    <Button variant="outlined" size="tiny" color="grey" className="w-full">
                      {t("add-shortcut")}
                    </Button>
                  </CardActions>
                </Card>
              </ClickAwayListener>
            </Box>
          </Fade>
        )}
      </Popper>
    </>
  );
}
