import dayjs from "dayjs";
import "dayjs/locale/pt";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import { Link } from "react-router-dom";

import {
  Box,
  Button,
  capitalize,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  type SelectProps,
  Typography,
} from "@mui/material";
import { getGridDateOperators, type GridRenderCellParams } from "@mui/x-data-grid";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import DataGridDateTimeFilter from "@/components/data-grid/data-grid-date-time-filter";
import NiArrowDown from "@/icons/nexture/ni-arrow-down";
import NiArrowInDown from "@/icons/nexture/ni-arrow-in-down";
import NiArrowUp from "@/icons/nexture/ni-arrow-up";
import NiBinEmpty from "@/icons/nexture/ni-bin-empty";
import NiCheckSquare from "@/icons/nexture/ni-check-square";
import NiChevronDownSmall from "@/icons/nexture/ni-chevron-down-small";
import NiChevronLeftRightSmall from "@/icons/nexture/ni-chevron-left-right-small";
import NiChevronRightSmall from "@/icons/nexture/ni-chevron-right-small";
import NiCols from "@/icons/nexture/ni-cols";
import NiCross from "@/icons/nexture/ni-cross";
import NiEllipsisVertical from "@/icons/nexture/ni-ellipsis-vertical";
import NiExclamationSquare from "@/icons/nexture/ni-exclamation-square";
import NiEyeInactive from "@/icons/nexture/ni-eye-inactive";
import NiFilter from "@/icons/nexture/ni-filter";
import NiFilterPlus from "@/icons/nexture/ni-filter-plus";
import NiPlus from "@/icons/nexture/ni-plus";
import NiPlusSquare from "@/icons/nexture/ni-plus-square";
import NiSearch from "@/icons/nexture/ni-search";
import { dataGridLocalePtBR } from "@/lib/data-grid-locale";
import api from "@/lib/api";
import type { Task } from "@sigeo/shared";
import { useEffect, useState } from "react";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale("pt");

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendente",
  IN_PROGRESS: "Em execução",
  IN_REVIEW: "Em validação",
  DONE: "Concluída",
  REJECTED: "Rejeitada",
};

export default function DashboardRecentTasks() {
  const [rows, setRows] = useState<Task[]>([]);

  useEffect(() => {
    api
      .get<{ data: Task[] }>("/tasks", { params: { limit: 15 } })
      .then((r) => setRows(r.data?.data ?? []))
      .catch(() => setRows([]));
  }, []);

  return (
    <Box>
      <Box className="flex flex-row items-center justify-between">
        <Typography variant="h6" component="h6" className="mt-2 mb-3">
          Tarefas recentes
        </Typography>
        <Button
          component={Link}
          to="/tasks"
          size="tiny"
          color="grey"
          variant="text"
          startIcon={<NiChevronRightSmall size={"tiny"} className="rtl:rotate-180" />}
        >
          Ver todas
        </Button>
      </Box>
      <Card>
        <CardContent>
          <Box className="h-76.5">
            <DataGrid
              rows={rows}
              columns={columns}
              localeText={dataGridLocalePtBR}
              hideFooter
              disableColumnFilter
              disableColumnSelector
              disableDensitySelector
              columnHeaderHeight={40}
              disableRowSelectionOnClick
              className="border-none"
              getRowId={(row) => row.id}
              slots={{
                columnSortedDescendingIcon: () => <NiArrowDown size={"small"} />,
                columnSortedAscendingIcon: () => <NiArrowUp size={"small"} />,
                columnFilteredIcon: () => <NiFilterPlus size={"small"} />,
                columnReorderIcon: () => <NiChevronLeftRightSmall size={"small"} />,
                columnMenuIcon: () => <NiEllipsisVertical size={"small"} />,
                columnMenuSortAscendingIcon: NiArrowUp,
                columnMenuSortDescendingIcon: NiArrowDown,
                columnMenuFilterIcon: NiFilter,
                columnMenuHideIcon: NiEyeInactive,
                columnMenuClearIcon: NiCross,
                columnMenuManageColumnsIcon: NiCols,
                filterPanelDeleteIcon: NiCross,
                filterPanelAddIcon: NiPlus,
                filterPanelRemoveAllIcon: NiBinEmpty,
                columnSelectorIcon: NiCols,
                exportIcon: NiArrowInDown,
                openFilterButtonIcon: NiFilter,
                baseSelect: (props) => {
                  const propsCasted = props as SelectProps;
                  return (
                    <FormControl size="small" variant="outlined">
                      <InputLabel>{props.label}</InputLabel>
                      <Select
                        {...propsCasted}
                        IconComponent={NiChevronDownSmall}
                        MenuProps={{ className: "outlined" }}
                      />
                    </FormControl>
                  );
                },
                quickFilterIcon: () => <NiSearch size={"medium"} />,
                quickFilterClearIcon: () => <NiCross size={"medium"} />,
                baseButton: ({ ref: _r, ...p }) => <Button variant="pastel" color="grey" {...p} />,
              }}
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

const columns: GridColDef<Task>[] = [
  {
    field: "id",
    headerName: "ID",
    width: 90,
    renderCell: (params: GridRenderCellParams<Task, string>) => (
      <Link
        to={`/tasks/${params.value}`}
        className="text-text-primary link-primary link-underline-none hover:text-primary py-2 transition-colors"
      >
        {params.value?.slice(0, 8) ?? ""}
      </Link>
    ),
  },
  {
    field: "title",
    headerName: "Título",
    flex: 1,
    minWidth: 140,
    renderCell: (params: GridRenderCellParams<Task, string>) => (
      <Link
        to={`/tasks/${params.row.id}`}
        className="text-text-primary link-primary link-underline-none hover:text-primary py-2 font-semibold transition-colors"
      >
        {params.value || "—"}
      </Link>
    ),
  },
  {
    field: "scheduledDate",
    headerName: "Data",
    type: "dateTime",
    width: 120,
    valueGetter: (value) => (value ? new Date(value) : null),
    valueFormatter: (value) => (value ? dayjs(value).format("DD/MM/YYYY") : "—"),
  },
  {
    field: "createdAt",
    headerName: "Criado",
    width: 140,
    type: "dateTime",
    valueGetter: (value) => (value ? new Date(value) : null),
    renderCell: (params: GridRenderCellParams<Task, Date>) => {
      const value = params.value;
      if (value) {
        const diff = dayjs(value).diff(dayjs());
        return capitalize(dayjs.duration(diff, "milliseconds").humanize(true));
      }
      return null;
    },
    filterOperators: getGridDateOperators(false).map((item) => ({
      ...item,
      InputComponent: DataGridDateTimeFilter,
    })),
  },
  {
    field: "status",
    headerName: "Status",
    minWidth: 130,
    type: "singleSelect",
    valueOptions: ["PENDING", "IN_PROGRESS", "IN_REVIEW", "DONE", "REJECTED"],
    renderCell: (params: GridRenderCellParams<Task, string>) => {
      const value = params.value;
      const label = STATUS_LABEL[value ?? ""] ?? value;
      if (value === "DONE") {
        return (
          <Button
            className="pointer-events-none self-center"
            size="tiny"
            color="info"
            variant="pastel"
            startIcon={<NiCheckSquare size={"tiny"} />}
          >
            {label}
          </Button>
        );
      }
      if (value === "IN_REVIEW") {
        return (
          <Button
            className="pointer-events-none self-center"
            size="tiny"
            color="warning"
            variant="pastel"
            startIcon={<NiExclamationSquare size={"tiny"} />}
          >
            {label}
          </Button>
        );
      }
      if (value === "REJECTED") {
        return (
          <Button
            className="pointer-events-none self-center"
            size="tiny"
            color="error"
            variant="pastel"
            startIcon={<NiExclamationSquare size={"tiny"} />}
          >
            {label}
          </Button>
        );
      }
      return (
        <Button
          className="pointer-events-none self-center"
          size="tiny"
          color="success"
          variant="pastel"
          startIcon={<NiPlusSquare size={"tiny"} />}
        >
          {label}
        </Button>
      );
    },
  },
];
