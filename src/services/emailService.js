/**
 * Email Service
 * Manages email sending for notifications
 * Place: src/services/emailService.js
 */

const nodemailer = require('nodemailer');

/**
 * Email Configuration
 * Use environment variables for production
 */
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'your-app-password'
  }
};

/**
 * Create Transporter
 */
let transporter = nodemailer.createTransport(emailConfig);

/**
 * Test Email Connection
 */
const testEmailConnection = async () => {
  try {
    const result = await transporter.verify();
    if (result) {
      console.log('✅ Email service connected successfully');
      return true;
    }
  } catch (error) {
    console.error('❌ Email service connection failed:', error.message);
    return false;
  }
};

/**
 * Send Booking Confirmation Email
 * Sends when a user successfully books a class
 */
const sendBookingConfirmation = async (user, classData, booking) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: '✅ Booking Confirmed - IronCore Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .details { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .details-row:last-child { border-bottom: none; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .button { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 15px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Your Booking is Confirmed!</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${user.first_name}</strong>,</p>
              <p>Great! You have successfully booked a class. Here are your booking details:</p>
              
              <div class="details">
                <div class="details-row">
                  <span class="label">Class Name:</span>
                  <span class="value">${classData.class_name}</span>
                </div>
                <div class="details-row">
                  <span class="label">Class Type:</span>
                  <span class="value">${classData.class_type}</span>
                </div>
                <div class="details-row">
                  <span class="label">Schedule:</span>
                  <span class="value">${classData.schedule_day} | ${classData.start_time} - ${classData.end_time}</span>
                </div>
                <div class="details-row">
                  <span class="label">Price:</span>
                  <span class="value">$${classData.price_per_class}</span>
                </div>
                <div class="details-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">#${booking.id}</span>
                </div>
                <div class="details-row">
                  <span class="label">Booking Date:</span>
                  <span class="value">${new Date(booking.booking_date).toLocaleDateString()}</span>
                </div>
              </div>

              <p><strong>Important:</strong> Please arrive 10 minutes before the class starts.</p>
              <p>If you need to cancel, you can do so from your booking dashboard.</p>
              
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/bookings/${booking.id}" class="button">View Booking</a>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} IronCore Fitness. All rights reserved.</p>
              <p>If you didn't make this booking, please contact us immediately.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Your booking has been confirmed!
        Class: ${classData.class_name}
        Schedule: ${classData.schedule_day} ${classData.start_time} - ${classData.end_time}
        Price: $${classData.price_per_class}
        Booking ID: #${booking.id}
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Booking confirmation email sent to ${user.email}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send booking email to ${user.email}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Booking Cancellation Email
 * Sends when a user cancels a class booking
 */
const sendCancellationEmail = async (user, classData, booking, reason) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: '❌ Booking Cancelled - IronCore Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .details { background-color: #fff3e0; padding: 15px; border-left: 4px solid #f44336; margin: 15px 0; }
            .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .label { font-weight: bold; color: #555; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancellation Confirmed</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${user.first_name}</strong>,</p>
              <p>Your booking has been cancelled. Here are the details:</p>
              
              <div class="details">
                <div class="details-row">
                  <span class="label">Class Name:</span>
                  <span>${classData.class_name}</span>
                </div>
                <div class="details-row">
                  <span class="label">Booking ID:</span>
                  <span>#${booking.id}</span>
                </div>
                ${reason ? `<div class="details-row"><span class="label">Reason:</span><span>${reason}</span></div>` : ''}
              </div>

              <p>If you have any questions, please contact our support team.</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} IronCore Fitness. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Cancellation email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send cancellation email:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send Payment Confirmation Email
 * Sends when payment is processed
 */
const sendPaymentConfirmation = async (user, payment, booking, classData) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: '💳 Payment Received - IronCore Fitness',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; }
            .receipt { background-color: #f5f5f5; padding: 15px; border: 1px solid #ddd; margin: 15px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .receipt-row.total { font-weight: bold; border-top: 2px solid #ddd; margin-top: 10px; padding-top: 10px; }
            .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Received</h1>
            </div>
            
            <div class="content">
              <p>Hi <strong>${user.first_name}</strong>,</p>
              <p>Your payment has been successfully processed. Here's your receipt:</p>
              
              <div class="receipt">
                <div class="receipt-row">
                  <span>Transaction ID:</span>
                  <span><strong>${payment.transaction_id || `#${payment.id}`}</strong></span>
                </div>
                <div class="receipt-row">
                  <span>Class:</span>
                  <span>${classData.class_name}</span>
                </div>
                <div class="receipt-row">
                  <span>Amount:</span>
                  <span>$${payment.amount}</span>
                </div>
                <div class="receipt-row">
                  <span>Method:</span>
                  <span>${payment.payment_method.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="receipt-row">
                  <span>Date:</span>
                  <span>${new Date(payment.payment_date).toLocaleDateString()}</span>
                </div>
                <div class="receipt-row total">
                  <span>Total:</span>
                  <span>$${payment.amount}</span>
                </div>
              </div>

              <p>Thank you for your payment! Your class booking is confirmed.</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} IronCore Fitness. All rights reserved.</p>
              <p>Keep this email for your records.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Payment confirmation email sent to ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Failed to send payment email:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Generic Email Sender
 * For sending custom emails
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  testEmailConnection,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendPaymentConfirmation,
  sendEmail
};
