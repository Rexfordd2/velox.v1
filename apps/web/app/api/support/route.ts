import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { env } from '../../../lib/env'

// Initialize Supabase client
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL || '',
  env.SUPABASE_SERVICE_KEY || ''
)

// Ticket schema for validation
const ticketSchema = z.object({
  type: z.enum(['bug', 'feature', 'feedback', 'support']),
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  email: z.string().email('Please enter a valid email').optional(),
  attachments: z.array(z.any()).optional(),
  userContext: z.object({
    url: z.string(),
    browser: z.string(),
    device: z.string(),
    timestamp: z.string(),
  }),
  metadata: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    appVersion: z.string().optional(),
  }).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate request body
    const ticket = ticketSchema.parse(body)

    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Store ticket in database
    const { error: dbError } = await supabase
      .from('support_tickets')
      .insert({
        id: ticketId,
        ...ticket,
        status: 'open',
        created_at: new Date().toISOString(),
      })

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    // If email provided, send confirmation
    if (ticket.email) {
      await sendTicketConfirmation(ticket.email, ticketId)
    }

    // Return success response
    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support ticket created successfully',
    })

  } catch (error) {
    console.error('Error creating support ticket:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    const email = searchParams.get('email')

    if (!ticketId && !email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Either ticketId or email is required' 
        },
        { status: 400 }
      )
    }

    let query = supabase.from('support_tickets').select('*')

    if (ticketId) {
      query = query.eq('id', ticketId)
    }

    if (email) {
      query = query.eq('email', email)
    }

    const { data: tickets, error: dbError } = await query

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    return NextResponse.json({
      success: true,
      tickets,
    })

  } catch (error) {
    console.error('Error fetching support tickets:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}

async function sendTicketConfirmation(email: string, ticketId: string) {
  try {
    // Implement email sending logic here
    // You could use a service like SendGrid, AWS SES, etc.
    console.log(`Sending confirmation email to ${email} for ticket ${ticketId}`)
  } catch (error) {
    console.error('Error sending confirmation email:', error)
  }
} 