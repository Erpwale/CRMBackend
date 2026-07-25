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



const json = {

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
                "ADDRESS LINE 1", 
                "ADDRESS LINE 2", 
                "ADDRESS LINE 3"
            ], 
            "basicbuyeraddress": [
                {
                    "metadata": true, 
                    "type": "String"
                }, 
                "ADDRESS LINE 1", 
                "ADDRESS LINE 2", 
                "ADDRESS LINE 3"
            ], 
            "oldauditentryids": [
                {
                    "metadata": true, 
                    "type": "Number"
                }, 
                "-1"
            ], 
            "date": "20260401", 
            "vchstatusdate": "20260401", 
            "guid": "e4bff212-f722-4649-b301-8f1354493d45-0000004a", 
            "gstregistrationtype": "Regular", 
            "vatdealertype": "Regular", 
            "statename": "Maharashtra", 
            "discountformat": "Both Percentage & Amount", 
            "narration": "NARRATION IF APPLICABLE", 
            "countryofresidence": "India", 
            "partygstin": "27AAAAA1111A1A1", 
            "placeofsupply": "Maharashtra", 
            "vouchertypename": "Sales Order", 
            "partyname": "AMBUJA CEMENT PUNE PLANT", 
            "gstregistration": {
                "value": "Maharashtra Registration", 
                "taxtype": "GST", 
                "taxregistration": ""
            }, 
            "partyledgername": "AMBUJA CEMENT PUNE PLANT", 
            "vouchernumber": "1", 
            "basicbuyername": "AMBUJA CEMENT PUNE PLANT", 
            "cmpgstregistrationtype": "Regular", 
            "reference": "ERP/SO/1/26-27", 
            "partymailingname": "AMBUJA CEMENT PUNE PLANT", 
            "partypincode": "411041", 
            "consigneegstin": "27AAAAA1111A1A1", 
            "consigneemailingname": "AMBUJA CEMENT PUNE PLANT", 
            "consigneepincode": "411041", 
            "consigneestatename": "Maharashtra", 
            "cmpgststate": "Maharashtra", 
            "consigneecountryname": "India", 
            "basicbasepartyname": "AMBUJA CEMENT PUNE PLANT", 
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
            "effectivedate": "20260401", 
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
            "allinventoryentries": [
                {
                    "basicuserdescription": [
                        {
                            "metadata": true, 
                            "type": "String"
                        }, 
                        "Prevents transactions like sales, delivery notes, and stock journals\r\nwhen issued quantity exceeds available stock. Ensures accurate\r\ninventory control."
                    ], 
                    "stockitemname": "Negative Stock Blocking", 
                    "gstovrdnisrevchargeappl": "\u0004 Not Applicable", 
                    "gstovrdntaxability": "Taxable", 
                    "gstsourcetype": "Stock Item", 
                    "gstitemsource": "Negative Stock Blocking", 
                    "hsnsourcetype": "Stock Item", 
                    "hsnitemsource": "Negative Stock Blocking", 
                    "gstovrdntypeofsupply": "Services", 
                    "gstrateinferapplicability": "As per Masters/Company", 
                    "gsthsninferapplicability": "As per Masters/Company", 
                    "gstovrdnistaxonmrpapplicable": "\u0004 Not Applicable", 
                    "isdeemedpositive": false, 
                    "isrcmapplicable": false, 
                    "isgstassessablevalueoverridden": false, 
                    "strdisgstapplicable": false, 
                    "contentnegispos": false, 
                    "islastdeemedpositive": false, 
                    "isautonegate": false, 
                    "iscustomsclearance": false, 
                    "istrackcomponent": false, 
                    "istrackproduction": false, 
                    "isprimaryitem": false, 
                    "isscrap": false, 
                    "rate": "1800.00/Nos", 
                    "discount": " 10", 
                    "amount": "1620.00", 
                    "discountamount": "180.00", 
                    "actualqty": " 1 Nos", 
                    "billedqty": " 1 Nos", 
                    "batchallocations": [
                        {
                            "godownname": "Main Location", 
                            "batchname": "Primary Batch", 
                            "indentno": "\u0004 Not Applicable", 
                            "orderno": "ERP/SO/1/26-27", 
                            "trackingnumber": "\u0004 Not Applicable", 
                            "dynamiccstiscleared": false, 
                            "amount": "1620.00", 
                            "batchdiscountamount": "180.00", 
                            "actualqty": " 1 Nos", 
                            "billedqty": " 1 Nos", 
                            "orderduedate": "1-Apr-26"
                        }
                    ], 
                    "accountingallocations": [
                        {
                            "oldauditentryids": [
                                {
                                    "metadata": true, 
                                    "type": "Number"
                                }, 
                                "-1"
                            ], 
                            "ledgername": "CRM Sales", 
                            "gstclass": "\u0004 Not Applicable", 
                            "gstovrdnistaxonmrpapplicable": "\u0004 Not Applicable", 
                            "isdeemedpositive": false, 
                            "ledgerfromitem": false, 
                            "removezeroentries": false, 
                            "isrcmapplicable": false, 
                            "issystem": false, 
                            "ispartyledger": false, 
                            "gstoverridden": false, 
                            "isgstassessablevalueoverridden": false, 
                            "strdisgstapplicable": false, 
                            "strdgstispartyledger": false, 
                            "strdgstisdutyledger": false, 
                            "contentnegispos": false, 
                            "islastdeemedpositive": false, 
                            "iscapvattaxaltered": false, 
                            "iscapvatnotclaimed": false, 
                            "amount": "1620.00", 
                            "categoryallocations": [
                                {
                                    "category": "Primary Cost Category", 
                                    "isdeemedpositive": false, 
                                    "costcentreallocations": [
                                        {
                                            "name": "CRM Sales Person", 
                                            "amount": "1620.00"
                                        }
                                    ]
                                }
                            ]
                        }
                    ], 
                    "ratedetails": [
                        {
                            "gstratedutyhead": "CGST", 
                            "gstratevaluationtype": "Based on Value", 
                            "gstrate": " 9"
                        }, 
                        {
                            "gstratedutyhead": "SGST/UTGST", 
                            "gstratevaluationtype": "Based on Value", 
                            "gstrate": " 9"
                        }, 
                        {
                            "gstratedutyhead": "IGST", 
                            "gstratevaluationtype": "Based on Value", 
                            "gstrate": " 18"
                        }, 
                        {
                            "gstratedutyhead": "Cess", 
                            "gstratevaluationtype": "\u0004 Not Applicable"
                        }, 
                        {
                            "gstratedutyhead": "State Cess", 
                            "gstratevaluationtype": "Based on Value"
                        }
                    ]
                }
            ], 
            "ledgerentries": [
                {
                    "oldauditentryids": [
                        {
                            "metadata": true, 
                            "type": "Number"
                        }, 
                        "-1"
                    ], 
                    "ledgername": "AMBUJA CEMENT PUNE PLANT", 
                    "gstclass": "\u0004 Not Applicable", 
                    "gstovrdnistaxonmrpapplicable": "\u0004 Not Applicable", 
                    "isdeemedpositive": true, 
                    "ledgerfromitem": false, 
                    "removezeroentries": false, 
                    "isrcmapplicable": false, 
                    "issystem": false, 
                    "ispartyledger": true, 
                    "gstoverridden": false, 
                    "isgstassessablevalueoverridden": false, 
                    "strdisgstapplicable": false, 
                    "strdgstispartyledger": false, 
                    "strdgstisdutyledger": false, 
                    "contentnegispos": false, 
                    "islastdeemedpositive": true, 
                    "iscapvattaxaltered": false, 
                    "iscapvatnotclaimed": false, 
                    "amount": "-1911.60"
                }, 
                {
                    "oldauditentryids": [
                        {
                            "metadata": true, 
                            "type": "Number"
                        }, 
                        "-1"
                    ], 
                    "rateofinvoicetax": [
                        {
                            "metadata": true, 
                            "type": "Number"
                        }, 
                        " 9"
                    ], 
                    "appropriatefor": "GST", 
                    "gstappropriateto": "Goods", 
                    "excisealloctype": "Based on Value", 
                    "roundtype": "Normal Rounding", 
                    "ledgername": "Output CGST 9%", 
                    "gstclass": "\u0004 Not Applicable", 
                    "gstovrdnistaxonmrpapplicable": "\u0004 Not Applicable", 
                    "isdeemedpositive": false, 
                    "ledgerfromitem": false, 
                    "removezeroentries": false, 
                    "isrcmapplicable": false, 
                    "issystem": false, 
                    "ispartyledger": false, 
                    "gstoverridden": false, 
                    "isgstassessablevalueoverridden": false, 
                    "strdisgstapplicable": false, 
                    "strdgstispartyledger": false, 
                    "strdgstisdutyledger": false, 
                    "contentnegispos": false, 
                    "islastdeemedpositive": false, 
                    "iscapvattaxaltered": false, 
                    "iscapvatnotclaimed": false, 
                    "amount": "145.80", 
                    "vatexpamount": "145.80"
                }, 
                {
                    "oldauditentryids": [
                        {
                            "metadata": true, 
                            "type": "Number"
                        }, 
                        "-1"
                    ], 
                    "rateofinvoicetax": [
                        {
                            "metadata": true, 
                            "type": "Number"
                        }, 
                        " 9"
                    ], 
                    "roundtype": "Normal Rounding", 
                    "ledgername": "Output SGST 9%", 
                    "gstclass": "\u0004 Not Applicable", 
                    "gstovrdnistaxonmrpapplicable": "\u0004 Not Applicable", 
                    "isdeemedpositive": false, 
                    "ledgerfromitem": false, 
                    "removezeroentries": false, 
                    "isrcmapplicable": false, 
                    "issystem": false, 
                    "ispartyledger": false, 
                    "gstoverridden": false, 
                    "isgstassessablevalueoverridden": false, 
                    "strdisgstapplicable": false, 
                    "strdgstispartyledger": false, 
                    "strdgstisdutyledger": false, 
                    "contentnegispos": false, 
                    "islastdeemedpositive": false, 
                    "iscapvattaxaltered": false, 
                    "iscapvatnotclaimed": false, 
                    "amount": "145.80", 
                    "vatexpamount": "145.80"
                }
            ]
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
            "Content-Type": "application/json"
        }
    }
);
console.log("response:",response)
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