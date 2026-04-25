const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SalesOrder = require("../models/SalesOrder.js")
const opp = require("../models/Proposal"); // import model
const generatePDF = require("../utils/generateInvoice.js");
/* ✅ VALIDATION FUNCTION */
const fs = require("fs");
const path = require("path");
const Ledger = require("../models/Ledger.js");

const logoPath = path.join(__dirname, "../assets/erplogo.jpeg");
const logoBase64 = fs.readFileSync(logoPath, "base64");
const validate = (body) => {
  const {
    partyName,
    address,
    gstin,
    priceLevel,
    businessLine,
    userName,
    salesTeam,
    orderNo,
    orderDate,
    products,
    cgst,
    sgst,
    net
  } = body;

  if (
    !partyName ||
    !address ||
    !gstin ||
    !priceLevel ||
    !businessLine ||
    !userName ||
    !salesTeam ||
    !orderNo ||
    !orderDate
  ) {
    return "All fields required except narration";
  }

  if (!products || products.length === 0) {
    return "Products required";
  }

  for (let p of products) {
    if (!p.name || !p.qty || !p.rate) {
      return "Invalid product data";
    }
  }

  if (cgst < 0 || sgst < 0 || net < 0) {
    return "Invalid tax/net";
  }

  return null;
};
const converter = require("number-to-words");
const globalcompany = require("../models/globalcompany.js");
/* ========================= */
/* ✅ CREATE */
/* ========================= */

router.post("/", async (req, res) => {
  try {
    const { opid, partyName } = req.body;

    // ✅ 1. FETCH PROPOSAL
    const proposal = await opp.findOne({ proposalId: opid });
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    // ✅ 2. FETCH LEDGER (IMPORTANT)
    const ledger = await Ledger.findOne({ companyName: partyName });
    if (!ledger) {
      return res.status(404).json({ message: "Ledger not found" });
    }

    // ✅ 3. CREATE FULL SALES ORDER DATA
    const salesOrderData = {
      // 🔹 Proposal
      proposalId: proposal.proposalId,
      companyName: ledger.companyName,
      priceLevel: proposal.priceLevel,
      businessLine: proposal.businessLine,
      tallySerials: proposal.tallySerials,

      // 🔹 Ledger
    //   companyId: ledger.companyId,

      contactName: ledger.contactName,
      contactMobile: ledger.contactMobile,
      contactEmail: ledger.contactEmail,

      address1: ledger.address1,
      address2: ledger.address2,
      address3: ledger.address3,
      state: ledger.state,
      district: ledger.district,
      city: ledger.city,
      pincode: ledger.pincode,

      gstType: ledger.gstType,
      gstin: ledger.gstin,
      pan: ledger.pan,
      tan: ledger.tan,
      msme: ledger.msme,

      // 🔹 Order Info (frontend)
      orderNo: req.body.orderNo,
      orderDate: req.body.orderDate,
      userName: req.body.userName,
      salesTeam: req.body.salesTeam,

      // 🔹 Products (from proposal)
      products: proposal.products,

      // 🔹 Financials (from proposal OR frontend if needed)
      discount: proposal.discount,
      grossTotal: proposal.total,
      cgstPercent: proposal.cgstPercent,
      sgstPercent: proposal.sgstPercent,
      cgst: proposal.cgst,
      sgst: proposal.sgst,
      roundoff: proposal.roundOff,
      subtotal: proposal.subtotal,
      net: proposal.net,

      // 🔹 Terms
      internalTerms: proposal.internalTerms,
      specialTerms: proposal.specialTerms,

      // 🔹 Bank
      bankDetails: proposal.bankDetails,

      // 🔹 Extra
      narration: req.body.narration || ""
    };

    // ✅ 4. SAVE
    const order = new SalesOrder(salesOrderData);
    await order.save();

    // ✅ 5. UPDATE PROPOSAL STATUS
    await opp.findOneAndUpdate(
      { proposalId: opid },
      {
        proposalStatus: true,
        "statusDetails.status": "Close Won",
        "statusDetails.statusDate": new Date()
          .toISOString()
          .split("T")[0]
      }
    );

    res.status(201).json({
      success: true,
      message: "Sales Order Created with Full Data ✅",
      data: order
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/* ========================= */
/* ✅ GET ALL */
/* ========================= */

router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, businessLine, search } = req.query;

    let filter = {};

    // ✅ 1. DATE FILTER (based on createdAt)
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // ✅ 2. BUSINESS LINE FILTER
    if (businessLine) {
      filter.businessLine = businessLine;
    }

    // ✅ 3. SEARCH (Order No + Party Name)
    if (search) {
      filter.$or = [
        { orderNo: { $regex: search, $options: "i" } },
        { partyName: { $regex: search, $options: "i" } },
      ];
    }

    const data = await SalesOrder.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/business-lines", async (req, res) => {
  try {
    const lines = await SalesOrder.distinct("businessLine");

    res.json({
      success: true,
      data: lines
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});







router.get("/invoice-pdf", async (req, res) => {
  try {
      const { ordid } = req.query;
    console.log({ordid});
const companyData = await globalcompany.findOne();

const company = {
  companyName: companyData?.companyName || "",
  gstin: companyData?.gstin || "",
  phone: companyData?.phone || "",
  email: companyData?.email || "",
  address: {
    line1: companyData?.address?.line1 || "",
    line2: companyData?.address?.line2 || "",
    // line3: companyData?.address?.line3 || "",
    state: companyData?.address?.state || "",
    city: companyData?.address?.city || "",
    pincode: companyData?.address?.pincode || ""
  }
};
    
   const order = await SalesOrder.findOne({ orderNo: ordid });
    console.log(order);
     if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
const total = Number(order.grossTotal);
console.log(order.grossTotal)
const amountInWords =
  total && !isNaN(total)
    ? "INR " +
      converter.toWords(total).replace(/^\w/, c => c.toUpperCase()) +
      " Only"
    : "INR Zero Only";
    // const formattedAddress = formatAddress(order.address);

    const totalQty = (order.products || []).reduce((sum, item) => {
      return sum + Number(item.qty || 0);
    }, 0);

    console.log("Total Qty:", totalQty);
    console.log("Amount in Words:", amountInWords);

console.log(totalQty);
    const html=`
    
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proforma Invoice</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family:Arial, sans-serif;
            font-size: 11px;
            background: #f0f0f0;
            padding: 20px;
        }

        .invoice-container {
           width: 200mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 09mm;
           /* box-shadow: 0 0 10px rgba(0,0,0,0.1);*/
        }

        .invoice-title {
            text-align: center;
            font-size: 15px;
            font-weight: bold;
            padding: 8px;
            /* border: 0.5px solid #00000061; */
            border-bottom: none;
        }

        .header-section {
            display: flex;
            border: 0.3px solid #00000061;;
            height: 130px;
        }

        .company-info {
            width: 50%;
            padding: 10px;
            border-right: 0.3px solid #00000061;
            font-size: 12px;
            line-height: 1.3;
        }

        .company-info strong {
            font-size: 14px;
        }

        .logo-order-section {
            width: 50%;
            display: flex;
            flex-direction: column;
        }

        .logo-area {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
            /* border-bottom: 0.5px solid #00000061; */
            min-height: 119px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .logo-cube {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #1a237e 0%, #3949ab 50%, #7986cb 100%);
            position: relative;
            transform: rotate(-10deg);
        }

        .logo-text {
            font-size: 20px;
            font-weight: bold;
            color: #1a237e;
        }

        .logo-subtext {
            font-size: 8px;
            color: #666;
            letter-spacing: 2px;
        }

        .order-details {
			padding-top:10px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            font-size: 12px;
			
        }

        .order-details > div {
            padding: 3px 8px;
            border-bottom: 0.3px solid #00000061;
			line-height: 1.5;
        }

        .order-details > div:nth-child(odd) {
            border-right: 0.3px solid #00000061;
			
        }

    

        .buyer-section {
            border: 0.3px solid #00000061;
            border-top: none;
            border-bottom: none;
        }

        .buyer-header {
            /* background: #f5f5f5; */
            padding: 1px 5px;
            font-weight: bold;
            font-size: 10px;
            
            /* border-bottom: 0.5px solid #00000061; */
        }

        .buyer-content {
            display: flex;
        }

        .buyer-info {
            width: 50%;
            padding: 8px;
           font-size: 12px;
            line-height: 1.3;
            border-right: 0.3px solid #00000061;
        }

        .buyer-info strong {
            font-size: 14px;
			
        }

        .purchase-order {
            width: 50%;
        }

        .purchase-order > div {
            padding: 5px 8px;
            border-bottom: 0.3px solid #00000061;
            font-size: 10px;
        }

        .purchase-order > div:last-child {
            border-bottom: none;
        }

        .contact-section {
            display: flex;
            border: 0.3px solid #00000061;
            border-top: none;
        }

        .contact-info {
            width: 50%;
            padding: 8px;
            font-size: 10px;
            line-height: 1.6;
            border-right: 0.3px solid #00000061;
        }

        .empty-section {
            width: 50%;
        }

     .invoice-table {
    width: 100%;
    border-collapse: collapse;
    border: 0.3px solid #00000061;
}

/* ✅ Header */
.invoice-table th {
    padding: 3px 4px;
    border: 0.3px solid #00000061;
    text-align: center;
    font-weight: bold;
}

/* ✅ Body rows (only vertical borders) */
.invoice-table td {
    padding: 6px 4px;
    vertical-align: top;

    border-left: 0.3px solid #00000061;
    border-right: 0.3px solid #00000061;

    border-top: none;
    border-bottom: none;
}

/* ✅ Last row → add bottom border */
.invoice-table tr:last-child td {
    border-bottom: 0.3px solid #00000061;
}
        .invoice-table .sl-no {
            width: 30px;
            text-align: center;
        }

        .invoice-table .description {
            width: 340px;
        }

        .invoice-table .qty {
            width: 60px;
            text-align: center;
        }

        .invoice-table .rate {
            width: 70px;
            text-align: center;
        }

        .invoice-table .disc {
            width: 70px;
            text-align: center;
        }

        .invoice-table .amount {
            width: 80px;
            text-align: center;
        }

        .item-description {
            font-weight: bold;
			
        }

        .item-sub {
            font-size:11px;
            color: #333;
            font-style: italic;
			padding-top:4px;
			line-height:1.4;
        }

        .tax-row td {
            text-align: right;
            padding-right: 10px;
        }

        .total-row {
            
            font-weight: bold;
            height: 1px;
        }

        .grand-total {
            
            font-weight: bold;
            font-size: 12px;
        }

        .amount-words {
            border: 0.3px solid #00000061;
            border-top: none;
            border-bottom: none;
            padding: 12px 8px;
            font-size: 12px;
        }

        .amount-words strong {
            color: #000;
			
        }

        /* HSN Table */
        .hsn-table {
            width: 100%;
            border-collapse: collapse;
            border: 0.3px solid #00000061;
            border-top: none;
            font-size: 12px;
        }

        .hsn-table th, .hsn-table td {
            padding: 0.7px;
            border: 0.3px solid #00000061;
            text-align: center;
        }

        .hsn-table th {
            
        }

        .tax-words {
            border: 0.3px solid #00000061;
            border-top: none;
            border-bottom: none;
            padding: 12px 8px;
            font-size: 12px;
        }

        /* Footer Section */
        .footer-section {
            display: flex;
            border: 0.3px solid #00000061;
            border-top: none;
            font-size: 12px;
			
        }

        .footer-left {
            width: 50%;
            padding: 8px;
                margin-top: 80px;
            /* border-right: 0.5px solid #00000061; */
        }

        .footer-right {
            width: 50%;
            /* padding: 8px; */
        }

        .bank-details {
            padding: 4px;
            margin-bottom: -36px;
        }

        .bank-details table {
            width: 100%;
        }

        .bank-details td {
            padding: 2px 0;
        }

        .bank-details td:first-child {
            width: 100px;
        }

        .declaration {
            font-size: 12px;
            margin-top: 10px;
        }

        .declaration strong {
            text-decoration: underline;
        }

        .signature-area {
              border-bottom: none;
    border-top: 0.3px solid #00000061;
    border-left: 0.3px solid #00000061;
            text-align: right;
            margin-top: 45px;
            padding: 10px;
            font-weight: bold;
        }

        .auth-signatory {
            margin-top: 40px;
            font-size: 12px;
        }

        .computer-generated {
            text-align: center;
            padding: 8px;
            /* border: 0.5px solid #00000061; */
            border-top: none;
            font-size: 12px;
            font-style: italic;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }
            .invoice-container {
                box-shadow: none;
                padding: 5mm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Title -->
        <div class="invoice-title">PROFORMA INVOICE</div>

        <!-- Header Section -->
        <div class="header-section">
            <div class="company-info">
                <strong>${company.companyName}</strong><br>
                ${company.address.line1}<br>
                   ${company.address.line2}<br>

                GSTIN/UIN &nbsp;&nbsp;&nbsp;&nbsp; :${company.gstin}<br>
                State Name &nbsp;&nbsp;&nbsp;&nbsp;:${company.address.state}, Code : 27<br>
                Contact &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;:${company.phone}<br>
                E-Mail &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp:${company.email}
            </div>
            <div class="logo-order-section">
                <div class="logo-area">
                  <div class="logo">
   <img src="data:image/png;base64,${logoBase64}" width="260" />
 
</div>
                </div>
                <div class="order-details">
                    <div>Sales Order Number

                        <div><strong>${order.orderNo}</strong></div>
                    </div>
                    <div>Dated

                        <div><strong>20-Apr-26</strong></div>
                    </div>
                    
                    
                    <div>Reference No. & Date.  
                        <div>&nbsp;</div>
                    </div>
                    <div>Other References
                       <div>&nbsp;</div>
                    </div>
                   <div>Buyer's PO No.
                        <div>&nbsp;</div>
                    
                   </div>
                   
                    
                    <div>Dated

                            <div>&nbsp;</div>
                    </div>
                    
                    
                </div>
                </div>
            </div>
            <div class="buyer-section">
                
                <div class="buyer-content">
                    <div class="buyer-info">
                        <div>Buyer (Bill to)</div>
                        <strong>${order.companyName}</strong><br>
                       ${order.address1}<br>
                       ${order.address2}<br>
                       ${order.address3}<br>
                        GSTIN/UIN&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:${order.gstin}<br>
                        State Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${order.state}, Code : 27<br>
                        Place of Supply : Maharashtra
                       
                    <div style="margin-top: 10px;">
                        Contact person&nbsp;&nbsp;&nbsp;: ${order.contactName}<br>
                        Contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${order.contactMobile}<br>
                        E-Mail&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: ${order.contactEmail}
                    </div>
                    </div>
                
            </div>
                </div>





                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th class="sl-no">SI<br>No.</th>
                            <th class="description">Description of Services</th>
                            <th class="hsn">HSN/SAC</th>
                            <th class="qty">Quantity</th>
                            <th class="rate">Rate</th>
                            <th>per</th>
                            <th class="disc">Discount</th>
                            <th class="amount">Amount</th>
                        </tr>
                    </thead>
                    <tbody>


                 ${order.products.map((item, i) => {

    
  const cgstPercent = item.gst / 2;
  const sgstPercent = item.gst / 2;

  const cgstValue = (item.gstValue || 0) / 2;
  const sgstValue = (item.gstValue || 0) / 2;

  const amount = item.qty * item.rate;

  return `
<tr>
  <td>${i + 1}</td>

  <td>
    <div class="item-description">${item.name}</div>
    <div class="item-sub">${item.description}</div>

  

  </td>

  <!-- ✅ FIX HSN -->
  <td class="hsn">${item.hsn || "-"}</td>

  <td>${item.qty}</td>
  <td>${item.rate}</td>

  <td style="text-align: center;">
    Nos

  </td>

  <td class="disc">
    ${item.discount || 0}
   
  </td>

  <td class="amount">
    ${amount.toFixed(2)}
   
  </td>
</tr>
<tr  style="border-top:none;">
  <td></td>

  <td>
    <div style="text-align: right; padding-right: 20px;">
      <strong>Output CGST ${cgstPercent}%</strong><br>
      <strong>Output SGST ${sgstPercent}%</strong>
      <br><br><br>
    </div>
  </td>

  <!-- ✅ FIX HSN -->
  <td class="hsn"></td>

  <td></td>
  <td></td>

  <td style="text-align: center;">
   
  </td>

  <td class="disc">
  
  </td>

  <td class="amount">
    
    <strong>${cgstValue.toFixed(2)}</strong><br>
    <strong>${sgstValue.toFixed(2)}</strong>
     <br><br><br>
  </td>
</tr>
`;
}).join("")}
                    

                      
                       
                        <tr class="total-row">
                            <td>    </td>
                            <td colspan="1" style="text-align: right; padding-right: 10px;">Total</td>
                            <td></td>
                            <td style="text-align: center;">${totalQty}Nos</td>
                            <td ></td>
                            <td ></td>
                            <td></td>
                            <td class="amount" style="font-size: 12px;">₹ ${order.grossTotal}</td>
                        </tr>
                    </tbody>
                </table>
        
                <!-- Amount in Words -->
                <div class="amount-words">
                    Amount Chargeable (in words)<br>
                    <strong>${amountInWords} </strong>
                    <span style="float: right;">E. & O.E</span>
                </div>
        
                <!-- HSN/SAC Table -->
                <table class="hsn-table">
                    <thead>
                        <tr>
                            <th rowspan="3">HSN/SAC</th>
                            <th rowspan="2">Taxable<br>Value</th>
                            <th colspan="2">CGST</th>
                            <th colspan="2">SGST/UTGST</th>
                            <th rowspan="2">Total<br>Tax Amount</th>
                        </tr>
                        <tr>
                            <th>Rate</th>
                            <th>Amount</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>997331</td>
                            <td>2,700.00</td>
                            <td>9%</td>
                            <td>243.00</td>
                            <td>9%</td>
                            <td>243.00</td>
                            <td>486.00</td>
                        </tr>
                        <tr style="font-weight: bold;">
                            <td>Total</td>
                            <td>2,700.00</td>
                            <td></td>
                            <td>243.00</td>
                            <td></td>
                            <td>243.00</td>
                            <td>486.00</td>
                        </tr>
                    </tbody>
                </table>
        
                <!-- Tax Amount in Words -->
                <div class="tax-words">
                    Tax Amount (in words) : <strong>INR Four Hundred Eighty Six Only</strong>
                </div>
        
                <!-- Footer Section -->
                <div class="footer-section">
                    <div class="footer-left">
                        <div style="margin-bottom: 15px;">
                            Company's PAN&nbsp;&nbsp;&nbsp;&nbsp;: <strong>AATCM3926B</strong>
                        </div>
                        <div class="declaration">
                            <strong>Declaration</strong><br>
                            We declare that this invoice shows the actual price of the<br>
                            goods described and that all particulars are true and correct.
                        </div>
                    </div>
                 
                    <div class="footer-right">
                        <div class="bank-details">
                            <strong>Company's Bank Details</strong>
                           ${order.bankDetails ? `
<table>
    <tr>
        <td>Bank Name</td>
        <td>: <strong>${order.bankDetails.bankName}</strong></td>
    </tr>
    <tr>
        <td>A/c No.</td>
        <td>: ${order.bankDetails.accountNumber}</td>
    </tr>
    <tr>
        <td>Branch & IFSC</td>
        <td>: ${order.bankDetails.branch} & ${order.bankDetails.ifsc}</td>
    </tr>
</table>
` : ''}
                        </div>
                        <div class="signature-area">
                            for MS ERPWALE PVT. LTD.
                            <div class="auth-signatory">Authorised Signatory</div>
                        </div>
                    </div>
                </div>    
                <!-- Computer Generated -->
                <div class="computer-generated">
                    This is a Computer Generated Invoice
                </div>
            </div>
    
            <!-- Contact Section -->
           
    
            <!-- Invoice Table -->
        </div>

        <!-- Buyer Section -->
    </div>
</body>
</html>

    
    
    `
       const pdf = await generatePDF(html);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=invoice.pdf"
    });

    res.send(pdf);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error generating PDF");
  }
});

/* ========================= */
/* ✅ GET ONE */
/* ========================= */

router.get("/:id", async (req, res) => {
  try {
    const data = await SalesOrder.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========================= */
/* ✅ UPDATE */
/* ========================= */

router.put("/:id", async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const updated = await SalesOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      success: true,
      message: "Updated",
      data: updated
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========================= */
/* ✅ DELETE */
/* ========================= */

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await SalesOrder.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({
      success: true,
      message: "Deleted"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



module.exports = router;