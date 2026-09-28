import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/context/AuthContext";

export const renderWithProviders = (ui: ReactElement, options?: RenderOptions) =>
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <AuthProvider>{ui}</AuthProvider>
    </SWRConfig>,
    options,
  );
