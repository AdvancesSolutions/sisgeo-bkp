import type { MenuItem } from "@/types/types";
import { Viewer } from "@/types/types";

export const leftMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    icon: "NiHome",
    label: "Dashboard",
    href: "/dashboard",
    description: "Visão geral",
  },
  {
    id: "admin",
    icon: "NiUsers",
    label: "Administração",
    href: "/employees",
    description: "Funcionários, locais e áreas",
    canAccess: [Viewer.ADMIN, Viewer.SUPERVISOR],
    children: [
      { id: "painel-controle", label: "Painel de Controle", href: "/painel-controle", icon: "NiChartBar" },
      { id: "employees", label: "Funcionários", href: "/employees", icon: "NiUsers" },
      { id: "employee-access", label: "Acessos dos Funcionários", href: "/employee-access", icon: "NiKey", canAccess: [Viewer.ADMIN] },
      { id: "locations", label: "Locais", href: "/locations", icon: "NiSigns" },
      { id: "areas", label: "Áreas", href: "/areas", icon: "NiCells" },
      { id: "validation", label: "Validação", href: "/validation", icon: "NiCheckSquare" },
      { id: "materials", label: "Materiais", href: "/materials", icon: "NiBasket" },
      { id: "reports", label: "Relatórios", href: "/reports", icon: "NiChartPie" },
      { id: "audit", label: "Auditoria", href: "/audit", icon: "NiDocumentFull" },
    ],
  },
  {
    id: "tasks",
    icon: "NiListSquare",
    label: "Tarefas",
    href: "/tasks",
    description: "Tarefas e atividades",
  },
  {
    id: "timeclock",
    icon: "NiClock",
    label: "Ponto",
    href: "/timeclock",
    description: "Registro de ponto",
  },
];

export const leftMenuBottomItems: MenuItem[] = [
  {
    id: "auth-debug",
    label: "Debug Auth",
    href: "/auth-debug",
    icon: "NiExclamationSquare",
    canAccess: [Viewer.ADMIN],
  },
  {
    id: "settings",
    label: "Configurações",
    href: "/configuracoes",
    icon: "NiSettings",
  },
];
