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


const companyName = order.companyName;
const addressLine1 = order.address1 || "";
const addressLine2 = order.address2 || "";
const addressLine3 = order.address3 || "";
const gstin = order.gstin || "";
const gstType = order.gstType || "";
const state = order.state || "";
const pincode = order.pincode || "";
const invoiceNo = order.invoiceNo || order.orderNo;
const salesOrderNo = order.orderNo;
const narration = order.narration || "";
const salesPerson = order.userName|| "";
const subtotal=order.subtotal|| "";
const grossTotal = order.grossTotal|| "";
const cgst = order.cgst|| "";
const sgst = order.sgst|| "";
const roundoff=order.roundoff||"";


const ledgerEntries = [
  {
    ledgername: companyName,
    ispartyledger: true,
    amount: `-${order.grossTotal}`,
  },
  {
    ledgername: `Output CGST ${order.products[0].gst / 2}%`,
    amount: order.cgst.toString(),
    vatexpamount: order.cgst.toString(),
  },
  {
    ledgername: `Output SGST ${order.products[0].gst / 2}%`,
    amount: order.sgst.toString(),
    vatexpamount: order.sgst.toString(),
  },
];


const inventoryEntries = order.products.map((product) => ({
 basicuserdescription: [
    {
      metadata: true,
      type: "String",
    },
    ...(product.description
      ? product.description.split("\n")
      : []),
  ],

  stockitemname: product.name,

  gstovrdntaxability: "Taxable",
  gstovrdntypeofsupply: "Services",

  rate: `${product.rate}/Nos`,
  discount: product.discount.toString(),
  amount: product.subtotal.toString(),
  discountamount: (
    (product.rate * product.qty * product.discount) / 100
  ).toString(),

  actualqty: `${product.qty} Nos`,
  billedqty: `${product.qty} Nos`,

  batchallocations: [
    {
      godownname: "Main Location",
      batchname: "Primary Batch",
      orderno: salesOrderNo,
      amount: product.subtotal.toString(),
      actualqty: `${product.qty} Nos`,
      billedqty: `${product.qty} Nos`,
    },
  ],

  accountingallocations: [
    {
      ledgername: "CRM Sales",
      amount: product.subtotal.toString(),
      categoryallocations: [
        {
          category: "Primary Cost Category",
          costcentreallocations: [
            {
              name: "CRM Sales Person",
              amount: product.subtotal.toString(),
            },
          ],
        },
      ],
    },
  ],

  ratedetails: [
    {
      gstratedutyhead: "CGST",
      gstratevaluationtype: "Based on Value",
      gstrate: (product.gst / 2).toString(),
    },
    {
      gstratedutyhead: "SGST/UTGST",
      gstratevaluationtype: "Based on Value",
      gstrate: (product.gst / 2).toString(),
    },
    {
      gstratedutyhead: "IGST",
      gstratevaluationtype: "Based on Value",
      gstrate: product.gst.toString(),
    },
  ],
}));

const json = 
{
"static_variables": [
        {
            "name": "svVchImportFormat",
            "value": "jsonex"
        },
        {
            "name": "svCurrentCompany",
            "value": "Airgital"
        }
    ],

    "tallymessage": [
        {
            "metadata": {
                "type": "Voucher", 
                "vchtype": "Sales Order", 
                "action": "Create", 
                "objview": "Invoice Voucher View"
            }, 
            "address": [
                {
                    "metadata": true, 
                    "type": "String"
                }, 
                addressLine1, 
                addressLine2, 
                addressLine3
            ], 
            "basicbuyeraddress": [
                {
                    "metadata": true, 
                    "type": "String"
                }, 
                addressLine1, 
                addressLine2, 
                addressLine3
            ], 
            "oldauditentryids": [
                {
                    "metadata": true, 
                    "type": "Number"
                }, 
                "-1"
            ], 
            "date": "20260701", 
            "vchstatusdate": "20260701", 
            "guid": "e4bff212-f722-4649-b301-8f1354493d45-0000004a", 
            "gstregistrationtype": gstType, 
            "vatdealertype": gstType, 
            "statename": state, 
            "discountformat": "Both Percentage & Amount", 
            "narration": narration, 
            "countryofresidence": "India", 
            "partygstin": gstin, 
            "placeofsupply": state, 
            "vouchertypename": "Sales Order", 
            "partyname": companyName, 
            "gstregistration": {
                "value": "Maharashtra Registration", 
                "taxtype": "GST", 
                "taxregistration": ""
            }, 
            "partyledgername": companyName, 
            "vouchernumber": "1", 
            "basicbuyername": companyName, 
            "cmpgstregistrationtype": gstType, 
            "reference": salesOrderNo, 
            "partymailingname": companyName, 
            "partypincode": pincode, 
            "consigneegstin": gstin, 
            "consigneemailingname": companyName, 
            "consigneepincode": pincode, 
            "consigneestatename": state, 
            "cmpgststate": state, 
            "consigneecountryname": "India", 
            "basicbasepartyname": companyName, 
            "numberingstyle": "Auto Retain", 
            "cstformissuetype": "\u0004 Not Applicable", 
            "cstformrecvtype": "\u0004 Not Applicable", 
            "fbtpaymenttype": "Default", 
            "persistedview": "Invoice Voucher View", 
            "vchstatustaxadjustment": "Default", 
            "vchstatusvouchertype": "Sales Order", 
            "vchstatustaxunit": "Maharashtra Registration", 
            "vchgstclass": "\u0004 Not Applicable", 
            "costcentrename": "CRM Sales Person", 
            "buyerpinnumber": "AAAAA1111A", 
            "consigneepinnumber": "AAAAA1111A", 
            "vouchertypeorigname": "Sales Order", 
            "diffactualqty": false, 
            "ismstfromsync": false, 
            "isdeleted": false, 
            "issecurityonwhenentered": false, 
            "asoriginal": false, 
            "audited": false, 
            "iscommonparty": false, 
            "forjobcosting": false, 
            "isoptional": false, 
            "effectivedate": "20260701", 
            "useforexcise": false, 
            "isforjobworkin": false, 
            "allowconsumption": false, 
            "useforinterest": false, 
            "useforgainloss": false, 
            "useforgodowntransfer": false, 
            "useforcompound": false, 
            "useforservicetax": false, 
            "isreversechargeapplicable": false, 
            "issystem": false, 
            "isfetchedonly": false, 
            "isgstoverridden": false, 
            "iscancelled": false, 
            "isonhold": false, 
            "issummary": false, 
            "isecommercesupply": false, 
            "isboenotapplicable": false, 
            "isgstsecsevenapplicable": false, 
            "ignoreeinvvalidation": false, 
            "cmpgstisothterritoryassessee": false, 
            "partygstisothterritoryassessee": false, 
            "irnjsonexported": false, 
            "irncancelled": false, 
            "ignoregstconflictinmig": false, 
            "isopbaltransaction": false, 
            "ignoregstformatvalidation": false, 
            "iseligibleforitc": true, 
            "ignoregstoptionaluncertain": false, 
            "isgstrefund": false, 
            "isewaybillexcluded": false, 
            "isbuyerpeppolregistered": false, 
            "isvatoverridden": false, 
            "iseinvoverridden": false, 
            "updatesummaryvalues": false, 
            "isewaybillapplicable": false, 
            "isdeletedretained": false, 
            "isnull": false, 
            "isexcisevoucher": false, 
            "excisetaxoverride": false, 
            "usefortaxunittransfer": false, 
            "isexer1nopoverwrite": false, 
            "isexf2nopoverwrite": false, 
            "isexer3nopoverwrite": false, 
            "ignoreposvalidation": false, 
            "exciseopening": false, 
            "useforfinalproduction": false, 
            "istdsoverridden": false, 
            "istcsoverridden": false, 
            "istdstcscashvch": false, 
            "includeadvpymtvch": false, 
            "issubworkscontract": false, 
            "ignoreorigvchdate": false, 
            "isvatpaidatcustoms": false, 
            "isdeclaredtocustoms": false, 
            "vatadvancepayment": false, 
            "vatadvpay": false, 
            "iscstdelcaredgoodssales": false, 
            "isvatrestaxinv": false, 
            "isservicetaxoverridden": false, 
            "isisdvoucher": false, 
            "isexciseoverridden": false, 
            "isexcisesupplyvch": false, 
            "gstnotexported": false, 
            "ignoregstinvalidation": false, 
            "ovrdnewaybillapplicability": false, 
            "isvatprincipalaccount": false, 
            "vchstatusisvchnumused": false, 
            "vchgststatusisincluded": false, 
            "vchgststatusisuncertain": false, 
            "vchgststatusisexcluded": false, 
            "vchgststatusisapplicable": false, 
            "vchgststatusisgstr2breconciled": false, 
            "vchgststatusisgstr2bonlyinportal": false, 
            "vchgststatusisgstr2bonlyinbooks": false, 
            "vchgststatusisgstr2bmismatch": false, 
            "vchgststatusisgstr2bindiffperiod": false, 
            "vchgststatusisreteffdateoverrdn": false, 
            "vchgststatusisoverrdn": false, 
            "vchgststatusisstatindiffdate": false, 
            "vchgststatusisretindiffdate": false, 
            "vchgststatusmainsectionexcluded": false, 
            "vchgststatusisbranchtransferout": false, 
            "vchgststatusissystemsummary": false, 
            "vchstatusisunregisteredrcm": false, 
            "vchstatusisoptional": false, 
            "vchstatusiscancelled": false, 
            "vchstatusisdeleted": false, 
            "vchstatusisopeningbalance": false, 
            "vchstatusisfetchedonly": false, 
            "vchgststatusisoptionaluncertain": false, 
            "vchstatusisreacceptforhsndone": false, 
            "vchstatusisreaccephsnsixonedone": false, 
            "paymentlinkhasmultiref": false, 
            "isshippingwithinstate": false, 
            "isoverseastouristtrans": false, 
            "isdesignatedzoneparty": false, 
            "hascashflow": false, 
            "ispostdated": false, 
            "usetrackingnumber": false, 
            "isinvoice": false, 
            "mfgjournal": false, 
            "hasdiscounts": true, 
            "aspayslip": false, 
            "iscostcentre": true, 
            "isstxnonrealizedvch": false, 
            "isexcisemanufactureron": false, 
            "isblankcheque": false, 
            "isvoid": false, 
            "orderlinestatus": false, 
            "vatisagnstcancsales": false, 
            "vatispurcexempted": false, 
            "isvatrestaxinvoice": false, 
            "vatisassesablecalcvch": false, 
            "isvatdutypaid": true, 
            "isdeliverysameasconsignee": false, 
            "isdispatchsameasconsignor": false, 
            "isdeletedvchretained": false, 
            "vchonlyaddlinfoupdated": false, 
            "changevchmode": false, 
            "uaeeinvisbillprepaidamtovrdn": false, 
            "resetirnqrcode": false, 
            "isvchexchanged": false, 
            "alterid": " 72", 
            "masterid": " 74", 
            "voucherkey": "198049531953224", 
            "voucherretainkey": "1", 
            "vouchernumberseries": "Default", 
            "allinventoryentries": inventoryEntries, 
            "ledgerentries": ledgerEntries
        }
    ]
}
;





// Save XML to file
// fs.writeFileSync("salesVoucher.json", json);

// Print XML in console

console.log(json);

  const response = await axios.post(
    "https://antarctic-whacky-hastiness.ngrok-free.dev",
    json,
    {
        headers: {
            "Content-Type": "application/json",
            "Version": "1",
            "TallyRequest": "Import",
            "Type": "Data",
            "Id": "Vouchers"
        }
    }
);
console.log(response.data.data.import_result);
// return response.data;
  } catch (err) {
    console.error("Error creating XML:");
    console.error(err);
    console.error(err.stack);
    throw err;
}
};

module.exports = {
  createSalesVoucher
};