import { useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  LinearProgress,
} from "@mui/material";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please upload an Excel file or leave blank for fresh scrape.");
    }
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append("file", file);

    const res = await fetch("/api/scrape", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "results.xlsx";
      a.click();
    } else {
      alert("Scraping failed");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Typography variant="h4" gutterBottom>
        EU Partnering Opportunities Scraper
      </Typography>
      <Box>
        <Button variant="contained" component="label" sx={{ mb: 2 }}>
          {file ? file.name : "Upload Old Excel File"}
          <input
            type="file"
            hidden
            accept=".xlsx"
            onChange={handleFileChange}
          />
        </Button>
      </Box>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        Start Scraping
      </Button>
      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </Container>
  );
}
