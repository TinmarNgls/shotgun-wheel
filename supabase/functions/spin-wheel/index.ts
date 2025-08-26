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

    const { shotguner_id, shotguner_email } = await req.json()

    if (!shotguner_id || !shotguner_email) {
      return new Response(
        JSON.stringify({ error: 'Missing shotguner_id or shotguner_email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing spin request for shotguner_id: ${shotguner_id}, email: ${shotguner_email}`)

    // Check if user has already spun the wheel
    const { data: existingSpin, error: spinCheckError } = await supabase
      .from('wheel_spins')
      .select('id')
      .eq('shotguner_id', shotguner_id)
      .maybeSingle()

    if (spinCheckError) {
      console.error('Error checking existing spin:', spinCheckError)
      return new Response(
        JSON.stringify({ error: 'Database error while checking spin history' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (existingSpin) {
      console.log(`User ${shotguner_id} has already spun the wheel`)
      return new Response(
        JSON.stringify({ 
          error: 'already_spun',
          message: 'You have already spun the wheel. Only one spin per user is allowed.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine if user wins or loses
    let isWinner = false
    
    // Admin override rules
    if (shotguner_email === 'martin+win@shotgun.live') {
      isWinner = true
      console.log('Admin override: forcing win for martin+win@shotgun.live')
    } else if (shotguner_email === 'martin+loose@shotgun.live') {
      isWinner = false
      console.log('Admin override: forcing loss for martin+loose@shotgun.live')
    } else {
      // 50% chance of winning
      isWinner = Math.random() < 0.5
      console.log(`Random determination: ${isWinner ? 'winner' : 'loser'}`)
    }

    let winningCode = null

    if (isWinner) {
      // Get an available winning code
      const { data: availableCode, error: codeError } = await supabase
        .rpc('get_available_winning_code')

      if (codeError) {
        console.error('Error getting available code:', codeError)
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve winning code' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!availableCode) {
        console.log('No winning codes available, treating as loss')
        isWinner = false
      } else {
        winningCode = availableCode
        console.log(`Assigned winning code: ${winningCode}`)

        // Assign the winning code to the user
        const { data: assignSuccess, error: assignError } = await supabase
          .rpc('assign_winning_code', {
            p_code: winningCode,
            p_shotguner_id: shotguner_id,
            p_shotguner_email: shotguner_email
          })

        if (assignError || !assignSuccess) {
          console.error('Error assigning winning code:', assignError)
          return new Response(
            JSON.stringify({ error: 'Failed to assign winning code' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    // Record the spin in the database
    const { error: spinRecordError } = await supabase
      .from('wheel_spins')
      .insert({
        shotguner_id: shotguner_id,
        shotguner_email: shotguner_email,
        status: isWinner ? 'win' : 'loss',
        winning_code: winningCode
      })

    if (spinRecordError) {
      console.error('Error recording spin:', spinRecordError)
      return new Response(
        JSON.stringify({ error: 'Failed to record spin result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Spin recorded successfully for user ${shotguner_id}: ${isWinner ? 'win' : 'loss'}`)

    // Return the result
    const response = {
      result: isWinner ? 'win' : 'loss',
      message: isWinner 
        ? `Congratulations! You won! Your winning code is: ${winningCode}`
        : 'Sorry, you didn\'t win this time. Better luck next time!',
      winning_code: winningCode
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in spin-wheel function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})