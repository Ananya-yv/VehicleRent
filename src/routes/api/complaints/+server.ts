import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validate, parseJson } from '$lib/server/validation';
import { supabase } from '$lib/supabase';

const selectQuery = `
  *,
  booking:bookings(
    id, customer_name, phone, email,
    vehicle:vehicles(model, type)
  ),
  helpline_agent:users!complaints_helpline_agent_id_fkey(id, name, phone)
`;

// GET /api/complaints
export const GET: RequestHandler = async ({ url, locals }) => {
  const userProfile = locals.userProfile;
  if (!userProfile) throw error(401, { message: 'Authentication required' });

  if (userProfile.role !== 'helpline' && userProfile.role !== 'admin')
    throw error(403, { message: 'Access denied' });

  let query = supabase.from('complaints').select(selectQuery).order('created_at', { ascending: false });

  const status = url.searchParams.get('status');
  const priority = url.searchParams.get('priority');
  const agentId = url.searchParams.get('agent_id');
  const bookingId = url.searchParams.get('booking_id');
  const unassigned = url.searchParams.get('unassigned');
  const mine = url.searchParams.get('mine');

  if (status) query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);
  if (agentId) query = query.eq('helpline_agent_id', agentId);
  if (bookingId) query = query.eq('booking_id', bookingId);
  if (unassigned === 'true') query = query.is('helpline_agent_id', null);
  if (mine === 'true' && userProfile.role === 'helpline') query = query.eq('helpline_agent_id', userProfile.id);

  const { data, error: fetchError } = await query;
  if (fetchError) throw error(500, { message: fetchError.message });

  return json({ data });
};

// POST /api/complaints
export const POST: RequestHandler = async ({ request }) => {
  const body = await parseJson(request);

  const complaintData = validate<{
    booking_id: string;
    description: string;
    priority?: 'low' | 'medium' | 'high';
  }>(body, {
    booking_id: { required: true, type: 'uuid' },
    description: { required: true, type: 'string', minLength: 10, maxLength: 1000 },
    priority: { type: 'string', enum: ['low', 'medium', 'high'] }
  });

  // Verify booking exists
  const { data: booking } = await supabase
    .from('bookings')
    .select('id')
    .eq('id', complaintData.booking_id)
    .single();

  if (!booking) throw error(404, { message: 'Booking not found' });

  // Insert complaint
  const { data, error: insertError } = await supabase
    .from('complaints')
    .insert({
      booking_id: complaintData.booking_id,
      description: complaintData.description,
      priority: complaintData.priority ?? 'medium',
      status: 'pending'
    })
    .select(selectQuery)
    .single();

  if (insertError) throw error(500, { message: insertError.message });

  return json({ data }, { status: 201 });
};
