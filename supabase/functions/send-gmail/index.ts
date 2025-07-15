
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
    const clientId = Deno.env.get("GMAIL_CLIENT_ID");
    const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
    const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

    if (!gmailUser || !clientId || !clientSecret || !refreshToken) {
      console.error("Gmail OAuth2 credentials not configured");
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "Gmail OAuth2 credentials not configured",
          error: "Missing GMAIL_USER, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, or GMAIL_REFRESH_TOKEN environment variables"
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending email via Gmail OAuth2...");
    console.log("From:", from || gmailUser);
    console.log("To:", to);
    console.log("Subject:", subject);

    // Get OAuth2 access token
    const accessToken = await getOAuth2AccessToken(clientId, clientSecret, refreshToken);
    
    if (!accessToken) {
      throw new Error("Failed to obtain OAuth2 access token");
    }

    // Send email using Gmail API
    const result = await sendGmailEmail({
      from: from || gmailUser,
      to: to,
      subject: subject,
      html: html
    }, accessToken);

    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email sent successfully",
        messageId: result.id,
        details: {
          to: to,
          subject: subject,
          from: from || gmailUser
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Gmail sending error:", error);
    
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

async function getOAuth2AccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OAuth2 token refresh failed:", errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error refreshing OAuth2 token:", error);
    return null;
  }
}

async function sendGmailEmail(emailData: any, accessToken: string) {
  // Create the email message in RFC 2822 format
  const boundary = "boundary_" + Math.random().toString(36).substr(2, 9);
  
  const rawMessage = [
    `From: ${emailData.from}`,
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    emailData.html,
    ``,
    `--${boundary}--`
  ].join('\r\n');

  // Encode the message in base64url format
  const encodedMessage = btoa(rawMessage)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gmail API send failed:", errorText);
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("Gmail API response:", result);
    return result;
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
    throw error;
  }
}

serve(handler);
