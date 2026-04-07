const { chromium } = require("playwright");

const generateProposalPDF = async (data) => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  const html = `...YOUR SAME HTML TEMPLATE...`;

  await page.setContent(html, { waitUntil: "load" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();

  return pdfBuffer;
};

module.exports = generateProposalPDF;