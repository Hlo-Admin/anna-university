import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const sendEmail = async ({ to, subject, html, from }: SendEmailParams) => {
  try {
    console.log("Sending email via Supabase function...", { to, subject });
    
    const { data, error } = await supabase.functions.invoke('send-gmail', {
      body: {
        to,
        subject,
        html,
        from
      }
    });

    if (error) {
      console.error('Email sending error details:', error);
      throw new Error(`Failed to send email: ${error.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw new Error(`Email service error: ${error.message || 'Unknown error'}`);
  }
};

// Enhanced email templates with better formatting
export const createStatusUpdateEmail = (reviewerName: string, paperTitle: string, newStatus: string) => {
  const statusColors = {
    'assigned': '#2563eb',
    'selected': '#059669',
    'rejected': '#dc2626',
    'pending': '#d97706'
  };

  const statusColor = statusColors[newStatus as keyof typeof statusColors] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paper Status Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Paper Status Update</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${reviewerName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">The status of your assigned paper has been updated:</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${statusColor};">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px;">
              <strong>New Status:</strong> 
              <span style="color: ${statusColor}; font-weight: bold; text-transform: uppercase; background-color: rgba(37, 99, 235, 0.1); padding: 4px 8px; border-radius: 4px;">
                ${newStatus}
              </span>
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Please log in to your reviewer dashboard for more details and to take any necessary actions.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Open Dashboard
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Admin Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const createAssignmentEmail = (reviewerName: string, paperTitle: string, authorName: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Paper Assignment</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #059669; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Paper Assignment</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${reviewerName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">A new paper has been assigned to you for review:</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #059669;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px; color: #374151;">
              <strong>Author:</strong> ${authorName}
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Please log in to your reviewer dashboard to view the paper details and begin your review process.</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Start Review
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Admin Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// New email template for student registration confirmation
export const createRegistrationConfirmationEmail = (studentName: string, paperTitle: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #2563eb; padding: 30px; text-align: center;">
          <img src="https://your-domain.com/logo.png" alt="Anna University" style="height: 50px; margin-bottom: 15px;" />
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Thank You for Your Submission!</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${studentName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Thank you for submitting your paper for review. We have successfully received your submission:</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #2563eb;">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px; color: #374151;">
              <strong>Status:</strong> 
              <span style="color: #d97706; font-weight: bold; text-transform: uppercase; background-color: rgba(217, 119, 6, 0.1); padding: 4px 8px; border-radius: 4px;">
                Under Review
              </span>
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Your paper is now under review by our editorial team. Here's what happens next:</p>
          
          <ul style="font-size: 16px; color: #374151; margin-bottom: 30px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Our team will review your submission for completeness and quality</li>
            <li style="margin-bottom: 10px;">Your paper will be assigned to relevant reviewers</li>
            <li style="margin-bottom: 10px;">You will receive updates on the review status via email</li>
            <li>The review process typically takes 2-4 weeks</li>
          </ul>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">If you have any questions or need to make any updates to your submission, please contact us immediately.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Anna University Editorial Team</strong></p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// New email template for reviewer account creation
export const createReviewerCredentialsEmail = (reviewerName: string, username: string, password: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Reviewer Account</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: #059669; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Welcome to the Review Panel</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${reviewerName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Your reviewer account has been successfully created. You can now access the reviewer dashboard to review assigned papers.</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Your Login Credentials</h3>
            <p style="margin: 0 0 10px 0; font-size: 16px;">
              <strong>Username:</strong> 
              <span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${username}</span>
            </p>
            <p style="margin: 0; font-size: 16px;">
              <strong>Password:</strong> 
              <span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${password}</span>
            </p>
          </div>
          
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Security Notice:</strong> Please change your password after your first login for security purposes. Keep your credentials confidential and do not share them with anyone.
            </p>
          </div>
          
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">As a reviewer, you will be able to:</p>
          
          <ul style="font-size: 16px; color: #374151; margin-bottom: 30px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Access and review assigned papers</li>
            <li style="margin-bottom: 10px;">Provide feedback and recommendations</li>
            <li style="margin-bottom: 10px;">Track the status of your reviews</li>
            <li>Communicate with the editorial team</li>
          </ul>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="#" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Reviewer Dashboard
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Admin Team</strong></p>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">If you have any questions, please contact the administrator.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// New email template for student status updates
export const createStudentStatusUpdateEmail = (studentName: string, paperTitle: string, newStatus: string) => {
  const statusMessages = {
    'selected': {
      title: 'Congratulations! Your Paper Has Been Selected',
      message: 'We are pleased to inform you that your paper has been selected for publication.',
      color: '#059669',
      actionText: 'View Publication Details'
    },
    'rejected': {
      title: 'Paper Review Update',
      message: 'After careful review, we regret to inform you that your paper has not been selected for publication at this time.',
      color: '#dc2626',
      actionText: 'Submit Another Paper'
    }
  };

  const statusInfo = statusMessages[newStatus as keyof typeof statusMessages];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Paper Review Update</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
        <div style="background-color: ${statusInfo.color}; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${statusInfo.title}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Dear ${studentName},</p>
          <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">${statusInfo.message}</p>
          
          <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; border-left: 4px solid ${statusInfo.color};">
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">${paperTitle}</h2>
            <p style="margin: 0; font-size: 16px;">
              <strong>Status:</strong> 
              <span style="color: ${statusInfo.color}; font-weight: bold; text-transform: uppercase; background-color: rgba(37, 99, 235, 0.1); padding: 4px 8px; border-radius: 4px;">
                ${newStatus}
              </span>
            </p>
          </div>
          
          ${newStatus === 'selected' ? 
            `<p style="font-size: 16px; color: #374151; margin-bottom: 30px;">We will contact you soon with further details regarding the publication process.</p>` :
            `<p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Thank you for your submission. We encourage you to consider submitting future work for review.</p>`
          }
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Best regards,<br><strong>Anna University Editorial Team</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Helper function to send emails with toast notifications
export const sendEmailWithNotification = async (emailParams: SendEmailParams, toast: any) => {
  try {
    await sendEmail(emailParams);
    toast({
      title: "Email Sent",
      description: `Email sent successfully to ${emailParams.to}`,
    });
  } catch (error: any) {
    console.error("Email sending failed:", error);
    toast({
      title: "Email Failed",
      description: error.message || "Failed to send email",
      variant: "destructive",
    });
  }
};
