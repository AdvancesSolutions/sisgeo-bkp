import { cn } from "@/lib/utils";

/**
 * Logo do SIGEO: SVG 91x27.
 * Usado em: header (layout/containers/header.tsx) e página de Login (pages/Login.tsx).
 */
export default function Logo({
  classNameFull,
  classNameMobile,
}: {
  classNameFull?: string;
  classNameMobile?: string;
}) {
  return (
    <>
      <svg
        className={cn("fill-current h-[1.125rem] w-auto", classNameFull)}
        viewBox="0 0 22 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.086 7.38373C22.9713 10.5251 22.9713 16.4749 19.086 19.6163L17.9088 20.5681C14.7542 23.1186 11.225 25.161 7.44727 26.6224C3.24497 28.2481 -1.00316 24.3606 0.21055 20.0001L1.26186 16.223C1.75761 14.4419 1.75761 12.5581 1.26186 10.777L0.210551 6.99993C-1.00315 2.63941 3.24497 -1.24808 7.44727 0.377558C11.225 1.83896 14.7542 3.88142 17.9088 6.43195L19.086 7.38373Z"
          fill="url(#paint0_linear_logo_full)"
        />
        <defs>
          <linearGradient id="paint0_linear_logo_full" x1="11" y1="0" x2="11" y2="27" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: "hsl(var(--primary-light))" }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--primary-dark))" }} />
          </linearGradient>
        </defs>
      </svg>

      <svg
        className={cn("fill-current", classNameMobile)}
        width="22"
        height="27"
        viewBox="0 0 22 27"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19.086 7.38373C22.9713 10.5251 22.9713 16.4749 19.086 19.6163L17.9088 20.5681C14.7542 23.1186 11.225 25.161 7.44727 26.6224C3.24497 28.2481 -1.00316 24.3606 0.21055 20.0001L1.26186 16.223C1.75761 14.4419 1.75761 12.5581 1.26186 10.777L0.210551 6.99993C-1.00315 2.63941 3.24497 -1.24808 7.44727 0.377558C11.225 1.83896 14.7542 3.88142 17.9088 6.43195L19.086 7.38373Z"
          fill="url(#paint0_linear_logo_mobile)"
        />
        <defs>
          <linearGradient id="paint0_linear_logo_mobile" x1="11" y1="0" x2="11" y2="27" gradientUnits="userSpaceOnUse">
            <stop style={{ stopColor: "hsl(var(--primary-light))" }} />
            <stop offset="1" style={{ stopColor: "hsl(var(--primary-dark))" }} />
          </linearGradient>
        </defs>
      </svg>
    </>
  );
}
