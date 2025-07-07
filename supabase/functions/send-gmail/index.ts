
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const gmailUser = Deno.env.get("GMAIL_USER");

    console.log("Environment check:", {
      hasResendKey: !!resendApiKey,
      hasGmailUser: !!gmailUser,
      resendKeyLength: resendApiKey?.length || 0
    });

    if (!resendApiKey) {
      const errorMsg = "Resend API key not configured. Please set RESEND_API_KEY secret.";
      console.error(errorMsg);
      return new Response(
        JSON.stringify({ 
          error: errorMsg,
          details: {
            hasResendKey: !!resendApiKey,
            suggestion: "Get your API key from https://resend.com/api-keys"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending email via Resend to:", to);
    console.log("From:", from || gmailUser || "onboarding@resend.dev");
    console.log("Subject:", subject);

    const resend = new Resend(resendApiKey);

    try {
      const emailResponse = await resend.emails.send({
        from: from || `Admin <${gmailUser || "onboarding@resend.dev"}>`,
        to: [to],
        subject: subject,
        html: html,
      });

      console.log("Email sent successfully via Resend:", emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email sent successfully via Resend",
          details: {
            to,
            subject,
            from: from || gmailUser || "onboarding@resend.dev",
            emailId: emailResponse.data?.id
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );

    } catch (emailError: any) {
      console.error("Resend email sending error:", emailError);
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to send email via Resend: ${emailError.message}`,
          details: {
            errorType: emailError.name || 'ResendError',
            message: emailError.message,
            suggestion: "Please verify your Resend API key and domain configuration."
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
