import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "react-use";

import { useScreenEffect } from "@/hooks/use-screen";
import type {
  MenuDefaultWidth,
  MenuShowState,
  MenuType,
  MenuWidth,
  Screens,
} from "@/types/layout";
import { MenuShowState as MenuShowStateValues } from "@/types/layout";

type Props = {
  primaryBreakpoint: keyof Screens;
  secondaryBreakpoint?: keyof Screens;
  storageKey: string;
  defaultMenuType: MenuType;
  menuDefaultWidth: MenuDefaultWidth;
};

export function useMenu(config: Props) {
  const { primaryBreakpoint, secondaryBreakpoint, storageKey, defaultMenuType, menuDefaultWidth } =
    config;

  const [showBackdrop, setShowBackdrop] = useState(false);
  const [primaryDefault, setPrimaryDefault] = useState<boolean>(false);
  const [secondaryDefault, setSecondaryDefault] = useState<boolean>(false);
  const [menuType, setMenuType] = useLocalStorage<MenuType>(storageKey, defaultMenuType);
  const [primaryCurrent, setPrimaryCurrent] = useState<MenuShowState>(MenuShowStateValues.Show);
  const [secondaryCurrent, setSecondaryCurrent] = useState<MenuShowState>(MenuShowStateValues.Show);
  const [showMobileButton, setShowMobileButton] = useState(false);
  const [menuWidth, setMenuWidth] = useState<MenuWidth>({
    primary: menuDefaultWidth[menuType || defaultMenuType].primary,
    secondary: menuDefaultWidth[menuType || defaultMenuType].secondary,
  });
  const resetMenuCallbackRef = useRef<(() => void) | null>(null);

  const showBackdropIfNeeded = useCallback(() => {
    if (
      primaryCurrent === MenuShowStateValues.TemporaryShow ||
      secondaryCurrent === MenuShowStateValues.TemporaryShow
    ) {
      setShowBackdrop(true);
    }
  }, [primaryCurrent, secondaryCurrent]);

  const hideBackdropIfNeeded = useCallback(() => {
    if (
      primaryCurrent !== MenuShowStateValues.TemporaryShow &&
      secondaryCurrent !== MenuShowStateValues.TemporaryShow
    ) {
      setShowBackdrop(false);
    }
  }, [primaryCurrent, secondaryCurrent]);

  useEffect(() => {
    if (
      primaryCurrent === MenuShowStateValues.TemporaryShow ||
      secondaryCurrent === MenuShowStateValues.TemporaryShow
    ) {
      setShowBackdrop(true);
    } else {
      setShowBackdrop(false);
    }
  }, [primaryCurrent, secondaryCurrent]);

  useEffect(() => {
    if (primaryCurrent === MenuShowStateValues.Hide) {
      setSecondaryCurrent(MenuShowStateValues.Hide);
    }
  }, [primaryCurrent]);

  useEffect(() => {
    setMenuWidth({
      primary:
        primaryCurrent === MenuShowStateValues.Hide
          ? 0
          : menuDefaultWidth[menuType || defaultMenuType].primary,
      secondary:
        secondaryCurrent === MenuShowStateValues.Hide
          ? 0
          : menuDefaultWidth[menuType || defaultMenuType].secondary,
    });
  }, [menuType, primaryCurrent, secondaryCurrent, menuDefaultWidth, defaultMenuType]);

  const onReset = useCallback((callback: () => void) => {
    resetMenuCallbackRef.current = callback;
    return () => {
      resetMenuCallbackRef.current = null;
    };
  }, []);

  const resetMenu = useCallback(() => {
    setPrimaryCurrent(primaryDefault ? MenuShowStateValues.Show : MenuShowStateValues.Hide);
    setSecondaryCurrent(secondaryDefault ? MenuShowStateValues.Show : MenuShowStateValues.Hide);
    setMenuWidth({
      primary: menuDefaultWidth[menuType || defaultMenuType].primary,
      secondary: menuDefaultWidth[menuType || defaultMenuType].secondary,
    });
    hideBackdropIfNeeded();
    if (resetMenuCallbackRef.current) {
      resetMenuCallbackRef.current();
    }
  }, [primaryDefault, secondaryDefault, menuDefaultWidth, menuType, defaultMenuType, hideBackdropIfNeeded]);

  useEffect(() => {
    resetMenu();
  }, [primaryDefault, secondaryDefault, menuType]);

  useScreenEffect(primaryBreakpoint, useCallback((match: boolean) => {
    setShowMobileButton(!match);
    setPrimaryDefault(match);
  }, []));

  useScreenEffect(secondaryBreakpoint || "2xl", useCallback((match: boolean) => {
    if (secondaryBreakpoint) {
      setSecondaryDefault(match);
    }
  }, [secondaryBreakpoint]));

  const hidePrimaryMenu = useCallback(() => {
    if (primaryCurrent === MenuShowStateValues.TemporaryShow) {
      setPrimaryCurrent(MenuShowStateValues.Hide);
    }
  }, [primaryCurrent]);

  const hideSecondary = useCallback(() => {
    if (secondaryCurrent === MenuShowStateValues.TemporaryShow) {
      setSecondaryCurrent(MenuShowStateValues.Hide);
    }
  }, [secondaryCurrent]);

  const hideMenu = useCallback(() => {
    hidePrimaryMenu();
    hideSecondary();
    hideBackdropIfNeeded();
  }, [hidePrimaryMenu, hideSecondary, hideBackdropIfNeeded]);

  const showSecondary = useCallback(() => {
    setSecondaryCurrent(secondaryDefault ? MenuShowStateValues.Show : MenuShowStateValues.TemporaryShow);
  }, [secondaryDefault]);

  const showInMobile = useCallback(() => {
    setPrimaryCurrent(MenuShowStateValues.TemporaryShow);
    setSecondaryCurrent(MenuShowStateValues.TemporaryShow);
    showBackdropIfNeeded();
  }, [showBackdropIfNeeded]);

  return {
    menuType: menuType || defaultMenuType,
    setMenuType,
    resetMenu,
    showMobileButton,
    menuWidth,
    primaryCurrent,
    secondaryCurrent,
    hideMenu,
    showSecondary,
    hideSecondary,
    showInMobile,
    onReset,
    showBackdrop,
    setShowBackdrop,
  };
}
