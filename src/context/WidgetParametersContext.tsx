import { createContext, useContext, useMemo } from 'react';

export type WidgetParams = {
  widgetId?: string;
  roomId?: string;
  theme?: string,
  userId?: string,
  displayName?: string,
  avatarUrl?: string,
  clientId?: string,
  language?: string,
  baseUrl?: string,
  fallbackBaseUrl?: string,
};

const WidgetParamsContext = createContext<WidgetParams>({});

export function WidgetParamsProvider({ children }: { children: React.ReactNode }) {
  const params = useMemo(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const parsedParams = {
      theme: searchParams.get("theme") ?? undefined,
      userId: searchParams.get("matrix_user_id") ?? undefined,
      displayName: searchParams.get("matrix_display_name") ?? undefined,
      avatarUrl: searchParams.get("matrix_avatar_url") ?? undefined,
      roomId: searchParams.get("matrix_room_id") ?? undefined,
      clientId: searchParams.get("clientId") ?? undefined,
      language: searchParams.get("matrix_client_language") ?? undefined,
      baseUrl:
        searchParams.get("matrix_base_url") !==
        "$org.matrix.msc4039.matrix_base_url"
          ? searchParams.get("matrix_base_url") ?? undefined
          : searchParams.get("fallback_base_url") ?? undefined,
    };
    console.log(parsedParams);
    return parsedParams
  }, []);

  return (
    <WidgetParamsContext.Provider value={params}>
      {children}
    </WidgetParamsContext.Provider>
  );
}

export function useWidgetParams() {
  return useContext(WidgetParamsContext);
}
