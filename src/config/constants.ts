if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is not defined in environment variables");
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_EXPIRES_IN = "15m"; // Access token expira em 15 minutos
export const JWT_REFRESH_EXPIRES_IN = "7d"; // Refresh token expira em 7 dias

// Tags de acesso disponíveis no sistema
export const ACCESS_TAGS = [
  "default",
  "financeiro",
  "rh",
  "diario_de_obra",
  "administrativo",
  "comercial",
  "estoque",
] as const;

export type AccessTag = (typeof ACCESS_TAGS)[number];

export const DEFAULT_PAGE_SIZE = 10;
