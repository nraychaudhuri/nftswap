import React from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { Moralis } from "moralis";
const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
  light: `${process.env.PUBLIC_URL}/light-theme.css`,
};

const prevTheme = window.localStorage.getItem("theme");

const serverUrl = "https://lsr4tyg35ty1.usemoralis.com:2053/server";
const appId = "pnISdMHbafrlU84mqgeNz121brLV7baAML4VQ1m4";
Moralis.start({ serverUrl, appId });

ReactDOM.render(
  <ThemeSwitcherProvider themeMap={themes} defaultTheme={prevTheme || "light"}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeSwitcherProvider>,
  document.getElementById("root")
);
