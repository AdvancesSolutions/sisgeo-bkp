import { Box, Card, CardContent, Typography, TextField, Button } from "@mui/material";
import { useState } from "react";
import api from "@/lib/api";
import NiChartBar from "@/icons/nexture/ni-chart-bar";
import NiDocumentFull from "@/icons/nexture/ni-document-full";

const REPORT_ITEMS = [
  { id: "audit-pdf", label: "Auditoria PDF", desc: "Logs de auditoria em PDF", icon: NiDocumentFull, url: "/reports/audit/pdf", useDateRange: true },
  { id: "audit-excel", label: "Auditoria Excel", desc: "Logs de auditoria em Excel", icon: NiDocumentFull, url: "/reports/audit/excel", useDateRange: true },
  { id: "prod-pdf", label: "Produtividade PDF", desc: "Tarefas por período em PDF", icon: NiChartBar, url: "/reports/productivity/pdf", useDateRange: true },
  { id: "prod-excel", label: "Produtividade Excel", desc: "Tarefas por período em Excel", icon: NiChartBar, url: "/reports/productivity/excel", useDateRange: true },
  { id: "daily-pdf", label: "Consolidado do Dia PDF", desc: "Tarefas, fotos e evidências do dia", icon: NiDocumentFull, url: "/reports/daily/pdf", useDateRange: false, useSingleDate: true },
];

export function Reports() {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const handleDownload = async (path: string, useDateRange?: boolean, useSingleDate?: boolean) => {
    try {
      const params: Record<string, string> = {};
      if (useDateRange) {
        params.from = from;
        params.to = to;
      }
      if (useSingleDate) {
        params.date = to;
      }
      const { data } = await api.get(path, {
        params: Object.keys(params).length ? params : undefined,
        responseType: "blob",
      });
      const ext = path.includes("pdf") ? "pdf" : "xlsx";
      const url = URL.createObjectURL(data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // erro tratado pelo interceptor
    }
  };

  return (
    <Box>
      <Typography variant="h6" component="h1" className="mb-4 text-text-primary">
        Relatórios
      </Typography>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-center gap-4">
          <TextField
            type="date"
            label="De"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            type="date"
            label="Até"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </CardContent>
      </Card>
      <Box className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_ITEMS.map(({ id, label, desc, icon: Icon, url, useDateRange = false, useSingleDate = false }) => (
          <Card key={id} className="transition-colors hover:border-grey-300">
            <CardContent className="flex flex-row items-center gap-3">
              <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-grey-100 text-text-secondary">
                <Icon size="medium" />
              </Box>
              <Box className="flex-1">
                <Typography variant="subtitle1" className="font-medium text-text-primary">
                  {label}
                </Typography>
                <Typography variant="body2" className="text-text-secondary">
                  {desc}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  className="mt-2"
                  onClick={() => handleDownload(url, useDateRange, useSingleDate)}
                >
                  Baixar
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
