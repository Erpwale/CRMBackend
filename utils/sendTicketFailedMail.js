const { SendMailClient } = require("zeptomail");
const Contact = require("../models/Contact"); // adjust path

const url = "https://api.zeptomail.in/v1.1/email";
const token = process.env.ZEPTO_TOKEN;

const client = new SendMailClient({ url, token });

const sendTicketFailedMail = async (ticket) => {
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
      subject: "Ticket Submission Failed - ASC Expired",

      htmlbody: `
   <!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ticket Submission Failed</title>
</head>

<body style="
margin:0;
padding:0;
background:#f7f9fb;
font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table
width="700"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#ffffff;
border-radius:24px;
border:1px solid #e5e7eb;
overflow:hidden;
">

<tr>
<td style="
height:8px;
background:#ba1a1a;
">
</td>
</tr>

<tr>
<td align="center" style="padding:50px 40px;">

<div style="
width:80px;
height:80px;
line-height:80px;
border-radius:50%;
background:#ffdad6;
font-size:42px;
color:#ba1a1a;
margin:auto;
">
⚠
</div>

<h2 style="
margin:25px 0 15px;
font-size:32px;
font-weight:bold;
color:#191c1e;
">
Ticket Submission Failed
</h2>

<p style="
font-size:16px;
line-height:28px;
color:#434655;
max-width:520px;
margin:0 auto 35px auto;
">
Dear ${contactPerson},
<br><br>
We are unable to process your request at this time because your
Annual Support Cover (ASC) for Serial No.
<strong style="color:#191c1e;">
${serialNo}
</strong>
has expired.
</p>

<table
cellpadding="0"
cellspacing="0"
border="0"
align="center"
>
<tr>

<td align="center" style="padding-right:10px;">
<a href="https://erpwale.com/renew"
style="
background:#2563eb;
color:#ffffff;
text-decoration:none;
padding:14px 24px;
border-radius:8px;
font-weight:bold;
display:inline-block;
">
Renew Support Cover
</a>
</td>

<td align="center">
<a href="https://erpwale.com/contact"
style="
background:#ffffff;
color:#191c1e;
text-decoration:none;
padding:14px 24px;
border-radius:8px;
border:1px solid #d1d5db;
font-weight:bold;
display:inline-block;
">
Contact Sales
</a>
</td>

</tr>
</table>

<table
width="100%"
cellpadding="0"
cellspacing="0"
border="0"
style="
margin-top:40px;
background:#f8fafc;
border:1px solid #e5e7eb;
border-radius:12px;
"
>

<tr>
<td style="padding:25px;">

<h3 style="
margin-top:0;
margin-bottom:20px;
font-size:20px;
color:#191c1e;
">
✓ Why renew your ASC?
</h3>

<table width="100%" cellpadding="0" cellspacing="0">

<tr>
<td style="
padding-bottom:12px;
font-size:14px;
line-height:24px;
color:#434655;
">
✓ <strong>Priority Assistance:</strong>
Skip the queue and get dedicated expert support.
</td>
</tr>

<tr>
<td style="
padding-bottom:12px;
font-size:14px;
line-height:24px;
color:#434655;
">
✓ <strong>Latest Updates:</strong>
Ensure compliance with statutory and product updates.
</td>
</tr>

<tr>
<td style="
font-size:14px;
line-height:24px;
color:#434655;
">
✓ <strong>Data Security:</strong>
Maintain secure remote access and uninterrupted data sync.
</td>
</tr>

</table>

</td>
</tr>

</table>

<p style="
margin-top:30px;
font-size:13px;
color:#6b7280;
">
ERPWALE Support Team
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
      `,
    });

    console.log("Ticket failed email sent successfully");
  } catch (error) {
    console.error(
      "Error sending ticket failed email:",
      error.response?.data || error
    );
  }
};

module.exports = sendTicketFailedMail;