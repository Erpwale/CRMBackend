const { chromium } = require("playwright");

const generatePDF = async (htmlContent) => {
  const browser = await chromium.launch();

  const page = await browser.newPage({
    viewport: { width: 794, height: 1123 } // A4 size
  });

  await page.setContent(htmlContent, {
    waitUntil: "networkidle"
  });

  // Inject print CSS
  await page.addStyleTag({
    content: `
      @page {
        size: A4;
        margin: 0;
      }
      body {
        margin: 0;
      }
    `
  });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: {
      top: "0mm",
      bottom: "0mm",
      left: "0mm",
      right: "0mm"
    }
  });

  await browser.close();

  return pdfBuffer;
};

module.exports = generatePDF;