const puppeteer = require("puppeteer");

const generatePDF = async (htmlContent) => {
  const browser = await puppeteer.launch({
    headless: "new"
  });

  const page = await browser.newPage();

  await page.setContent(htmlContent, {
    waitUntil: "networkidle0"
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "10mm",
      bottom: "10mm",
      left: "10mm",
      right: "10mm"
    }
  });

  await browser.close();

  return pdfBuffer;
};

module.exports = generatePDF;