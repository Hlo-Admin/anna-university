
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    const emailUser = Deno.env.get("EMAIL_USER");
    const emailPass = Deno.env.get("EMAIL_PASS");
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");

    console.log("Environment variables check:");
    console.log("EMAIL_USER:", emailUser ? "✓ Set" : "✗ Missing");
    console.log("EMAIL_PASS:", emailPass ? "✓ Set" : "✗ Missing");
    console.log("SMTP_HOST:", smtpHost);
    console.log("SMTP_PORT:", smtpPort);

    if (!emailUser || !emailPass) {
      console.error("Email credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Email credentials not configured",
          error: "Missing EMAIL_USER or EMAIL_PASS environment variables"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending email via SMTP...");
    console.log("From:", from || emailUser);
    console.log("To:", to);
    console.log("Subject:", subject);

    // Create SMTP client
    const client = new SmtpClient();

    // Connect to SMTP server
    await client.connectTLS({
      hostname: smtpHost,
      port: smtpPort,
      username: emailUser,
      password: emailPass,
    });

    // Send email
    await client.send({
      from: from || emailUser,
      to: to,
      subject: subject,
      content: html,
      html: html,
    });

    // Close connection
    await client.close();

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        details: {
          to: to,
          subject: subject,
          from: from || emailUser
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("SMTP sending error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        message: "Failed to send email",
        error: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
