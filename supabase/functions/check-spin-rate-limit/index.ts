import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { session_id } = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Checking rate limit for session: ${session_id}`)

    // Get current session data
    const { data: sessionData, error: fetchError } = await supabase
      .from('visitor_sessions')
      .select('spin_attempts')
      .eq('session_id', session_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching session:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago

    // Get existing spin attempts or initialize empty array
    let spinAttempts: string[] = []
    if (sessionData?.spin_attempts) {
      spinAttempts = Array.isArray(sessionData.spin_attempts) 
        ? sessionData.spin_attempts 
        : []
    }

    console.log(`Current spin attempts for session ${session_id}:`, spinAttempts)

    // Filter out attempts older than 10 minutes
    const recentAttempts = spinAttempts.filter(attemptTime => {
      const attemptDate = new Date(attemptTime)
      return attemptDate > tenMinutesAgo
    })

    console.log(`Recent attempts (last 10 min): ${recentAttempts.length}`)

    // Check if rate limit exceeded (5 attempts in 10 minutes)
    if (recentAttempts.length >= 5) {
      const oldestRecent = new Date(Math.min(...recentAttempts.map(t => new Date(t).getTime())))
      const timeUntilReset = new Date(oldestRecent.getTime() + 10 * 60 * 1000) // 10 minutes from oldest attempt
      const minutesLeft = Math.ceil((timeUntilReset.getTime() - now.getTime()) / (1000 * 60))

      return new Response(
        JSON.stringify({ 
          rateLimited: true, 
          message: `Rate limit exceeded. Please wait ${minutesLeft} minute(s) before trying again.`,
          attemptsRemaining: 0,
          resetTime: timeUntilReset.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add current attempt and update database
    const updatedAttempts = [...recentAttempts, now.toISOString()]

    // If session doesn't exist, create it; otherwise update it
    if (!sessionData) {
      // Create new session with spin attempt
      const { error: insertError } = await supabase
        .from('visitor_sessions')
        .insert({
          session_id,
          spin_attempts: updatedAttempts,
          first_visit: now.toISOString(),
          last_visit: now.toISOString(),
          visit_count: 1
        })

      if (insertError) {
        console.error('Error creating session with spin attempt:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to track spin attempt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // Update existing session
      const { error: updateError } = await supabase
        .from('visitor_sessions')
        .update({
          spin_attempts: updatedAttempts,
          last_visit: now.toISOString()
        })
        .eq('session_id', session_id)

      if (updateError) {
        console.error('Error updating session with spin attempt:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to track spin attempt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const attemptsRemaining = 5 - updatedAttempts.length

    console.log(`Rate limit check passed. Attempts remaining: ${attemptsRemaining}`)

    return new Response(
      JSON.stringify({ 
        rateLimited: false, 
        attemptsRemaining,
        totalAttempts: updatedAttempts.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in check-spin-rate-limit function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})