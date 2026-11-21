export const CONFIG = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://binalingbing.onrender.com",
  STORAGE_KEYS: {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
  },
  ROUTES: {
    HOME: "/",
    LOGIN: "/login",
    REGISTER: "/register",
    DASHBOARD: "/dashboard",
    PRODUCT: "/product",
    ORDER_ITEM: "/order-item",
  },
  ENDPOINTS: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    CATEGORY: "/category",
    PRODUCT: "/product",
    ORDER_ITEM: "/order_item",
  },
} as const;