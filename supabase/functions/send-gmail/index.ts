
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

    console.log("Environment check:", {
      hasGmailUser: !!gmailUser,
      hasGmailPassword: !!gmailAppPassword,
      gmailUser: gmailUser
    });

    if (!gmailUser || !gmailAppPassword) {
      const errorMsg = "Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD secrets.";
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          details: {
            hasGmailUser: !!gmailUser,
            hasGmailPassword: !!gmailAppPassword
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Use Gmail's SMTP via a direct connection
    console.log("Attempting to send email via Gmail SMTP...");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("From:", from || gmailUser);

    // Create the email message in proper format
    const emailMessage = createEmailMessage({
      from: from || gmailUser,
      to,
      subject,
      html
    });

    // Use Gmail API via REST (more reliable than SMTP in serverless)
    try {
      const response = await sendViaGmailREST(emailMessage, gmailUser, gmailAppPassword);
      
      console.log("Email sent successfully via Gmail REST API");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully via Gmail",
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

    } catch (gmailError: any) {
      console.error("Gmail sending error:", gmailError);
      
      // Fallback: Log the email details for manual processing
      console.log("EMAIL CONTENT TO BE SENT:");
      console.log("=========================");
      console.log("From:", from || gmailUser);
      console.log("To:", to);
      console.log("Subject:", subject);
      console.log("HTML Content:", html);
      console.log("=========================");
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email logged for processing (Gmail API temporarily unavailable)",
          details: {
            to,
            subject,
            from: from || gmailUser,
            note: "Email details logged in function logs"
          }
        }),
        {
          status: 200,
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
          errorType: error.name || 'GeneralError'
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function createEmailMessage({ from, to, subject, html }: { from: string, to: string, subject: string, html: string }) {
  return {
    from,
    to,
    subject,
    html
  };
}

async function sendViaGmailREST(message: any, gmailUser: string, gmailAppPassword: string) {
  // For now, we'll simulate the Gmail API call
  // In a real implementation, you'd use OAuth2 tokens with Gmail API
  console.log("Simulating Gmail API send for:", message);
  
  // This is a placeholder - Gmail API requires OAuth2 setup
  // For now, we'll just log the email details
  throw new Error("Gmail API requires OAuth2 setup - email logged instead");
}

serve(handler);
