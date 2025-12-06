import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';

// POST /api/bookings/:id/assign - Assign a delivery agent (admin only)
export const POST: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;
	const body = await parseJson(request);

	const assignData = validate(body, {
		delivery_agent_id: { required: true, type: 'uuid' }
	});

	// Verify agent exists and is a delivery agent
	const { data: agent } = await locals.supabase
		.from('users')
		.select('id, role')
		.eq('id', assignData.delivery_agent_id)
		.single();

	if (!agent) {
		throw error(404, { message: 'Delivery agent not found' });
	}

	if (agent.role !== 'delivery') {
		throw error(400, { message: 'User is not a delivery agent' });
	}

	// Update booking
	const { data, error: updateError } = await locals.supabase
		.from('bookings')
		.update({
			assigned_delivery_agent_id: assignData.delivery_agent_id,
			status: 'confirmed'
		})
		.eq('id', id)
		.select(`
			*,
			vehicle:vehicles(id, model, type, rent_price, rent_type),
			delivery_agent:users!bookings_assigned_delivery_agent_id_fkey(id, name, phone)
		`)
		.single();

	if (updateError) {
		if (updateError.code === 'PGRST116') {
			throw error(404, { message: 'Booking not found' });
		}
		throw error(500, { message: updateError.message });
	}

	return json({ data });
};
