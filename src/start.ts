import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";

import { getRouter } from "./router";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("The app root element was not found.");
}

const router = getRouter();

createRoot(rootElement).render(createElement(RouterProvider, { router }));
