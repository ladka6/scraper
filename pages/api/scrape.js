import ExcelJS from "exceljs";
import XLSX from "xlsx";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    // Parse incoming file upload
    const buffers = [];
    const seenPodReferences = new Set();

    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => buffers.push(chunk));
      req.on("end", () => {
        const fileBuffer = Buffer.concat(buffers);

        if (fileBuffer.length > 0) {
          try {
            const workbook = XLSX.read(fileBuffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
            data.forEach((row) => {
              if (row["POD Reference"])
                seenPodReferences.add(row["POD Reference"]);
            });
          } catch (err) {
            console.error("Failed to parse uploaded Excel file:", err);
          }
        }
        resolve();
      });
      req.on("error", reject);
    });

    let browser;

    const isVercel = !!process.env.VERCEL_ENV;
    let puppeteer,
      launchOptions = {
        headless: true,
      };

    if (isVercel) {
      const chromium = (await import("@sparticuz/chromium")).default;
      puppeteer = await import("puppeteer-core");
      launchOptions = {
        ...launchOptions,
        args: chromium.args,
        executablePath: await chromium.executablePath(),
      };
    } else {
      puppeteer = await import("puppeteer");
    }

    // Launch Puppeteer with chrome-aws-lambda
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.goto(
      "https://een.ec.europa.eu/partnering-opportunities?f%5B0%5D=tc%3A3298",
      { waitUntil: "networkidle0" }
    );

    const workbookOut = new ExcelJS.Workbook();
    const worksheet = workbookOut.addWorksheet("Partnering Opportunities");

    worksheet.columns = [
      { header: "Link", key: "link", width: 60 },
      { header: "Header", key: "header", width: 50 },
      { header: "POD Reference", key: "podReference", width: 30 },
      { header: "Short Summary", key: "shortSummary", width: 100 },
    ];
    worksheet.getRow(1).font = { bold: true };

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
          .$eval("h1.ecl-page-header__title span", (el) =>
            el.textContent.trim()
          )
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
        const podRefCell = row.getCell("podReference");
        podRefCell.value = { text: podReference, hyperlink: link };
        podRefCell.font = { color: { argb: "FF0000FF" }, underline: true };

        seenPodReferences.add(podReference);
        await detailPage.close();
      }

      const nextButton = await page.$(
        "li.ecl-pagination__item.ecl-pagination__item--next a"
      );
      if (!nextButton || currentPage >= 2) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        nextButton.click(),
      ]);
      currentPage++;
    }

    await browser.close();

    const buffer = await workbookOut.xlsx.writeBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
