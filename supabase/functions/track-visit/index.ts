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

    const { session_id, user_agent, referrer } = await req.json()

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Basic bot detection
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i, /lighthouse/i, 
      /headless/i, /phantom/i, /puppeteer/i, /selenium/i
    ]
    
    const isBot = user_agent && botPatterns.some(pattern => pattern.test(user_agent))
    
    if (isBot) {
      console.log(`Bot detected, skipping tracking: ${user_agent}`)
      return new Response(
        JSON.stringify({ message: 'Bot detected, not tracked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Tracking visit for session: ${session_id}`)

    // Check if session exists and last visit was more than 30 minutes ago
    const { data: existingSession, error: fetchError } = await supabase
      .from('visitor_sessions')
      .select('id, last_visit, visit_count')
      .eq('session_id', session_id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error checking existing session:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const now = new Date()
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)

    if (existingSession) {
      const lastVisit = new Date(existingSession.last_visit)
      
      // Only count as new visit if last visit was more than 30 minutes ago
      if (lastVisit < thirtyMinutesAgo) {
        const { error: updateError } = await supabase
          .from('visitor_sessions')
          .update({
            last_visit: now.toISOString(),
            visit_count: existingSession.visit_count + 1
          })
          .eq('session_id', session_id)

        if (updateError) {
          console.error('Error updating session:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update session' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`Updated existing session ${session_id}, new visit count: ${existingSession.visit_count + 1}`)
      } else {
        console.log(`Session ${session_id} visited recently, not counting as new visit`)
      }
    } else {
      // Create new session
      const { error: insertError } = await supabase
        .from('visitor_sessions')
        .insert({
          session_id,
          user_agent: user_agent || null,
          referrer: referrer || null,
          first_visit: now.toISOString(),
          last_visit: now.toISOString(),
          visit_count: 1
        })

      if (insertError) {
        console.error('Error creating session:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log(`Created new session ${session_id}`)
    }

    return new Response(
      JSON.stringify({ message: 'Visit tracked successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in track-visit function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})