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
        <div style="font-family: Arial, sans-serif;">
          <h2>Support Ticket Created Successfully</h2>

          <p>Hello ${contact.contactPerson || contact.name},</p>

          <p>Your support ticket has been created successfully.</p>

          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
            <tr>
              <td><b>Ticket Number</b></td>
              <td>${ticket.ticketNumber}</td>
            </tr>
            <tr>
              <td><b>Category</b></td>
              <td>${ticket.category}</td>
            </tr>
            <tr>
              <td><b>Sub Category</b></td>
              <td>${ticket.subCategory}</td>
            </tr>
            <tr>
              <td><b>Priority</b></td>
              <td>${ticket.priority}</td>
            </tr>
            <tr>
              <td><b>Description</b></td>
              <td>${ticket.description}</td>
            </tr>
            <tr>
              <td><b>Preferred Date</b></td>
              <td>${ticket.preferredDate || "-"}</td>
            </tr>
            <tr>
              <td><b>Preferred Time</b></td>
              <td>${ticket.preferredTime || "-"}</td>
            </tr>
          </table>

          <br>

          <p>Our support team will contact you shortly.</p>

          <p>
            Regards,<br>
            ERPWale Support Team
          </p>
        </div>
      `,
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