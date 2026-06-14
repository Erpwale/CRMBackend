const { SendMailClient } = require("zeptomail");
const Contact = require("../models/Contact"); // adjust path

const url = "https://api.zeptomail.in/v1.1/email";
const token = process.env.ZEPTO_TOKEN;

const client = new SendMailClient({ url, token });

const sendTicketMail = async (ticket) => {
  try {
    // Fetch contact details
    const contact = await Contact.findById(ticket.contactId);

    if (!contact || !contact.email) {
      console.log("Contact email not found");
      return;
    }
console.log(contact);

    await client.sendMail({
      from: {
        address: "noreply@erpwale.com",
        name: "ERPWale Support",
      },
      to: [
        {
          email_address: {
            address: contact.email,
            name: contact.contactPerson || contact.name,
          },
        },
      ],
      subject: `Ticket Created - ${ticket.ticketNumber}`,
    htmlbody: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ERPWALE Support Ticket</title>
</head>

<body style="margin:0;padding:0;background:#f7f9fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f7f9fb;">
<tr>
<td align="center" style="padding:30px 15px;">

<table width="800" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">

<tr>
<td align="center" style="padding:30px 20px;">

<img
src="YOUR_LOGO_URL"
width="220"
style="display:block;border:none;max-width:220px;"
alt="Support Journey Begins">

<h2 style="margin:25px 0 10px;color:#111827;font-size:32px;">
Your Support Journey Begins!
</h2>

<p style="margin:0;color:#326808;font-size:20px;font-weight:bold;">
Ticket Confirmed
</p>

</td>
</tr>

<tr>
<td style="padding:0 30px 30px 30px;">

<table width="100%" cellpadding="0" cellspacing="0" border="0"
style="
background:#ffffff;
border:1px solid #d1d5db;
border-radius:16px;
">

<tr>

<td width="70%" valign="top" style="padding:30px;">

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td>
<span style="color:#2563eb;font-size:22px;font-weight:bold;">
☎ ERPWALE SUPPORT AIR
</span>
</td>
</tr>

<tr>
<td style="padding-top:15px;border-bottom:1px dashed #cbd5e1;">
&nbsp;
</td>
</tr>

</table>

<br>

<table width="100%" cellpadding="8" cellspacing="0">

<tr>
<td width="50%">
<div style="font-size:11px;color:#6b7280;">
TICKET NUMBER
</div>

<div style="font-size:22px;font-weight:bold;color:#2563eb;">
${ticket.ticketNumber}
</div>
</td>

<td width="50%">
<div style="font-size:11px;color:#6b7280;">
SCHEDULE
</div>

<div style="font-size:15px;font-weight:bold;color:#111827;">
${ticket.preferredDate || "-"} | ${ticket.preferredTime || "-"}
</div>
</td>
</tr>

<tr>
<td>
<div style="font-size:11px;color:#6b7280;">
CATEGORY
</div>

<div style="font-size:15px;color:#111827;">
${ticket.category || "-"}
</div>
</td>

<td>
<div style="font-size:11px;color:#6b7280;">
SUB CATEGORY
</div>

<div style="font-size:15px;color:#111827;">
${ticket.subCategory || "-"}
</div>
</td>
</tr>

<tr>
<td colspan="2">
<div style="font-size:11px;color:#6b7280;">
CONTACT PERSON
</div>

<div style="font-size:15px;font-weight:bold;color:#111827;">
${contact.name || contact.contactPerson || "-"}
<span style="font-weight:normal;">
(${contact.mobile || "-"})
</span>
</div>
</td>
</tr>

<tr>
<td colspan="2">
<div style="font-size:11px;color:#6b7280;">
EMAIL
</div>

<div style="font-size:15px;color:#111827;">
${contact.email || "-"}
</div>
</td>
</tr>

<tr>
<td colspan="2">
<div style="font-size:11px;color:#6b7280;">
DESCRIPTION
</div>

<div style="font-size:15px;color:#111827;">
${ticket.description || "-"}
</div>
</td>
</tr>

<tr>
<td>
<div style="font-size:11px;color:#6b7280;">
PRIORITY
</div>

<div style="font-size:15px;color:#111827;">
${ticket.priority || "-"}
</div>
</td>

<td>
<div style="font-size:11px;color:#6b7280;">
STATUS
</div>

<div style="font-size:15px;color:#111827;">
${ticket.status || "Open"}
</div>
</td>
</tr>

</table>

</td>

<td width="30%" valign="top"
style="
padding:30px;
border-left:2px dashed #d1d5db;
background:#f8fafc;
">

<div style="
font-size:12px;
font-weight:bold;
color:#2563eb;
margin-bottom:10px;
">
🤖 TICKET ROUTING INSIGHT
</div>

<p style="
font-size:13px;
line-height:22px;
color:#4b5563;
margin:0;
">
Your ticket has been prioritized and routed to our
<strong>${ticket.category || "Support"} Specialist</strong>
based on your category and sub-category selection.
</p>

</td>

</tr>

</table>

</td>
</tr>

<tr>
<td align="center" style="padding:20px;">

<a href="${process.env.FRONTEND_URL}/ticket/${ticket._id}"
style="
background:#2563eb;
color:#ffffff;
text-decoration:none;
padding:12px 24px;
border-radius:6px;
display:inline-block;
font-weight:bold;
">
View Ticket
</a>

</td>
</tr>

<tr>
<td style="
background:#f3f4f6;
padding:20px;
text-align:center;
font-size:12px;
color:#6b7280;
">

ERPWALE Support Team<br>
support@erpwale.com

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`
    });

    console.log("Ticket email sent successfully");
  } catch (err) {
  console.error("========== EMAIL ERROR ==========");
  console.error("Error Object:", err);
  console.error("Message:", err.message);

  if (err.response) {
    console.error("Status:", err.response.status);
    console.error("Response Data:", err.response.data);
  }

  if (err.stack) {
    console.error("Stack Trace:", err.stack);
  }

  console.error("================================");
}
};

module.exports = sendTicketMail;