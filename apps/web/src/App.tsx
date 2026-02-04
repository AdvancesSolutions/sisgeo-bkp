import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";

import { Box, StyledEngineProvider } from "@mui/material";

import BackgroundWrapper from "@/components/layout/containers/background-wrapper";
import SnackbarWrapper from "@/components/layout/containers/snackbar-wrapper";
import LayoutContextProvider from "@/components/layout/layout-context";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyLogoProvider } from "@/contexts/CompanyLogoContext";
import AppRoutes from "@/routes";
import ThemeProvider from "@/theme/theme-provider";
import Loading from "@/pages/Loading";

function App() {
  const { i18n } = useTranslation();
  const direction = i18n.language === "ar" ? "rtl" : "ltr";

  return (
    <BrowserRouter>
      <StyledEngineProvider enableCssLayer>
        <Box
          lang={i18n.language}
          dir={direction}
          className="font-mulish font-urbanist relative overflow-hidden antialiased"
        >
          <ThemeProvider>
            <LayoutContextProvider>
              <BackgroundWrapper />
              <SnackbarWrapper>
                <AuthProvider>
                  <CompanyLogoProvider>
                    <Suspense fallback={<Loading />}>
                      <AppRoutes />
                    </Suspense>
                  </CompanyLogoProvider>
                </AuthProvider>
              </SnackbarWrapper>
            </LayoutContextProvider>
          </ThemeProvider>
        </Box>
      </StyledEngineProvider>
    </BrowserRouter>
  );
}

export default App;
