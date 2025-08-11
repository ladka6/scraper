// pages/index.js
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append("oldFile", file);

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
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Scraper</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Scraping..." : "Start Scraping"}
        </button>
      </form>
    </div>
  );
}
