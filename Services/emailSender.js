const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "btpnexusacademy@gmail.com",
    pass: "tlgi grrg hoee avwy",
  },
});

const sendEmail = async (to, subject, text, html = null) => {
   
  const mailOptions = {
    from: '"BTP Nexus Academy" <btpnexusacademy@gmail.com>',
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
