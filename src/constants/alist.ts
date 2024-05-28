import type { IAListRoute } from "interfaces/alist";

export const IS_ALIST_ENABLED =
  !!process.env.ALIST_URL &&
  !!process.env.ALIST_USERNAME &&
  !!process.env.ALIST_PASSWORD;

export const ALIST_ROUTES = process.env.ALIST_ROUTES
  ? (JSON.parse(process.env.ALIST_ROUTES) as IAListRoute[])
  : [];
