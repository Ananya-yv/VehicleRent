import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';

// GET /api/vehicles - List all vehicles (public)
export const GET: RequestHandler = async ({ url, locals }) => {
	const { supabase } = locals;

	let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

	// Apply filters
	const status = url.searchParams.get('status');
	const type = url.searchParams.get('type');
	const rentType = url.searchParams.get('rent_type');
	const search = url.searchParams.get('search');

	if (status) {
		query = query.eq('availability_status', status);
	}
	if (type) {
		query = query.eq('type', type);
	}
	if (rentType) {
		query = query.eq('rent_type', rentType);
	}
	if (search) {
		query = query.ilike('model', `%${search}%`);
	}

	const { data, error: fetchError } = await query;

	if (fetchError) {
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// POST /api/vehicles - Create a new vehicle (admin only)
export const POST: RequestHandler = async ({ request, locals }) => {
	requireAdmin({ locals } as any);

	const body = await parseJson(request);

	const vehicleData = validate(body, {
		model: { required: true, type: 'string', minLength: 2, maxLength: 255 },
		type: { required: true, type: 'string', minLength: 2, maxLength: 100 },
		rent_type: { required: true, type: 'string', enum: ['daily', 'hourly'] },
		rent_price: { required: true, type: 'number', min: 0 },
		condition: { type: 'string', maxLength: 255 },
		availability_status: { type: 'string', enum: ['available', 'booked', 'maintenance'] }
	});

	const { data, error: insertError } = await locals.supabase
		.from('vehicles')
		.insert({
			...vehicleData,
			availability_status: vehicleData.availability_status || 'available'
		})
		.select()
		.single();

	if (insertError) {
		throw error(500, { message: insertError.message });
	}

	return json({ data }, { status: 201 });
};
