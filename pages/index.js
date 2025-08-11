import { useState } from "react";
import {
  Button,
  Container,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleScrape = async () => {
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append("file", file);

    const res = await fetch("/api/scrape", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Scraping failed");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 5, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          EU Partnering Opportunities Scraper
        </Typography>
        <Typography variant="body1" gutterBottom>
          Upload an old Excel file (optional) to skip duplicate POD References.
        </Typography>
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          style={{ margin: "20px 0" }}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleScrape}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Start Scraping"
            )}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
