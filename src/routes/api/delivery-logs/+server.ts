import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireDeliveryAgent, isAdmin, getCurrentUserId } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';

const selectQuery = `
	*,
	booking:bookings(
		id, customer_name, phone, delivery_location,
		vehicle:vehicles(model, type)
	),
	delivery_agent:users!delivery_logs_delivery_agent_id_fkey(id, name)
`;

// GET /api/delivery-logs - List delivery logs
export const GET: RequestHandler = async ({ url, locals }) => {
	const userProfile = requireDeliveryAgent({ locals } as any);

	let query = locals.supabase
		.from('delivery_logs')
		.select(selectQuery)
		.order('action_time', { ascending: false });

	// Delivery agents only see their own logs
	if (userProfile.role === 'delivery') {
		query = query.eq('delivery_agent_id', userProfile.id);
	}

	// Apply filters
	const bookingId = url.searchParams.get('booking_id');
	const agentId = url.searchParams.get('agent_id');
	const action = url.searchParams.get('action');

	if (bookingId) {
		query = query.eq('booking_id', bookingId);
	}
	if (agentId && isAdmin({ locals } as any)) {
		query = query.eq('delivery_agent_id', agentId);
	}
	if (action) {
		query = query.eq('action', action);
	}

	const { data, error: fetchError } = await query;

	if (fetchError) {
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// POST /api/delivery-logs - Create a delivery log
export const POST: RequestHandler = async ({ request, locals }) => {
	const userProfile = requireDeliveryAgent({ locals } as any);

	const body = await parseJson(request);

	const logData = validate(body, {
		booking_id: { required: true, type: 'uuid' },
		action: { required: true, type: 'string', enum: ['delivered', 'picked_up'] },
		notes: { type: 'string', maxLength: 1000 }
	});

	// Verify booking exists and is assigned to this agent
	const { data: booking } = await locals.supabase
		.from('bookings')
		.select('id, assigned_delivery_agent_id, vehicle_id, status')
		.eq('id', logData.booking_id)
		.single();

	if (!booking) {
		throw error(404, { message: 'Booking not found' });
	}

	if (userProfile.role !== 'admin' && booking.assigned_delivery_agent_id !== userProfile.id) {
		throw error(403, { message: 'Booking is not assigned to you' });
	}

	// Validate action based on current status
	if (logData.action === 'delivered' && booking.status !== 'confirmed') {
		throw error(400, { message: 'Booking must be confirmed before delivery' });
	}

	if (logData.action === 'picked_up' && booking.status !== 'delivered') {
		throw error(400, { message: 'Vehicle must be delivered before pickup' });
	}

	// Create delivery log
	const { data, error: insertError } = await locals.supabase
		.from('delivery_logs')
		.insert({
			booking_id: logData.booking_id,
			delivery_agent_id: userProfile.id,
			action: logData.action,
			notes: logData.notes,
			action_time: new Date().toISOString()
		})
		.select(selectQuery)
		.single();

	if (insertError) {
		throw error(500, { message: insertError.message });
	}

	// Update booking status
	const newStatus = logData.action === 'delivered' ? 'delivered' : 'returned';
	await locals.supabase.from('bookings').update({ status: newStatus }).eq('id', logData.booking_id);

	// If picked up, make vehicle available again
	if (logData.action === 'picked_up') {
		await locals.supabase
			.from('vehicles')
			.update({ availability_status: 'available' })
			.eq('id', booking.vehicle_id);
	}

	return json({ data }, { status: 201 });
};
