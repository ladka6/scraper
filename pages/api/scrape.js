import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";
import ExcelJS from "exceljs";
import formidable from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    // Parse file if uploaded
    const form = new formidable.IncomingForm({ keepExtensions: true });
    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const seenPodReferences = new Set();

    if (data.files.file) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(data.files.file.filepath);
      const sheet = workbook.worksheets[0];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          seenPodReferences.add(
            row.getCell(3).value?.text || row.getCell(3).value
          );
        }
      });
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.AWS_REGION
        ? await chromium.executablePath()
        : puppeteer.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();
    await page.goto(
      "https://een.ec.europa.eu/partnering-opportunities?f%5B0%5D=tc%3A3298",
      {
        waitUntil: "networkidle0",
      }
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Partnering Opportunities");
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

        const getDefinition = async (label) =>
          detailPage
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

        const podReference = await getDefinition("POD Reference");
        const shortSummary = await getDefinition("Short Summary");

        if (!podReference || seenPodReferences.has(podReference)) {
          await detailPage.close();
          continue;
        }

        worksheet.addRow({
          link,
          header,
          podReference,
          shortSummary,
        });

        seenPodReferences.add(podReference);
        await detailPage.close();
      }

      const nextSelector =
        "li.ecl-pagination__item.ecl-pagination__item--next a";
      const nextButton = await page.$(nextSelector);
      if (!nextButton || currentPage >= 2) break;

      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle0" }),
        nextButton.click(),
      ]);
      currentPage++;
    }

    await browser.close();

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Disposition", "attachment; filename=results.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.status(500).send("Scraping failed");
  }
}
