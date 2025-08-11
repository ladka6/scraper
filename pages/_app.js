import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import Head from "next/head";
import "../styles/globals.css";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
      light: "#ff5983",
      dark: "#9a0036",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#333333",
      secondary: "#666666",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 24px",
          fontWeight: 600,
        },
        contained: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: "rgba(25, 118, 210, 0.1)",
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
  },
});

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={theme}>
      <Head>
        <title>EU Partnering Opportunities Scraper</title>
        <meta
          name="description"
          content="Automatically extract and organize EU partnership opportunities with intelligent data processing"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap"
        />
      </Head>
      <CssBaseline />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
