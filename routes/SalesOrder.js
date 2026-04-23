const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const SalesOrder = require("../models/SalesOrder.js")
const opp = require("../models/Proposal"); // import model
const generatePDF = require("../utils/generateInvoice.js");
/* ✅ VALIDATION FUNCTION */

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

/* ========================= */
/* ✅ CREATE */
/* ========================= */

router.post("/", async (req, res) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ message: error });

    const order = new SalesOrder(req.body);
    await order.save();

    // ✅ UPDATE PROPOSAL STATUS
await opp.findOneAndUpdate(
  { proposalId: req.body.opid },   // ✅ match your field
  {
    proposalStatus: true,
    "statusDetails.status": "Close Won",
    "statusDetails.statusDate": new Date().toISOString().split("T")[0]
  }
);
    res.status(201).json({
      success: true,
      message: "Created & Proposal Closed Won",
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
    const html = `
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
            font-family: Arial, sans-serif;
            font-size: 11px;
            background: #f0f0f0;
            padding: 20px;
        }

        .invoice-container {
           width: 171mm;
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 10mm;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .invoice-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            padding: 8px;
            /* border: 0.5px solid #00000061; */
            border-bottom: none;
        }

        .header-section {
            display: flex;
            border: 0.5px solid #00000061;;
            height: 120px;
        }

        .company-info {
            width: 50%;
            padding: 8px;
            border-right: 0.5px solid #00000061;
            font-size: 10px;
            line-height: 1.4;
        }

        .company-info strong {
            font-size: 12px;
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
            border-bottom: 0.5px solid #00000061;
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
            display: grid;
            grid-template-columns: 1fr 1fr;
            font-size: 10px;
        }

        .order-details > div {
            padding: 5px 8px;
            border-bottom: 0.5px solid #00000061;
        }

        .order-details > div:nth-child(odd) {
            border-right: 0.5px solid #00000061;
        }

    

        .buyer-section {
            border: 0.5px solid #00000061;
            border-top: none;
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
            font-size: 10px;
            line-height: 1.5;
            border-right: 0.5px solid #00000061;
        }

        .buyer-info strong {
            font-size: 11px;
        }

        .purchase-order {
            width: 50%;
        }

        .purchase-order > div {
            padding: 5px 8px;
            border-bottom: 0.5px solid #00000061;
            font-size: 10px;
        }

        .purchase-order > div:last-child {
            border-bottom: none;
        }

        .contact-section {
            display: flex;
            border: 0.5px solid #00000061;
            border-top: none;
        }

        .contact-info {
            width: 50%;
            padding: 8px;
            font-size: 10px;
            line-height: 1.6;
            border-right: 0.5px solid #00000061;
        }

        .empty-section {
            width: 50%;
        }

        /* Invoice Table */
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            border: 0.5px solid #00000061;
            border-top: none;
            font-size: 10px;
            height: 300px;
        }

        .invoice-table th {
            background: #f5f5f5;
            padding: 6px 4px;
            border: 0.5px solid #00000061;
            text-align: center;
            font-weight: bold;
        }

        .invoice-table td {
            padding: 6px 4px;
            border: 0.5px solid #00000061;
            vertical-align: top;
        }

        .invoice-table .sl-no {
            width: 30px;
            text-align: center;
        }

        .invoice-table .description {
            width: 370px;
        }

        .invoice-table .qty {
            width: 60px;
            text-align: center;
        }

        .invoice-table .rate {
            width: 70px;
            text-align: right;
        }

        .invoice-table .disc {
            width: 50px;
            text-align: center;
        }

        .invoice-table .amount {
            width: 80px;
            text-align: right;
        }

        .item-description {
            font-weight: bold;
        }

        .item-sub {
            font-size: 9px;
            color: #333;
            font-style: italic;
        }

        .tax-row td {
            text-align: right;
            padding-right: 10px;
        }

        .total-row {
            background: #f5f5f5;
            font-weight: bold;
            height: 1px;
        }

        .grand-total {
            background: #ffffcc;
            font-weight: bold;
            font-size: 12px;
        }

        .amount-words {
            border: 0.5px solid #00000061;
            border-top: none;
            padding: 6px 8px;
            font-size: 10px;
        }

        .amount-words strong {
            color: #000;
        }

        /* HSN Table */
        .hsn-table {
            width: 100%;
            border-collapse: collapse;
            border: 0.5px solid #00000061;
            border-top: none;
            font-size: 9px;
        }

        .hsn-table th, .hsn-table td {
            padding: 4px;
            border: 0.5px solid #00000061;
            text-align: center;
        }

        .hsn-table th {
            background: #f5f5f5;
        }

        .tax-words {
            border: 0.5px solid #00000061;
            border-top: none;
            padding: 6px 8px;
            font-size: 10px;
        }

        /* Footer Section */
        .footer-section {
            display: flex;
            border: 0.5px solid #00000061;
            border-top: none;
            font-size: 10px;
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
            padding: 8px;
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
            font-size: 9px;
            margin-top: 10px;
        }

        .declaration strong {
            text-decoration: underline;
        }

        .signature-area {
              border-bottom: none;
    border-top: 0.5px solid #00000061;
    border-left: 0.5px solid #00000061;
            text-align: right;
            margin-top: 30px;
            padding: 8px;
            font-weight: bold;
        }

        .auth-signatory {
            margin-top: 40px;
            font-size: 10px;
        }

        .computer-generated {
            text-align: center;
            padding: 8px;
            /* border: 0.5px solid #00000061; */
            border-top: none;
            font-size: 10px;
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
                <strong>MS ERPWALE PVT. LTD.</strong><br>
                Flat No. J-201, Sai Avishkar, Sr.No 12/5/9<br>
                BH Omega, Haveli, Dhayari, Pune 411041<br>
                GSTIN/UIN: 27AATCM3926B1ZC<br>
                State Name : Maharashtra, Code : 27<br>
                Contact : 7447893001<br>
                E-Mail : info@erpwale.com
            </div>
            <div class="logo-order-section">
                <div class="logo-area">
                    <div class="logo">
                        <svg width="60" height="60" viewBox="0 0 100 100">
                            <defs>
                                <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#1a237e"/>
                                    <stop offset="100%" style="stop-color:#5c6bc0"/>
                                </linearGradient>
                            </defs>
                            <!-- Top face -->
                            <polygon points="50,10 90,30 50,50 10,30" fill="#7986cb"/>
                            <!-- Left face -->
                            <polygon points="10,30 50,50 50,90 10,70" fill="#3949ab"/>
                            <!-- Right face -->
                            <polygon points="50,50 90,30 90,70 50,90" fill="#1a237e"/>
                        </svg>
                        <div>
                            <div class="logo-text">ERPWALE</div>
                            <div class="logo-subtext">PRIVATE LIMITED</div>
                        </div>
                    </div>
                </div>
                <div class="order-details">
                    <div>Sales Order Number

                        <div><strong>SO/ERP/26-27/001</strong></div>
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
                   <div>Buyer's Purchase Order No.
                        <div>&nbsp;</div>
                    
                   </div>
                   
                    
                    <div>Dated.

                            <div>&nbsp;</div>
                    </div>
                    
                    
                </div>
                </div>
            </div>
            <div class="buyer-section">
                
                <div class="buyer-content">
                    <div class="buyer-info">
                        <div> <strong>Bill To</strong></div>
                        <strong>DECCAN WATER TREATMENT PVT LTD</strong><br>
                        S.No.32, Behind Relax Hotel, Near Hari, Om Seri, Old<br>
                        Kharadi-Mundhwa Road, Pune, Vadgaon Sheri<br>
                        GSTIN/UIN&nbsp;&nbsp;&nbsp;&nbsp;: 27AABCD9828K1Z7<br>
                        State Name&nbsp;&nbsp;: Maharashtra, Code : 27<br>
                        Place of Supply : Maharashtra
                       
                    <div style="margin-top: 10px;">
                        Contact person&nbsp;&nbsp;&nbsp;: <strong>SHARAD MORE</strong><br>
                        Contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: +91-8600141872<br>
                        E-Mail&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: deccan_watersaccount@yahoo.com
                    </div>
                    </div>
                
            </div>
                </div>





                <table class="invoice-table">
                    <thead>
                        <tr>
                            <th class="sl-no">SI<br>No.</th>
                            <th class="description">Description of<br>Services</th>
                            <th class="qty">Quantity</th>
                            <th class="rate">Rate</th>
                            <th>per</th>
                            <th class="disc">Disc. %</th>
                            <th class="amount">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="sl-no">1</td>
                            <td>
                                <div class="item-description">Tally Software Customization</div>
                                <div class="item-sub">Last Purchase Rate POP Up in<br>Material Out Voucher - Tally Prime 7.0</div>
                                <br><br><br>
                                <div style="text-align: right; padding-right: 20px;">
                                    <strong>Output CGST 9%</strong><br>
                                    <strong>Output SGST 9%</strong>
                                </div>
                            </td>
                            <td class="qty">1 Nos</td>
                            <td class="rate">3,600.00</td>
                            <td style="text-align: center;">Nos
                                 <br><br><br>
                                    <div style="text-align: right; padding-top: 20px;">9 <br>9 </div>
                            </td>
                            <td class="disc">25 %
                                <br><br><br>
                                <div style="text-align: left; padding-top: 20px;">%<br>%</div>

                            </td>
                            <td class="amount">2,700.00<br><br><br><br><br><br><br>243.00<br>243.00</td>
                        </tr>
                       
                        <tr class="total-row">
                            <td colspan="2" style="text-align: right; padding-right: 10px;">Total</td>
                            <td style="text-align: center;">1 Nos</td>
                            <td colspan="3"></td>
                            <td class="amount" style="font-size: 12px;">₹ 3,186.00</td>
                        </tr>
                    </tbody>
                </table>
        
                <!-- Amount in Words -->
                <div class="amount-words">
                    Amount Chargeable (in words)<br>
                    <strong>INR Three Thousand One Hundred Eighty Six Only</strong>
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
                            <table>
                                <tr>
                                    <td>Bank Name</td>
                                    <td>: <strong>SBI Bank</strong></td>
                                </tr>
                                <tr>
                                    <td>A/c No.</td>
                                    <td>: 44294074252</td>
                                </tr>
                                <tr>
                                    <td>Branch & IFS Code</td>
                                    <td>: Mveda Solapur & SBIN0007156</td>
                                </tr>
                            </table>
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



    `;

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