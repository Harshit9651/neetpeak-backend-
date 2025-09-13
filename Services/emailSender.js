const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "dremersio@gmail.com",
    pass: "fdmp qqny iupt yfly",
  },
});

const sendEmail = async (to, subject, text, html = null) => {
   
  const mailOptions = {
    from: '"NeetPeak" <dremersio@gmail.com>',
    to,
    subject,
    text,
    html,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
