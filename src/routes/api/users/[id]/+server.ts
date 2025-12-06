import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';

// GET /api/users/:id - Get a single user (admin only)
export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;

	const { data, error: fetchError } = await locals.supabase
		.from('users')
		.select('*')
		.eq('id', id)
		.single();

	if (fetchError) {
		if (fetchError.code === 'PGRST116') {
			throw error(404, { message: 'User not found' });
		}
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// PUT /api/users/:id - Update a user (admin only)
export const PUT: RequestHandler = async ({ params, request, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;
	const body = await parseJson(request);

	const userData = validate(body, {
		name: { type: 'string', minLength: 2, maxLength: 255 },
		phone: { type: 'phone' },
		role: { type: 'string', enum: ['admin', 'delivery', 'helpline'] }
	});

	const { data, error: updateError } = await locals.supabase
		.from('users')
		.update(userData)
		.eq('id', id)
		.select()
		.single();

	if (updateError) {
		if (updateError.code === 'PGRST116') {
			throw error(404, { message: 'User not found' });
		}
		throw error(500, { message: updateError.message });
	}

	return json({ data });
};

// DELETE /api/users/:id - Delete a user (admin only)
export const DELETE: RequestHandler = async ({ params, locals }) => {
	requireAdmin({ locals } as any);

	const { id } = params;

	// Check for active assignments
	const { data: activeBookings } = await locals.supabase
		.from('bookings')
		.select('id')
		.eq('assigned_delivery_agent_id', id)
		.in('status', ['pending', 'confirmed', 'delivered'])
		.limit(1);

	if (activeBookings && activeBookings.length > 0) {
		throw error(400, { message: 'Cannot delete user with active bookings assigned' });
	}

	const { data: activeComplaints } = await locals.supabase
		.from('complaints')
		.select('id')
		.eq('helpline_agent_id', id)
		.in('status', ['pending', 'in_progress'])
		.limit(1);

	if (activeComplaints && activeComplaints.length > 0) {
		throw error(400, { message: 'Cannot delete user with active complaints assigned' });
	}

	// Note: This only removes from users table
	// Full deletion requires Supabase Admin API to delete from auth.users
	const { error: deleteError } = await locals.supabase.from('users').delete().eq('id', id);

	if (deleteError) {
		throw error(500, { message: deleteError.message });
	}

	return json({ message: 'User deleted successfully' });
};
