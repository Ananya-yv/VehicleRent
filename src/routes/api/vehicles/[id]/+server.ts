import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';

// GET /api/vehicles/:id - Get a single vehicle (public)
export const GET: RequestHandler = async ({ params, locals }) => {
	const { id } = params;

	const { data, error: fetchError } = await locals.supabase
		.from('vehicles')
		.select('*')
		.eq('id', id)
		.single();

	if (fetchError) {
		if (fetchError.code === 'PGRST116') {
			throw error(404, { message: 'Vehicle not found' });
		}
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// PUT /api/vehicles/:id - Update a vehicle (admin only)
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;
	const body = await parseJson(request);

	const vehicleData = validate(body, {
		model: { type: 'string', minLength: 2, maxLength: 255 },
		type: { type: 'string', minLength: 2, maxLength: 100 },
		rent_type: { type: 'string', enum: ['daily', 'hourly'] },
		rent_price: { type: 'number', min: 0 },
		condition: { type: 'string', maxLength: 255 },
		availability_status: { type: 'string', enum: ['available', 'booked', 'maintenance'] }
	});

	const { data, error: updateError } = await locals.supabase
		.from('vehicles')
		.update(vehicleData)
		.eq('id', id)
		.select()
		.single();

	if (updateError) {
		if (updateError.code === 'PGRST116') {
			throw error(404, { message: 'Vehicle not found' });
		}
		throw error(500, { message: updateError.message });
	}

	return json({ data });
};

// DELETE /api/vehicles/:id - Delete a vehicle (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;

	// Check if vehicle has active bookings
	const { data: activeBookings } = await locals.supabase
		.from('bookings')
		.select('id')
		.eq('vehicle_id', id)
		.in('status', ['pending', 'confirmed', 'delivered'])
		.limit(1);

	if (activeBookings && activeBookings.length > 0) {
		throw error(400, { message: 'Cannot delete vehicle with active bookings' });
	}

	const { error: deleteError } = await locals.supabase.from('vehicles').delete().eq('id', id);

	if (deleteError) {
		throw error(500, { message: deleteError.message });
	}

	return json({ message: 'Vehicle deleted successfully' });
};
