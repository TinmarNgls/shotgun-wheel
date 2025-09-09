/*
 * Supabase Edge Function: verify-email
 *
 * This function replaces the Make.com webhook for email verification.
 * It validates reCAPTCHA, verifies email addresses, and generates JWT tokens.
 *
 * Required Environment Variables:
 * - RECAPTCHA_SECRET_KEY: Your Google reCAPTCHA secret key
 * - JWT_SECRET: Secret key used for signing JWT tokens
 *
 * To set the environment variables:
 * supabase secrets set RECAPTCHA_SECRET_KEY=your_secret_key_here
 * supabase secrets set JWT_SECRET=your_jwt_secret_here
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { SignJWT } from "npm:jose@5.9.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hardcoded PostgreSQL connection string
const SHOTGUN_PG_CONNECTION_STRING = Deno.env.get(
  "SHOTGUN_PG_CONNECTION_STRING"
);

// Lightweight PostgreSQL client function
async function queryPostgres(
  email: string
): Promise<{ valid: boolean; message: string | null }> {
  const client = new Client(SHOTGUN_PG_CONNECTION_STRING);

  try {
    await client.connect();

    // Hardcoded query to check if email exists in the database
    const query = `
      SELECT
        CASE
          WHEN s.id IS NULL
            THEN 'We could not found a Shotgun account with this email'
          WHEN s.app_version IS NULL
            THEN 'You have not installed the app and logged with your account'
          WHEN bf.shotguner_id IS NULL
              OR (bf.unfollowed_at IS NOT NULL AND bf.unfollowed_at > bf.followed_at)
            THEN 'Your are not following Shotgun page'
          WHEN bf.push_notification_unsubscribed_at IS NOT NULL
              AND bf.push_notification_unsubscribed_at > bf.push_notification_subscribed_at
            THEN 'You have not enabled push notification'
          ELSE 'OK'
        END AS status,

        s.id AS shotguner_id,
        COALESCE(s.email, v.email) AS shotguner_email,
        s.app_version,
        bf.followed_at,
        bf.unfollowed_at,
        bf.push_notification_subscribed_at,
        bf.push_notification_unsubscribed_at

      FROM (VALUES ($1::text)) AS v(email)
      LEFT JOIN LATERAL (
        SELECT id, email, app_version
        FROM shotguners
        WHERE email = v.email
        LIMIT 1
      ) AS s ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          shotguner_id,
          followed_at,
          unfollowed_at,
          push_notification_subscribed_at,
          push_notification_unsubscribed_at
        FROM biz_followers
        WHERE shotguner_id = s.id
          AND dealer_id = 171093
        ORDER BY followed_at DESC NULLS LAST
        LIMIT 1
      ) AS bf ON TRUE;
    `;

    const result = await client.queryArray(query, [email]);

    if (result.rows.length > 0) {
      const [status] = result.rows[0];

      if (status === "OK") {
        return {
          valid: true,
          message: null,
        };
      } else {
        return {
          valid: false,
          message: status as string,
        };
      }
    } else {
      return {
        valid: false,
        message: "Error",
      };
    }
  } catch (error) {
    console.error("PostgreSQL query error:", error);
    return {
      valid: false,
      message: "Database connection error",
    };
  } finally {
    await client.end();
  }
}

// JWT generation function using jose library (following Deno best practices)
const secret = new TextEncoder().encode(Deno.env.get("JWT_SECRET"));

async function generateJWT(shotgunerEmail: string): Promise<string> {
  // Create JWT with shotgunerId payload using jose library
  const jwt = await new SignJWT({ shotgunerEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(secret);

  return jwt;
}

// Google reCAPTCHA verification
async function verifyRecaptcha(captchaValue: string): Promise<boolean> {
  const secret = Deno.env.get("CAPTCHA_SECRET_KEY");
  if (!secret) {
    console.error("CAPTCHA_SECRET_KEY not found in environment");
    return false;
  }

  const url = new URL("https://www.google.com/recaptcha/api/siteverify");
  url.searchParams.set("secret", secret);
  url.searchParams.set("response", captchaValue);

  try {
    const response = await fetch(url.toString(), { method: "POST" });
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("Error verifying reCAPTCHA:", error);
    return false;
  }
}

// Email verification function using PostgreSQL client
async function verifyEmail(
  email: string
): Promise<{ valid: boolean; message: string | null }> {
  // Admin test emails - keep these for testing
  if (email === "martin+win@shotgun.live") {
    return { valid: true, message: null };
  }

  if (email === "martin+loose@shotgun.live") {
    return { valid: true, message: null };
  }

  return await queryPostgres(email);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, captchaValue } = await req.json();

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "invalid", message: "Email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!captchaValue?.trim()) {
      return new Response(
        JSON.stringify({ error: "invalid", message: "CAPTCHA is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing email verification for: ${email}`);

    // Verify reCAPTCHA first
    const isCaptchaValid = await verifyRecaptcha(captchaValue);
    if (!isCaptchaValid) {
      console.log(`Invalid CAPTCHA for email: ${email}`);
      return new Response(
        JSON.stringify({
          error: "invalid",
          message: "Invalid captcha. Please try again.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`CAPTCHA verified for email: ${email}`);

    // Verify email
    const verificationResult = await verifyEmail(email.trim());

    if (verificationResult.valid) {
      console.log(`Email verification successful for: ${email}`);

      try {
        // Generate JWT token with shotgunerId
        const token = await generateJWT(email);
        console.log(`JWT token generated for: ${email}`);
        console.log(`JWT token: ${token}`);

        const response = {
          status: "OK",
          message: verificationResult.message || "Email verified successfully",
          token,
        };

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (jwtError) {
        console.error("JWT generation failed:", jwtError);
        return new Response(
          JSON.stringify({
            error: "jwt_generation_failed",
            message: "Failed to generate authentication token",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.log(
        `Email verification failed for: ${email} - ${verificationResult.message}`
      );

      return new Response(
        JSON.stringify({
          error: "invalid",
          message: "Email verification failed",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in verify-email function:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
