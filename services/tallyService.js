const axios = require("axios");
const fs = require("fs");
const createSalesVoucher = async (order) => {
  try {

    // Convert Date
    const voucherDate = new Date(order.orderDate)
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

      let inventoryXML = "";

for (const product of order.products) {

inventoryXML += `

<ALLINVENTORYENTRIES.LIST>

<STOCKITEMNAME>${product.name}</STOCKITEMNAME>

<ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

<ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>

<ISAUTONEGATE>No</ISAUTONEGATE>

<ISCONFIGURABLE>No</ISCONFIGURABLE>

<STRDISGSTAPPLICABLE>No</STRDISGSTAPPLICABLE>

<CONTENTNEGISPOS>No</CONTENTNEGISPOS>

<DESCRIPTION>${product.description || ""}</DESCRIPTION>

<ACTUALQTY>${product.qty} Nos</ACTUALQTY>

<BILLEDQTY>${product.qty} Nos</BILLEDQTY>

<RATE>${product.rate}/Nos</RATE>

<AMOUNT>${product.totalValue}</AMOUNT>

<GSTOVRDNTYPEOFSUPPLY>Services</GSTOVRDNTYPEOFSUPPLY>

<GSTHSNNAME>${product.hsn}</GSTHSNNAME>

<GSTHSNINFERAPPLICABILITY>As per Masters/Company</GSTHSNINFERAPPLICABILITY>

<GSTRATEINFERAPPLICABILITY>As per Masters/Company</GSTRATEINFERAPPLICABILITY>

<ACCOUNTINGALLOCATIONS.LIST>

<LEDGERNAME>Sales A/c</LEDGERNAME>

<ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

<AMOUNT>${product.totalValue}</AMOUNT>

</ACCOUNTINGALLOCATIONS.LIST>

<BATCHALLOCATIONS.LIST>

<GODOWNNAME>Main Location</GODOWNNAME>

<BATCHNAME>Primary Batch</BATCHNAME>

<DESTINATIONGODOWNNAME>Main Location</DESTINATIONGODOWNNAME>

<INDENTNO></INDENTNO>

<ORDERNO></ORDERNO>

<TRACKINGNUMBER></TRACKINGNUMBER>

<DYNAMICCSTISCLEARED>No</DYNAMICCSTISCLEARED>

<ACTUALQTY>${product.qty} Nos</ACTUALQTY>

<BILLEDQTY>${product.qty} Nos</BILLEDQTY>

<AMOUNT>${product.totalValue}</AMOUNT>

</BATCHALLOCATIONS.LIST>

<RATEDETAILS.LIST>

<GSTRATEDUTYHEAD>CGST</GSTRATEDUTYHEAD>

<GSTRATE>${product.gst/2}</GSTRATE>

</RATEDETAILS.LIST>

<RATEDETAILS.LIST>

<GSTRATEDUTYHEAD>SGST/UTGST</GSTRATEDUTYHEAD>

<GSTRATE>${product.gst/2}</GSTRATE>

</RATEDETAILS.LIST>

<RATEDETAILS.LIST>

<GSTRATEDUTYHEAD>IGST</GSTRATEDUTYHEAD>

<GSTRATE>0</GSTRATE>

</RATEDETAILS.LIST>

</ALLINVENTORYENTRIES.LIST>

`;

}
const companyName = order.companyName;
const addressLine1 = order.address1 || "";
const addressLine2 = order.address2 || "";
const addressLine3 = order.address3 || "";
const gstin = order.gstin || "";
const state = order.state || "";
const pincode = order.pincode || "";
const invoiceNo = order.invoiceNo || order.orderNo;
const salesOrderNo = order.orderNo;
const narration = order.narration || "";



    const xml = `
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>

  <BODY>
    <IMPORTDATA>

      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>

        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
        </STATICVARIABLES>

      </REQUESTDESC>

      <REQUESTDATA>

        <TALLYMESSAGE xmlns:UDF="TallyUDF">

          <VOUCHER
            VCHTYPE="Sales"
            ACTION="Create"
            OBJVIEW="Invoice Voucher View">

            <!-- Customer Address -->
            <ADDRESS.LIST TYPE="String">
              <ADDRESS>${addressLine1}</ADDRESS>
              <ADDRESS>${addressLine2}</ADDRESS>
              <ADDRESS>${addressLine3}</ADDRESS>
            </ADDRESS.LIST>

            <!-- Buyer Address -->
            <BASICBUYERADDRESS.LIST TYPE="String">
              <BASICBUYERADDRESS>${addressLine1}</BASICBUYERADDRESS>
              <BASICBUYERADDRESS>${addressLine2}</BASICBUYERADDRESS>
              <BASICBUYERADDRESS>${addressLine3}</BASICBUYERADDRESS>
            </BASICBUYERADDRESS.LIST>

            <!-- Voucher Dates -->
            <DATE>20260701</DATE>
            <REFERENCEDATE>20260701</REFERENCEDATE>
            <EFFECTIVEDATE>20260701</EFFECTIVEDATE>

            <!-- Party Information -->
            <PARTYNAME>${companyName}</PARTYNAME>
            <PARTYLEDGERNAME>${companyName}</PARTYLEDGERNAME>
            <PARTYMAILINGNAME>${companyName}</PARTYMAILINGNAME>
            <BASICBUYERNAME>${companyName}</BASICBUYERNAME>

            <!-- GST -->
            <GSTREGISTRATIONTYPE>Regular</GSTREGISTRATIONTYPE>
            <CMPGSTREGISTRATIONTYPE>Regular</CMPGSTREGISTRATIONTYPE>
            <PARTYGSTIN>${gstin}</PARTYGSTIN>

            <STATENAME>${state}</STATENAME>
            <CMPGSTSTATE>${state}</CMPGSTSTATE>
            <PLACEOFSUPPLY>${state}</PLACEOFSUPPLY>

            <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
            <PARTYPINCODE>${pincode}</PARTYPINCODE>

            <!-- Invoice -->
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invoiceNo}</VOUCHERNUMBER>

            <!-- Sales Order -->
            <REFERENCE>${salesOrderNo}</REFERENCE>

            <!-- Mode -->
            <VCHENTRYMODE>Item Invoice</VCHENTRYMODE>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>

            <!-- Flags -->
            <ISINVOICE>Yes</ISINVOICE>
            <ISOPTIONAL>No</ISOPTIONAL>
            <ISCANCELLED>No</ISCANCELLED>
            <ISPOSTDATED>No</ISPOSTDATED>
            <ISDELETED>No</ISDELETED>

            <!-- Narration -->
            <NARRATION>${narration}</NARRATION>

            <!-- Inventory entries will come here -->

            ${inventoryXML}
<!-- Inventory Items -->

${order.products.map(product => `
<ALLINVENTORYENTRIES.LIST>

    <STOCKITEMNAME>${product.name}</STOCKITEMNAME>

    <DESCRIPTION>${product.description || ""}</DESCRIPTION>

    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

    <ISLASTDEEMEDPOSITIVE>No</ISLASTDEEMEDPOSITIVE>

    <ISAUTONEGATE>No</ISAUTONEGATE>

    <ISCONFIGURABLE>No</ISCONFIGURABLE>

    <CONTENTNEGISPOS>No</CONTENTNEGISPOS>

    <GSTOVRDNTYPEOFSUPPLY>Services</GSTOVRDNTYPEOFSUPPLY>

    <GSTHSNNAME>${product.hsn}</GSTHSNNAME>

    <ACTUALQTY>${product.qty} Nos</ACTUALQTY>

    <BILLEDQTY>${product.qty} Nos</BILLEDQTY>

    <RATE>${Number(product.rate).toFixed(2)}/Nos</RATE>

    <AMOUNT>${Number(product.totalValue).toFixed(2)}</AMOUNT>

    <BATCHALLOCATIONS.LIST>

        <GODOWNNAME>Main Location</GODOWNNAME>

        <BATCHNAME>Primary Batch</BATCHNAME>

        <DESTINATIONGODOWNNAME>Main Location</DESTINATIONGODOWNNAME>

        <ORDERNO>${order.orderNo}</ORDERNO>

        <TRACKINGNUMBER></TRACKINGNUMBER>

        <ACTUALQTY>${product.qty} Nos</ACTUALQTY>

        <BILLEDQTY>${product.qty} Nos</BILLEDQTY>

        <AMOUNT>${Number(product.totalValue).toFixed(2)}</AMOUNT>

    </BATCHALLOCATIONS.LIST>

    <ACCOUNTINGALLOCATIONS.LIST>

        <LEDGERNAME>Sales A/c</LEDGERNAME>

        <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

        <AMOUNT>${Number(product.totalValue).toFixed(2)}</AMOUNT>

        <CATEGORYALLOCATIONS.LIST>

            <CATEGORY>Primary Cost Category</CATEGORY>

            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

            <COSTCENTREALLOCATIONS.LIST>

                <NAME>CRM Sales</NAME>

                <AMOUNT>${Number(product.totalValue).toFixed(2)}</AMOUNT>

            </COSTCENTREALLOCATIONS.LIST>

        </CATEGORYALLOCATIONS.LIST>

    </ACCOUNTINGALLOCATIONS.LIST>

    <RATEDETAILS.LIST>

        <GSTRATEDUTYHEAD>CGST</GSTRATEDUTYHEAD>

        <GSTRATE>${product.gst / 2}</GSTRATE>

    </RATEDETAILS.LIST>

    <RATEDETAILS.LIST>

        <GSTRATEDUTYHEAD>SGST/UTGST</GSTRATEDUTYHEAD>

        <GSTRATE>${product.gst / 2}</GSTRATE>

    </RATEDETAILS.LIST>

    <RATEDETAILS.LIST>

        <GSTRATEDUTYHEAD>IGST</GSTRATEDUTYHEAD>

        <GSTRATE>${order.isInterState ? product.gst : 0}</GSTRATE>

    </RATEDETAILS.LIST>

</ALLINVENTORYENTRIES.LIST>

`).join("")}
<!-- Party Ledger -->

<LEDGERENTRIES.LIST>

    <LEDGERNAME>${companyName}</LEDGERNAME>

    <ISPARTYLEDGER>Yes</ISPARTYLEDGER>

    <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>

    <AMOUNT>-${Number(order.grossTotal).toFixed(2)}</AMOUNT>

    <BILLALLOCATIONS.LIST>

        <NAME>${order.orderNo}</NAME>

        <BILLTYPE>New Ref</BILLTYPE>

        <AMOUNT>-${Number(order.grossTotal).toFixed(2)}</AMOUNT>

    </BILLALLOCATIONS.LIST>

</LEDGERENTRIES.LIST>

<!-- Sales Ledger -->

<LEDGERENTRIES.LIST>

    <LEDGERNAME>Sales A/c</LEDGERNAME>

    <ISPARTYLEDGER>No</ISPARTYLEDGER>

    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

    <AMOUNT>${Number(order.net).toFixed(2)}</AMOUNT>

</LEDGERENTRIES.LIST>

<!-- CGST -->

${order.cgst > 0 ? `

<LEDGERENTRIES.LIST>

    <LEDGERNAME>Output CGST 9%</LEDGERNAME>

    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

    <AMOUNT>${Number(order.cgst).toFixed(2)}</AMOUNT>

</LEDGERENTRIES.LIST>

` : ""}

<!-- SGST -->

${order.sgst > 0 ? `

<LEDGERENTRIES.LIST>

    <LEDGERNAME>Output SGST 9%</LEDGERNAME>

    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

    <AMOUNT>${Number(order.sgst).toFixed(2)}</AMOUNT>

</LEDGERENTRIES.LIST>

` : ""}

<!-- IGST -->

${order.igst > 0 ? `

<LEDGERENTRIES.LIST>

    <LEDGERNAME>Output IGST 18%</LEDGERNAME>

    <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>

    <AMOUNT>${Number(order.igst).toFixed(2)}</AMOUNT>

</LEDGERENTRIES.LIST>

` : ""}

<!-- Round Off -->

${Number(order.roundoff) !== 0 ? `

<LEDGERENTRIES.LIST>

    <LEDGERNAME>Round Off</LEDGERNAME>

    <ISDEEMEDPOSITIVE>${order.roundoff < 0 ? "Yes" : "No"}</ISDEEMEDPOSITIVE>

    <AMOUNT>${Number(order.roundoff).toFixed(2)}</AMOUNT>

</LEDGERENTRIES.LIST>

` : ""}

<!-- Sales Order Reference -->

<INVOICEORDERLIST.LIST>

    <BASICORDERDATE>${voucherDate}</BASICORDERDATE>

    <ORDERTYPE>Sales Order</ORDERTYPE>

    <BASICPURCHASEORDERNO>${order.orderNo}</BASICPURCHASEORDERNO>

</INVOICEORDERLIST.LIST>

<!-- GST Summary -->

<GST.LIST>

    <PURPOSETYPE>GST</PURPOSETYPE>

</GST.LIST>

<!-- Empty Lists -->

<EWAYBILLDETAILS.LIST></EWAYBILLDETAILS.LIST>

<INVOICEEXPORTLIST.LIST></INVOICEEXPORTLIST.LIST>

<ATTENDANCEENTRIES.LIST></ATTENDANCEENTRIES.LIST>

<ORIGINVOICEDETAILS.LIST></ORIGINVOICEDETAILS.LIST>

<INVOICEINDENTLIST.LIST></INVOICEINDENTLIST.LIST>

<INVOICEDELNOTES.LIST></INVOICEDELNOTES.LIST>

<GSTBUYERADDRESS.LIST></GSTBUYERADDRESS.LIST>

<GSTCONSIGNEEADDRESS.LIST></GSTCONSIGNEEADDRESS.LIST>

</VOUCHER>

</TALLYMESSAGE>

</REQUESTDATA>

</IMPORTDATA>

</BODY>

</ENVELOPE>
`;


// Save XML to file
fs.writeFileSync("salesVoucher.xml", xml);

// Print XML in console
console.log("========== SALES VOUCHER XML ==========");
console.log(xml);
console.log("=======================================");
  const response = await axios.post(
   "https://antarctic-whacky-hastiness.ngrok-free.dev",
    xml,
    {
        headers: {
            "Content-Type": "application/xml"
        }
    }
);

return response.data;
  } catch (err) {
    throw err;
  }
};

module.exports = {
  createSalesVoucher
};