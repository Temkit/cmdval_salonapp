import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <AnimatePresence mode="wait">
      <Outlet />
    </AnimatePresence>
  );
}
