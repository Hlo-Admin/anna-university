
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, from }: EmailRequest = await req.json();

    const gmailUser = Deno.env.get("GMAIL_USER");
    const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    console.log("Environment check:", {
      hasGmailUser: !!gmailUser,
      hasGmailPassword: !!gmailPassword,
      gmailUserLength: gmailUser?.length || 0,
      passwordLength: gmailPassword?.length || 0
    });

    if (!gmailUser || !gmailPassword) {
      const errorMsg = "Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD secrets.";
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          details: {
            hasGmailUser: !!gmailUser,
            hasGmailPassword: !!gmailPassword
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Clean the app password by removing spaces and converting to lowercase
    const cleanAppPassword = gmailPassword.replace(/\s+/g, '').toLowerCase();
    
    console.log("Sending email to:", to);
    console.log("From:", from || gmailUser);
    console.log("Subject:", subject);
    console.log("Cleaned password length:", cleanAppPassword.length);

    // Use Gmail SMTP with proper authentication
    const client = new SmtpClient();

    try {
      console.log("Connecting to Gmail SMTP server...");
      
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465,
        username: gmailUser,
        password: cleanAppPassword,
      });

      console.log("Connected to Gmail SMTP, sending email...");

      await client.send({
        from: from || gmailUser,
        to: to,
        subject: subject,
        html: html,
      });

      console.log("Email sent successfully via Gmail SMTP");

      await client.close();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully",
          details: {
            to,
            subject,
            from: from || gmailUser
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (smtpError: any) {
      console.error("SMTP Error details:", smtpError);
      
      // Try to close connection if it's still open
      try {
        await client.close();
      } catch (closeError) {
        console.log("Error closing SMTP connection:", closeError);
      }

      return new Response(
        JSON.stringify({ 
          error: `Failed to send email via Gmail SMTP: ${smtpError.message}`,
          details: {
            errorType: smtpError.name || 'SMTPError',
            message: smtpError.message,
            suggestion: "Please verify your Gmail credentials and ensure you're using an App Password (not your regular Gmail password)."
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

  } catch (error: any) {
    console.error("General error in send-gmail function:", error);
    return new Response(
      JSON.stringify({ 
        error: `Email function error: ${error.message}`,
        details: {
          errorType: error.name || 'GeneralError',
          stack: error.stack
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
