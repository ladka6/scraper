import { useState } from "react";
import {
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Paper,
  Chip,
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  CloudUpload,
  PlayArrow,
  Description,
  Close,
  Download,
  DataObject,
} from "@mui/icons-material";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => setFile(null);

  const handleScrape = async () => {
    setLoading(true);
    setProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 500);

    try {
      const formData = new FormData();
      if (file) formData.append("file", file);

      const res = await fetch("/api/scrape", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Scraping failed");
      }

      setProgress(100);
      clearInterval(progressInterval);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setSnackbar({
        open: true,
        message: "Scraping completed successfully! File downloaded.",
        severity: "success",
      });
      setFile(null);
    } catch (error) {
      clearInterval(progressInterval);
      setSnackbar({
        open: true,
        message: error?.message || "An unexpected error occurred",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 6 }} className="fade-in-up">
          <DataObject
            sx={{
              fontSize: 80,
              color: "white",
              mb: 2,
              opacity: 0.9,
            }}
            className="float-animation"
          />
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              mb: 2,
            }}
          >
            EU Partnering Opportunities Scraper
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.9)",
              fontWeight: 300,
              maxWidth: 600,
              mx: "auto",
              lineHeight: 1.6,
            }}
          >
            Automatically extract and organize EU partnership opportunities with
            intelligent data processing
          </Typography>
        </Box>

        {/* Main Content Card */}
        <Card
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: "hidden",
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(10px)",
          }}
          className="fade-in-up"
        >
          <CardContent sx={{ p: 4 }}>
            {/* File Upload Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: "#333",
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CloudUpload color="primary" />
                File Upload
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  border: "2px dashed #e0e0e0",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  background: "#fafafa",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    borderColor: "#1976d2",
                    background: "#f5f5f5",
                  },
                }}
              >
                <input
                  type="file"
                  accept=".xlsx"
                  id="file-upload"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                {!file ? (
                  <Box>
                    <CloudUpload
                      sx={{ fontSize: 48, color: "#bdbdbd", mb: 2 }}
                    />
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Upload an existing Excel file to skip duplicate POD
                      References
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Drag & drop or click to select (.xlsx files only)
                    </Typography>
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        disabled={loading}
                        startIcon={<Description />}
                        sx={{ mt: 1 }}
                      >
                        Select Excel File
                      </Button>
                    </label>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      icon={<Description />}
                      label={file.name}
                      variant="outlined"
                      color="primary"
                      sx={{
                        maxWidth: 300,
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                    <Button
                      size="small"
                      onClick={handleClearFile}
                      disabled={loading}
                      color="error"
                      startIcon={<Close />}
                      variant="outlined"
                    >
                      Remove
                    </Button>
                    <label htmlFor="file-upload">
                      <Button
                        size="small"
                        component="span"
                        disabled={loading}
                        variant="text"
                        sx={{ textDecoration: "underline" }}
                      >
                        Change File
                      </Button>
                    </label>
                  </Box>
                )}
              </Paper>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* Action Section */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: "#333",
                  mb: 3,
                }}
              >
                Start Processing
              </Typography>

              {loading && (
                <Box sx={{ mb: 3 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      mb: 1,
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Progress: {Math.round(progress)}%
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleScrape}
                disabled={loading}
                size="large"
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <PlayArrow />
                  )
                }
                className="pulse-on-hover"
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  textTransform: "none",
                  boxShadow: "0 4px 14px 0 rgba(25, 118, 210, 0.4)",
                  "&:hover": {
                    boxShadow: "0 6px 20px 0 rgba(25, 118, 210, 0.6)",
                  },
                }}
              >
                {loading ? "Processing Data..." : "Start Scraping"}
              </Button>

              {!loading && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2, maxWidth: 400, mx: "auto" }}
                >
                  This process will automatically download an Excel file with
                  the scraped partnership opportunities once complete.
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
          icon={snackbar.severity === "success" ? <Download /> : undefined}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
