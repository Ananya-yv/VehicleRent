import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireAdmin, isAdmin, isDeliveryAgent, getCurrentUserId } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';
import { supabase } from '$lib/supabase';

const selectQuery = `
	*,
	vehicle:vehicles(id, model, type, rent_price, rent_type),
	delivery_agent:users!bookings_assigned_delivery_agent_id_fkey(id, name, phone)
`;

// GET /api/bookings/:id - Get a single booking
export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;

	const { data, error: fetchError } = await supabase
		.from('bookings')
		.select(selectQuery)
		.eq('id', id)
		.single();

	if (fetchError) {
		if (fetchError.code === 'PGRST116') {
			throw error(404, { message: 'Booking not found' });
		}
		throw error(500, { message: fetchError.message });
	}

	// Check access
	const userProfile = locals.userProfile;
	if (userProfile?.role === 'delivery' && data.assigned_delivery_agent_id !== userProfile.id) {
		throw error(403, { message: 'Access denied' });
	}

	return json({ data });
};

// PUT /api/bookings/:id - Update a booking
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const userProfile = requireAuth({ locals } as any);
	const { id } = params;
	const body = await parseJson(request);

	// Get current booking
	const { data: currentBooking } = await supabase
		.from('bookings')
		.select('*')
		.eq('id', id)
		.single();

	if (!currentBooking) {
		throw error(404, { message: 'Booking not found' });
	}

	// Role-based update permissions
	let allowedFields: string[] = [];

	if (userProfile.role === 'admin') {
		allowedFields = ['status', 'assigned_delivery_agent_id', 'delivery_location', 'start_date', 'end_date'];
	} else if (userProfile.role === 'delivery') {
		// Delivery agents can only update status of their assigned bookings
		if (currentBooking.assigned_delivery_agent_id !== userProfile.id) {
			throw error(403, { message: 'Access denied' });
		}
		allowedFields = ['status'];
	} else {
		throw error(403, { message: 'Access denied' });
	}

	// Filter body to only allowed fields
	const filteredBody: Record<string, unknown> = {};
	for (const field of allowedFields) {
		if (field in (body as object)) {
			filteredBody[field] = (body as Record<string, unknown>)[field];
		}
	}

	const bookingData = validate(filteredBody, {
		status: { type: 'string', enum: ['pending', 'confirmed', 'delivered', 'returned', 'cancelled'] },
		assigned_delivery_agent_id: { type: 'uuid' },
		delivery_location: { type: 'string', minLength: 10 },
		start_date: { type: 'date' },
		end_date: { type: 'date' }
	});

	const { data, error: updateError } = await supabase
		.from('bookings')
		.update(bookingData)
		.eq('id', id)
		.select(selectQuery)
		.single();

	if (updateError) {
		throw error(500, { message: updateError.message });
	}

	// Handle status-related side effects
	if (bookingData.status === 'returned' || bookingData.status === 'cancelled') {
		await supabase
			.from('vehicles')
			.update({ availability_status: 'available' })
			.eq('id', currentBooking.vehicle_id);
	}

	// If assigning agent, update status to confirmed
	if (bookingData.assigned_delivery_agent_id && currentBooking.status === 'pending') {
		await supabase
			.from('bookings')
			.update({ status: 'confirmed' })
			.eq('id', id);
	}

	return json({ data });
};

// DELETE /api/bookings/:id - Cancel a booking (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;

	// Get booking to release vehicle
	const { data: booking } = await supabase
		.from('bookings')
		.select('vehicle_id, status')
		.eq('id', id)
		.single();

	if (!booking) {
		throw error(404, { message: 'Booking not found' });
	}

	if (booking.status === 'delivered') {
		throw error(400, { message: 'Cannot delete a delivered booking' });
	}

	// Update booking status to cancelled
	const { error: updateError } = await supabase
		.from('bookings')
		.update({ status: 'cancelled' })
		.eq('id', id);

	if (updateError) {
		throw error(500, { message: updateError.message });
	}

	// Release vehicle
	await supabase
		.from('vehicles')
		.update({ availability_status: 'available' })
		.eq('id', booking.vehicle_id);

	return json({ message: 'Booking cancelled successfully' });
};
