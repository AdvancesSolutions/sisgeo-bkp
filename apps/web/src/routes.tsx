import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AdminOnly } from "@/components/AdminOnly";
import { AdminOrSupervisorOnly } from "@/components/AdminOrSupervisorOnly";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/pages/app/layout";
import type { MenuItem } from "@/types/types";

import { Dashboard } from "@/pages/Dashboard";
import { Login } from "@/pages/Login";
import { Tasks } from "@/pages/Tasks";
import { TaskDetail } from "@/pages/TaskDetail";
import { Employees } from "@/pages/Employees";
import { EmployeeAccess } from "@/pages/EmployeeAccess";
import { Locations } from "@/pages/Locations";
import { Areas } from "@/pages/Areas";
import { Validation } from "@/pages/Validation";
import { Materials } from "@/pages/Materials";
import { TimeClock } from "@/pages/TimeClock";
import { Reports } from "@/pages/Reports";
import { Audit } from "@/pages/Audit";
import { AuthDebug } from "@/pages/AuthDebug";
import { PainelControle } from "@/pages/PainelControle";
import { Configuracoes } from "@/pages/Configuracoes";
import { Perfil } from "@/pages/Perfil";

import { leftMenuBottomItems, leftMenuItems } from "@/menu-items";

function generateRoutesFromMenuItems(menuItems: MenuItem[]): React.ReactElement[] {
  return menuItems.flatMap((item: MenuItem) => {
    const routes: React.ReactElement[] = [];
    if (item.isExternalLink || !item.href || item.href === "#") return routes;
    const path = item.href.startsWith("/") ? item.href.slice(1) : item.href;
    if (path === "dashboard") routes.push(<Route key={item.id} path={path} element={<Dashboard />} />);
    else if (path === "painel-controle") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><PainelControle /></AdminOrSupervisorOnly>} />);
    else if (path === "tasks") routes.push(<Route key={item.id} path={path} element={<Tasks />} />);
    else if (path === "employees") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Employees /></AdminOrSupervisorOnly>} />);
    else if (path === "employee-access") routes.push(<Route key={item.id} path={path} element={<AdminOnly><EmployeeAccess /></AdminOnly>} />);
    else if (path === "locations") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Locations /></AdminOrSupervisorOnly>} />);
    else if (path === "areas") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Areas /></AdminOrSupervisorOnly>} />);
    else if (path === "validation") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Validation /></AdminOrSupervisorOnly>} />);
    else if (path === "materials") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Materials /></AdminOrSupervisorOnly>} />);
    else if (path === "timeclock") routes.push(<Route key={item.id} path={path} element={<TimeClock />} />);
    else if (path === "reports") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Reports /></AdminOrSupervisorOnly>} />);
    else if (path === "audit") routes.push(<Route key={item.id} path={path} element={<AdminOrSupervisorOnly><Audit /></AdminOrSupervisorOnly>} />);
    else if (path === "auth-debug") routes.push(<Route key={item.id} path={path} element={<AdminOnly><AuthDebug /></AdminOnly>} />);
    else if (path === "configuracoes") routes.push(<Route key={item.id} path={path} element={<Configuracoes />} />);
    if (item.children?.length) routes.push(...generateRoutesFromMenuItems(item.children));
    return routes;
  });
}

const mainRoutes = generateRoutesFromMenuItems(leftMenuItems);
const bottomRoutes = generateRoutesFromMenuItems(leftMenuBottomItems);

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        {mainRoutes}
        {bottomRoutes}
        <Route path="perfil" element={<Perfil />} />
        <Route path="tasks/:id" element={<TaskDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
