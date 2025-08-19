import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import "./index.css";

import App from "./App.jsx";
import Auth from "./pages/auth.jsx";
import HomeLayout from "./pages/Home.jsx";
import Games from "./pages/Games.jsx";
import GameDetails from "./pages/GameDetails.jsx";
import Apps from "./pages/Apps.jsx";
import Store from "./pages/Store.jsx";
import Checkout from "./pages/Checkout.jsx";
import Friends from "./pages/Friends.jsx";
import Library from "./pages/Library.jsx";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2196f3",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e",
    },
    text: {
      primary: "#ffffff",
      secondary: "#bbbbbb",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            "linear-gradient(135deg, rgba(44, 24, 66, 0.5), rgba(66, 11, 20, 0.5)), #0f0f0f",
          backgroundAttachment: "fixed",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundColor: "transparent",
          minHeight: "100vh",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "& fieldset": { borderColor: "#2196f3" },
          "&:hover fieldset": { borderColor: "#64b5f6" },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: "#555",
          "&.Mui-active": { color: "#2196f3" },
          "&.Mui-completed": { color: "#4caf50" },
        },
      },
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          {/* Ensure direct /chat URL uses the Friends page within the Home layout */}
          <Route path="/chat" element={<Navigate to="/home/friends" replace />} />
          <Route path="/home" element={<HomeLayout />}>
            <Route index element={<Games />} />
            <Route path="games" element={<Games />} />
            <Route path="games/:gameId" element={<GameDetails />} />
            <Route path="apps" element={<Apps />} />
            <Route path="store" element={<Store />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="friends" element={<Friends />} />
            <Route path="library" element={<Library />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
);
