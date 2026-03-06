import { ptBR } from "@mui/x-data-grid/locales";

/** Textos em português (BR) para o DataGrid (ex.: "Nenhuma linha", filtros, etc.) */
export const dataGridLocalePtBR =
  (ptBR as { components?: { MuiDataGrid?: { defaultProps?: { localeText?: Record<string, unknown> } } } })
    .components?.MuiDataGrid?.defaultProps?.localeText ?? { noRowsLabel: "Nenhuma linha" };
