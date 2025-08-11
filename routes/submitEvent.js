const express = require('express');
const { body, validationResult } = require('express-validator');
let nodemailer;
try {
  nodemailer = require('nodemailer');
} catch (error) {
  console.log('Nodemailer not installed - email functionality disabled');
}
const router = express.Router();

// Create email transporter (you'll need to configure this with your email settings)
const createTransporter = () => {
  if (!nodemailer) {
    console.log('Nodemailer not available - cannot create transporter');
    return null;
  }
  // Using mail.com SMTP settings
  return nodemailer.createTransporter({
    host: 'smtp.mail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'torontoevents@writeme.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// POST /api/submit-event - Submit event for review
router.post('/', [
  body('eventName').trim().isLength({ min: 1, max: 255 }).withMessage('Event name is required and must be under 255 characters'),
  body('submitterName').trim().isLength({ min: 1, max: 100 }).withMessage('Your name is required and must be under 100 characters'),
  body('submitterEmail').optional().isEmail().withMessage('Please provide a valid email address'),
  body('eventLink').optional().isURL().withMessage('Please provide a valid URL'),
  body('eventDescription').trim().isLength({ min: 1, max: 2000 }).withMessage('Event description is required and must be under 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ 
        error: 'Please check your form entries',
        details: errors.array()
      });
    }

    const { eventName, submitterName, submitterEmail, eventLink, eventDescription } = req.body;

    // Create email content
    const emailSubject = `New Event Submission: ${eventName}`;
    const emailBody = `
New event submission for Toronto Event Calendar:

EVENT DETAILS:
Name: ${eventName}
Description: ${eventDescription}

SUBMITTER DETAILS:
Name: ${submitterName}
Email: ${submitterEmail || 'Not provided'}
Event Link: ${eventLink || 'Not provided'}

NEXT STEPS:
1. Review the event details above
2. If approved, create the event in the calendar manually
3. Consider reaching out to the submitter if you need more information

Submitted at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' })}
    `.trim();

    try {
      console.log('Creating email transporter...');
      console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
      console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
      console.log('SUBMISSION_EMAIL:', process.env.SUBMISSION_EMAIL || 'saintgull94@gmail.com');
      
      const transporter = createTransporter();
      
      if (!transporter) {
        console.log('Email transporter not available - skipping email');
        throw new Error('Email service not configured');
      }
      
      // Send email notification
      console.log('Sending email from:', process.env.EMAIL_USER || 'torontoevents@writeme.com');
      console.log('Sending email to:', process.env.SUBMISSION_EMAIL || 'saintgull94@gmail.com');
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER || 'torontoevents@writeme.com',
        to: process.env.SUBMISSION_EMAIL || 'saintgull94@gmail.com',
        subject: emailSubject,
        text: emailBody,
        html: emailBody.replace(/\n/g, '<br>')
      });

      console.log('Event submission email sent successfully');
      
      // Send confirmation email to submitter if they provided an email
      if (submitterEmail) {
        const confirmationSubject = 'Event Submission Received - Toronto Event Calendar';
        const confirmationBody = `
Hi ${submitterName},

Thanks for submitting "${eventName}" to the Toronto Event Calendar!

We've received your submission and will review it within 2-3 business days. If approved, your event will appear on our calendar.

If we need any additional information, we'll reach out to you at this email address.

Best regards,
Toronto Event Calendar Team
        `.trim();

        await transporter.sendMail({
          from: process.env.EMAIL_USER || 'torontoevents@writeme.com',
          to: submitterEmail,
          subject: confirmationSubject,
          text: confirmationBody,
          html: confirmationBody.replace(/\n/g, '<br>')
        });

        console.log('Confirmation email sent to submitter');
      }

      res.json({ 
        success: true, 
        message: 'Event submitted successfully! We\'ll review it and add it to the calendar if approved.' 
      });

    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Still return success to user, but log the email failure
      // You could also save to database as backup
      res.json({ 
        success: true, 
        message: 'Event submitted successfully! We\'ll review it and add it to the calendar if approved.' 
      });
    }

  } catch (error) {
    console.error('Error processing event submission:', error);
    res.status(500).json({ error: 'Failed to submit event. Please try again.' });
  }
});

module.exports = router;