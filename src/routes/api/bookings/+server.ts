import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAuth, requireAdmin, isAdmin, getCurrentUserId } from '$lib/server/auth';
import { validate, parseJson } from '$lib/server/validation';
import { supabase } from '$lib/supabase';

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

// GET /api/bookings - List bookings (role-based filtering)
export const GET: RequestHandler = async ({ url, locals }) => {
	const userProfile = locals.userProfile;
	const { supabase } = locals;

	const selectQuery = `
		*,
		vehicle:vehicles(id, model, type, rent_price, rent_type),
		delivery_agent:users!bookings_assigned_delivery_agent_id_fkey(id, name, phone)
	`;

	let query = supabase.from('bookings').select(selectQuery).order('created_at', { ascending: false });

	// Role-based filtering
	if (userProfile?.role === 'delivery') {
		// Delivery agents only see their assigned bookings
		query = query.eq('assigned_delivery_agent_id', userProfile.id);
	} else if (userProfile?.role === 'helpline') {
		// Helpline agents can see all bookings (for complaint context)
	} else if (!userProfile || userProfile.role !== 'admin') {
		// Public/unauthenticated - need booking ID or phone to track
		const bookingId = url.searchParams.get('id');
		const phone = url.searchParams.get('phone');
		
		if (!bookingId && !phone) {
			throw error(400, { message: 'Booking ID or phone number required' });
		}
		
		if (bookingId) {
			query = query.eq('id', bookingId);
		}
		if (phone) {
			query = query.eq('phone', phone);
		}
	}

	// Apply filters
	const status = url.searchParams.get('status');
	const vehicleId = url.searchParams.get('vehicle_id');
	const agentId = url.searchParams.get('agent_id');

	if (status) {
		query = query.eq('status', status);
	}
	if (vehicleId) {
		query = query.eq('vehicle_id', vehicleId);
	}
	if (agentId && isAdmin({ locals } as any)) {
		query = query.eq('assigned_delivery_agent_id', agentId);
	}

	const { data, error: fetchError } = await query;

	if (fetchError) {
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// POST /api/bookings - Create a new booking (public)
export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await parseJson(request);

	const bookingData = validate(body, {
		vehicle_id: { required: true, type: 'uuid' },
		customer_name: { required: true, type: 'string', minLength: 2, maxLength: 255 },
		phone: { required: true, type: 'phone' },
		email: { required: true, type: 'email' },
		driving_license: { required: true, type: 'string', minLength: 5, maxLength: 100 },
		delivery_location: { required: true, type: 'string', minLength: 10 },
		start_date: { required: true, type: 'date' },
		end_date: { required: true, type: 'date' },
		advance_amount: { required: true, type: 'number', min: 0 }
	});

	// Validate dates
	const startDate = new Date(bookingData.start_date as string);
	const endDate = new Date(bookingData.end_date as string);

	if (endDate <= startDate) {
		throw error(400, { message: 'End date must be after start date' });
	}

	if (startDate < new Date()) {
		throw error(400, { message: 'Start date cannot be in the past' });
	}

	// Check vehicle availability
	const { data: vehicle } = await supabase
		.from('vehicles')
		.select('availability_status')
		.eq('id', bookingData.vehicle_id)
		.single();

	if (!vehicle) {
		throw error(404, { message: 'Vehicle not found' });
	}

	if (vehicle.availability_status !== 'available') {
		throw error(400, { message: 'Vehicle is not available for booking' });
	}

	// Create booking with OTP
	const otp_code = generateOTP();

	const { data, error: insertError } = await supabase
		.from('bookings')
		.insert({
			...bookingData,
			otp_code,
			status: 'pending'
		})
		.select(`
			*,
			vehicle:vehicles(id, model, type, rent_price, rent_type)
		`)
		.single();

	if (insertError) {
		throw error(500, { message: insertError.message });
	}

	// Update vehicle status
	await supabase
		.from('vehicles')
		.update({ availability_status: 'booked' })
		.eq('id', bookingData.vehicle_id);

	// Create advance transaction
	await supabase.from('transactions').insert({
		booking_id: data.id,
		transaction_type: 'advance',
		amount: bookingData.advance_amount,
		payment_status: 'success'
	});

	return json({ data }, { status: 201 });
};
