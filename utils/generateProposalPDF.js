const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const generateProposalPDF = async (data) => {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

const headerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/header.jpg"),
  { encoding: "base64" }
);

const footerBase64 = fs.readFileSync(
  path.join(__dirname, "../assets/footer.jpg"),
  { encoding: "base64" }
);
    const page = await browser.newPage();

    // ✅ CLEAN TERMS
    const cleanTerms = (html) => {
      if (!html) return [];

      let cleaned = html
        .replace(/<span class="ql-ui".*?<\/span>/g, "")
        .replace(/data-list="ordered"/g, "")
        .replace(/datalist="ordered"/g, "");

      const matches = cleaned.match(/<li[^>]*>(.*?)<\/li>/g) || [];

      return matches.map(item =>
        item.replace(/<li[^>]*>/, "").replace(/<\/li>/, "").trim()
      );
    };
const formatDate = (date) => {
  const [month, day, year] = date.split("/");
  const d = new Date(`${year}-${month}-${day}`);

  const dayNum = d.getDate();
  const monthName = d.toLocaleString("en-US", { month: "long" });
  const yearNum = d.getFullYear();

  return `${dayNum}-${monthName}-${yearNum}`;
};
const termsHTML = `
<div style="page-break-before: always;">

  <h3 style= "margin-top:30px">Terms & Conditions</h3>

  ${data.products.map(p => `
    <div style="margin-bottom:10px;">
     
      <div>${p.terms || ""}</div>
    </div>
  `).join("")}

  ${data.internalTerms ? `
    <div><b>Internal Terms</b><br/>${data.internalTerms}</div>
  ` : ""}

  ${data.specialTerms ? `
    <div><b>Special Terms</b><br/>${data.specialTerms}</div>
  ` : ""}

</div>
`;
console.log("termsHTML:", termsHTML);
const maxRows = 10;
const formatAddress = (address) => {
  if (!address) return "";

  const words = address.split(" ");
  const mid = Math.ceil(words.length / 2);

  const line1 = words.slice(0, mid).join(" ");
  const line2 = words.slice(mid).join(" ");

  return `${line1}<br/>${line2}`;
};
const productRows = data.products.map((p, i) => {
 const desc = (p.description || "").replace(
  /\n/g,
  '<br/><br/>'
);

  return `
<tr>
  <td class="center">${i + 1}</td>
  <td class="left">
    <span class="bold">${p.name || ""}</span><br/>
    <p style="font-size:11px; font-weight:400; margin-top:4px;">
      ${desc}
    </p>
  </td>
  <td class="center">${p.qty || ""}</td>
  <td class="right">${p.rate || ""}.00</td>
  <td class="right">${p. subtotal || ""}.00</td>
</tr>
`;
}).join("");
// GROUP GST
// STEP 1: Group products by GST %
const gstGroups = {};

data.products.forEach(p => {
  console.log(p);
  
  const gst = Number(p.gst || 0);
    const gstValue = Number(p.gstValue || 0);
  const subtotal = Number(p.subtotal || 0);

  if (!gstGroups[gst]) {
    gstGroups[gst] = 0;
  }

  gstGroups[gst] += gstValue;
});

// STEP 2: Generate CGST + SGST rows
let totalCgst = 0;
let totalSgst = 0;

const gstRows = Object.keys(gstGroups)
  .sort((a, b) => a - b) // optional (nice order)
  .map(gst => {
    const totalGst = gstGroups[gst]; // ✅ correct variable

    const cgst = totalGst / 2;
    const sgst = totalGst / 2;

    totalCgst += cgst;
    totalSgst += sgst;

    const halfGst = gst / 2;

    return `
<tr>
  <td></td>
  <td class="right">CGST (${halfGst}%)</td>
  <td></td>
  <td></td>
  <td class="right">${cgst.toFixed(2)}</td>
</tr>

<tr>
  <td></td>
  <td class="right">SGST (${halfGst}%)</td>
  <td></td>
  <td></td>
  <td class="right">${sgst.toFixed(2)}</td>
</tr>
`;
  }).join("");
const paymentHTML = `
  <div style="margin-top:20px;">
    <h4>
      Tally Serial No: ${(data.tallySerials || []).join(", ")}
    </h4>
  </div>
`;
const totalProductDiscount = data.products.reduce((sum, p) => {
  return sum + Number(p.discount || 0);
}, 0);
const emptyRows = Array.from({
  length: Math.max(0, maxRows - data.products.length)
}).map((_, i) => `
<tr>
  <td></td>
  <td>&nbsp;</td>
  <td></td>
  <td></td>
  <td></td>
</tr>
`).join("");
    // ✅ HTML TEMPLATE (YOUR FULL TEMPLATE HERE)
    const html = `
<html>
<head>
<style>
@page {
  margin: 100px 20px 20px 20px; /* match your PDF margins */
}

.page-border {
  position: fixed;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  border: 1px solid #112F6D;
  pointer-events: none;
}
  body { font-family:arial; padding: 30px; font-size: 13px;}
 table {
  width: 100%;
  border-collapse: collapse;  /* ✅ FIX */
  table-layout: fixed;
  border: 1px solid #ddd;
}

  th, td {

   border: 1px solid #ddd; 
    padding: 9px;
    font-size: 13px;
  }

  th {
    text-align: center;
    font-weight: bold;
    background: #F5F5F5;
  }

  .left { text-align: left;}
  .center { text-align: center; }
  .right { text-align: right; }
  .bold { font-weight: bold; }

  /* Column widths */
  .col-sr   { width: 8%; }
  .col-part { width: 58%; }  /* 👈 increased */
  .col-qty  { width: 6%; }
  .col-rate { width: 12%; }
  .col-amt  { width: 16%; }

  .footer-section {
  margin-top: 50px;
  font-size: 13px;
}

.signature-row {
  display: flex;
  justify-content: space-between;
  margin-top: 40px;
}

.signature-box {
  width: 45%;
  text-align: center;
}

.signature-line {
  height: 170px;
  border: 1px solid #d8d8d8;
  border-radius: 12px;
  margin-bottom: 10px;
}

.regards {
  margin-top: 40px;
}

.note {
  text-align: center;
  margin-top: 20px;
  font-size: 11px;
}

.bottom-banner {
  margin-top: 0px;
}

.bottom-banner img {
  width: 100%;
}

.signature-container {
  border: 0.5px solid #141414;
  border-radius: 10px;
  padding: 20px;
  margin-top: 40px;
}
  .signature-wrapper {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-top: 60px;
}

.signature-card {
  width: 48%;
  height: 80px;
  border: 0.5px solid #d8d8d8d2;
  border-radius: 25px;

  padding: 20px;
  display: flex;
    flex-direction: column;          
  justify-content: space-between; 
}

.signature-title {
  font-size: 14px;
}
</style>
</head>

<body>
<!-- HEADER -->

<div class="page-border"></div>

<h3 style="text-align:center; padding-bottom:20px;">BUSINESS PROPOSAL</h3>

<div style="display:flex; justify-content:space-between; align-items:flex-start;">

  <!-- Left Side -->
 <div style="margin-top:20px; line-height:1.5; white-space: normal; word-break: keep-all;">
  <b>To,</b><br/>
  <b>${data.companyName?.toUpperCase()}</b><br/>
    ${formatAddress(data.address1)}<br/>
 ${data.district}, ${data.city}</br>
   ${data.state} - ${data.pincode}
</div>

  <!-- Right Side -->
  <div style="padding-bottom:3px; text-align:right;">
    <b>Date:</b>  ${formatDate(data.date)}
  </div>

</div>

<p style="margin: 15px 0 2px 0;">
  Kind Attn : ${data.contactName || ""}
</p>

<p style="margin: 0 0 2px 0;">
  <strong>Subject : Proposal of ${data.businessLine || ""}</strong>
</p>

<table style="margin-top:15px;">
  <thead>
    <tr>
    <th class="col-sr">Sr. No.</th>

    <th class="col-part">Particular</th>
    <th class="col-qty">Qty</th>
    <th class="col-rate">Rate</th>
    <th class="col-amt">Amount (Rs.)</th>
    </tr>
  </thead>

  <tbody>
    ${productRows}
   
 ${totalProductDiscount > 0 ? `
<tr>
  <td></td>
  <td class="right bold">Discount</td>
  <td></td>
  <td></td>
  <td class="right">${totalProductDiscount.toFixed(2)}</td>
</tr>
` : ""}

 
<tr style="background: #F5F5F5;">
  <td></td>
  <td class="right bold">Gross Total</td>
  <td></td>
  <td></td>
  <td class="right">${data.subtotal.toFixed(2)}</td>
</tr>


  ${gstRows}
${data.roundOff !== undefined && data.roundOff !== null  && data.roundOff !== 0 ? `
<tr>
  <td></td>
  <td class="right">Round off</td>
  <td></td>
  <td></td>
  <td class="right">${Number(data.roundOff).toFixed(2)}</td>
</tr>
` : ""}

  <tr style="background: #F5F5F5;">
    <td></td>
      <td class="right bold">Total</td>
    <td></td>
    <td></td>
    <td class="right bold"><b>${data.total || 0}.00</b></td>
  </tr>

  </tbody>
</table>
<div>
${paymentHTML}
<h4 style="margin:0;">Bank Details For NEFT/RTGS/CHEQUE DEPOSIT</h4>

<div style="margin:0;">
  <p style="display:flex;">
    <span style="width:100px;">Account Name</span>
    <span>:   ${data.bankDetails?.holderName || ""}</span>
  </p>

  <p style="display:flex;">
    <span style="width:100px;">Bank Name</span>
    <span>:   ${data.bankDetails?.bankName || ""}</span>
  </p>

  <p style="display:flex;">
    <span style="width:100px;">Acc. Number</span>
    <span>:  ${data.bankDetails?.accountNumber || ""}</span>
  </p>

  <p style="display:flex;">
    <span style="width:100px;">IFSC Code</span>
    <span>:   ${data.bankDetails?.ifsc || ""}</span>
  </p>

  <p style="display:flex;">
    <span style="width:100px;">Branch</span>
    <span>:   ${data.bankDetails?.branch || ""}</span>
  </p>
</div>

  ${termsHTML}

<div style="page-break-before: always; position: relative; height: 700px;">

  <div style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    text-align: center;
  ">

    <!-- SIGNATURE -->
    <div class="signature-wrapper" style="justify-content: center;">

    <div class="signature-card">
  <div class="top-text">For,</div>
  <div class="spacer"></div>
  <div class="bottom-text">MS ERPWale Pvt. Ltd.</div>
</div>

<div class="signature-card">
  <div class="top-text">For,</div>
  <div class="spacer"></div>
  <div class="bottom-text">
    ${data.companyName} / ${data.contactName}
  </div>
</div>

    </div>

    <!-- REGARDS -->
    <!-- REGARDS -->
<div style="margin-top:40px; text-align:left; width:60%; margin-left:20px; margin-right:auto;">
  <b>Regards,</b><br/>
  ${data.userName || ""}<br/>
  ${data.email || ""}<br/>
  ${data.mobile || ""}
</div>
    <!-- NOTE -->
    <p style="margin-top:20px;">
      (Computer Generated Document so Signature not required)
    </p>
  </div>
</div>
</body>
</html>
`;

    await page.setContent(html, { waitUntil: "load" });


      const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,

  margin: {
    top: "120px",
    bottom: "120px"
  },

  headerTemplate: `
    <div style="width:95%; text-align:center; margin-left:22px; margin-right:22px">
     <div style="margin-top:5px;">
      <img src="data:image/jpeg;base64,${headerBase64}" style="width:98%; " />
      </div>
    </div>
  `,

  footerTemplate: `
    <div style="width:95%; text-align:center; margin-left:22px; margin-right:22px">
      <div style="margin-top:5px;">
        <img src="data:image/jpeg;base64,${footerBase64}" style="width:98%; " />
      </div>
    </div>
  `
});

 

    return pdfBuffer;

  } finally {
    if (browser) await browser.close();
  }
};

module.exports = generateProposalPDF;