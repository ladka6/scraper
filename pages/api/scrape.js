// pages/api/scrape.js
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import ExcelJS from "exceljs";

export const config = {
  api: {
    bodyParser: false, // because we're handling multipart form data
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  // Parse form-data manually
  const formidable = (await import("formidable")).default;
  const form = formidable({ multiples: false });
  const seenPodReferences = new Set();

  const data = await new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) reject(err);

      // If old file uploaded, read old POD References
      if (files.oldFile) {
        const oldWorkbook = new ExcelJS.Workbook();
        await oldWorkbook.xlsx.readFile(files.oldFile[0].filepath);
        const ws = oldWorkbook.worksheets[0];
        ws.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            const podRef = row.getCell("podReference").text?.trim();
            if (podRef) seenPodReferences.add(podRef);
          }
        });
      }
      resolve();
    });
  });

  // Create new Excel workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Partnering Opportunities");
  worksheet.columns = [
    { header: "Link", key: "link", width: 60 },
    { header: "Header", key: "header", width: 50 },
    { header: "POD Reference", key: "podReference", width: 30 },
    { header: "Short Summary", key: "shortSummary", width: 100 },
  ];
  worksheet.getRow(1).font = { bold: true };

  // Launch headless Chromium on Vercel
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  const page = await browser.newPage();
  await page.goto(
    "https://een.ec.europa.eu/partnering-opportunities?f%5B0%5D=tc%3A3298",
    { waitUntil: "networkidle0" }
  );

  let currentPage = 1;
  while (true) {
    const links = await page.$$eval(
      "div.ecl-content-block__title a.ecl-link.ecl-link--standalone",
      (anchors) => anchors.map((a) => a.href)
    );

    for (const link of links) {
      const detailPage = await browser.newPage();
      await detailPage.goto(link, { waitUntil: "networkidle0" });

      const header = await detailPage
        .$eval("h1.ecl-page-header__title span", (el) => el.textContent.trim())
        .catch(() => "");

      async function getDefinition(label) {
        return detailPage
          .$$eval(
            "dt.ecl-description-list__term",
            (terms, targetLabel) => {
              for (let i = 0; i < terms.length; i++) {
                if (terms[i].textContent.trim() === targetLabel) {
                  const dd = terms[i].nextElementSibling;
                  return dd ? dd.textContent.trim() : null;
                }
              }
              return null;
            },
            label
          )
          .catch(() => null);
      }

      const podReference = await getDefinition("POD Reference");
      const shortSummary = await getDefinition("Short Summary");

      if (!podReference || seenPodReferences.has(podReference)) {
        await detailPage.close();
        continue;
      }

      const row = worksheet.addRow({
        link,
        header,
        podReference,
        shortSummary,
      });

      row.getCell("podReference").value = {
        text: podReference,
        hyperlink: link,
      };
      row.getCell("podReference").font = {
        color: { argb: "FF0000FF" },
        underline: true,
      };

      seenPodReferences.add(podReference);
      await detailPage.close();
    }

    const nextSelector = "li.ecl-pagination__item.ecl-pagination__item--next a";
    const nextButton = await page.$(nextSelector);
    if (!nextButton || currentPage >= 2) break;

    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle0" }),
      nextButton.click(),
    ]);
    currentPage++;
  }

  await browser.close();

  // Return Excel as buffer
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader("Content-Disposition", 'attachment; filename="results.xlsx"');
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
}
