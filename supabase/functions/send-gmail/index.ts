
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

    if (!gmailUser || !gmailPassword) {
      console.error("Gmail credentials not configured");
      throw new Error("Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD secrets.");
    }

    console.log("Sending email to:", to);
    console.log("From:", from || gmailUser);
    console.log("Subject:", subject);

    // Use Gmail SMTP with proper authentication
    const client = new SmtpClient();

    try {
      console.log("Connecting to Gmail SMTP server...");
      
      await client.connectTLS({
        hostname: "smtp.gmail.com",
        port: 465,
        username: gmailUser,
        password: gmailPassword,
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
        JSON.stringify({ success: true, message: "Email sent successfully" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (smtpError: any) {
      console.error("SMTP Error:", smtpError);
      
      // Try to close connection if it's still open
      try {
        await client.close();
      } catch (closeError) {
        console.log("Error closing SMTP connection:", closeError);
      }

      throw new Error(`Failed to send email via Gmail SMTP: ${smtpError.message}. Please verify your Gmail credentials and ensure you're using an App Password (not your regular Gmail password).`);
    }

  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
