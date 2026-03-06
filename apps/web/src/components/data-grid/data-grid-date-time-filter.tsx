import dayjs from "dayjs";

import type { GridFilterInputValueProps } from "@mui/x-data-grid";
import { DateTimePicker } from "@mui/x-date-pickers";

import NiCalendar from "@/icons/nexture/ni-calendar";
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiChevronLeftSmall from "@/icons/nexture/ni-chevron-left-small";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import { cn } from "@/lib/utils";

export default function DataGridDateTimeFilter(props: GridFilterInputValueProps) {
  const { item, applyValue, apiRef } = props;

  const handleChange = (newValue: unknown) => {
    applyValue({ ...item, value: newValue });
  };

  return (
    <DateTimePicker
      defaultValue={item.value ? dayjs(item.value as string | number | Date) : null}
      onChange={handleChange}
      label={apiRef.current.getLocaleText("filterPanelInputLabel")}
      className="outlined edit-date mb-0"
      slots={{
        openPickerIcon: (slotProps) => (
          <NiCalendar {...slotProps} className={cn(slotProps.className, "text-text-secondary")} />
        ),
        switchViewIcon: (slotProps) => (
          <NiChevronDownSmall {...slotProps} className={cn(slotProps.className, "text-text-secondary")} />
        ),
        leftArrowIcon: (slotProps) => (
          <NiChevronLeftSmall {...slotProps} className={cn(slotProps.className, "text-text-secondary")} />
        ),
        rightArrowIcon: (slotProps) => (
          <NiChevronRightSmall {...slotProps} className={cn(slotProps.className, "text-text-secondary")} />
        ),
      }}
      slotProps={{
        textField: { size: "small", variant: "standard" },
        desktopPaper: { className: "outlined" },
      }}
    />
  );
}
