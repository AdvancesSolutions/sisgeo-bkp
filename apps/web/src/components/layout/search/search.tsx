import { useEffect, useState } from "react";

import TabContext from "@mui/lab/TabContext";
import TabPanel from "@mui/lab/TabPanel";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  InputAdornment,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";

import NiChevronLeftSmall from "@/icons/nexture/ni-chevron-left-small";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiDocumentImage from "@/icons/nexture/ni-document-image";
import NiSearch from "@/icons/nexture/ni-search";
import NiStructure from "@/icons/nexture/ni-structure";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function Search() {
  const { t } = useTranslation();
  const isMac = navigator.userAgent.includes("Mac");

  const [tooltipShow, setTooltipShow] = useState(false);
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState("all");

  const handleClickOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        handleClickOpenDialog();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <Tooltip
        title={`${t("search")} (${isMac ? "cmd" : "ctrl"}+k)`}
        placement="bottom"
        arrow
        open={!open && tooltipShow}
      >
        <Button
          variant="text"
          size="large"
          color="text-primary"
          className={cn(
            "icon-only hover-icon-shrink [&.active]:text-primary! hover:bg-grey-25",
            open && "active bg-grey-25 text-primary!",
          )}
          onClick={handleClickOpenDialog}
          onMouseEnter={() => setTooltipShow(true)}
          onMouseLeave={() => setTooltipShow(false)}
          startIcon={<NiSearch variant={open ? "contained" : "outlined"} size={24} />}
        />
      </Tooltip>

      <Dialog
        onClose={handleCloseDialog}
        open={open}
        maxWidth="md"
        fullWidth
        classes={{ container: "items-start", paper: "mt-16" }}
      >
        <DialogTitle className="border-grey-100 border-b py-0!">
          <Input
            classes={{ input: "ps-0!" }}
            className="w-full py-7!"
            placeholder={t("search-placeholder")}
            startAdornment={
              <InputAdornment position="start">
                <NiSearch size="medium" />
              </InputAdornment>
            }
          />
        </DialogTitle>
        <DialogContent className="flex flex-col pt-6 pb-0">
          <TabContext value={tabValue}>
            <Tabs
              variant="scrollable"
              allowScrollButtonsMobile
              value={tabValue}
              onChange={(_, v: string) => setTabValue(v)}
              slots={{
                EndScrollButtonIcon: () => <NiChevronRightSmall size="medium" />,
                StartScrollButtonIcon: () => <NiChevronLeftSmall size="medium" />,
              }}
              className="flex-none"
            >
              <Tab
                icon={<NiStructure size="medium" className="me-0! md:me-1!" />}
                iconPosition="start"
                label={<Box className="hidden md:flex">{t("search-tab-all")}</Box>}
                value="all"
              />
              <Tab
                icon={<NiDocumentImage size="medium" className="me-0! md:me-1!" />}
                iconPosition="start"
                label={<Box className="hidden md:flex">{t("search-tab-tasks")}</Box>}
                value="tasks"
              />
              <Tab
                icon={<NiDocumentImage size="medium" className="me-0! md:me-1!" />}
                iconPosition="start"
                label={<Box className="hidden md:flex">{t("search-tab-areas")}</Box>}
                value="areas"
              />
              <Tab
                icon={<NiDocumentImage size="medium" className="me-0! md:me-1!" />}
                iconPosition="start"
                label={<Box className="hidden md:flex">{t("search-tab-no-result")}</Box>}
                value="no-result"
              />
            </Tabs>
            <TabPanel value="all" className="p-0">
              <Box className="flex flex-col gap-2.5 pt-2">
                <Typography variant="body2" className="text-text-disabled mb-2 font-medium">
                  {t("search-recent")}
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {t("search-no-recent")}
                </Typography>
              </Box>
            </TabPanel>
            <TabPanel value="tasks" className="p-0">
              <Box className="pt-2">
                <Typography variant="body2" className="text-text-secondary">
                  {t("search-no-recent")}
                </Typography>
              </Box>
            </TabPanel>
            <TabPanel value="areas" className="p-0">
              <Box className="pt-2">
                <Typography variant="body2" className="text-text-secondary">
                  {t("search-no-recent")}
                </Typography>
              </Box>
            </TabPanel>
            <TabPanel value="no-result" className="p-0">
              <Box className="pt-2">
                <Typography variant="body2" className="text-text-secondary">
                  {t("search-no-recent")}
                </Typography>
              </Box>
            </TabPanel>
          </TabContext>
        </DialogContent>
        <DialogActions className="justify-center">
          <Button variant="text" size="tiny" color="primary">
            {t("search-advanced")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
