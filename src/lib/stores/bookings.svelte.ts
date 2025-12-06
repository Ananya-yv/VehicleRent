import { supabase } from '$lib/supabase';
import type { BookingStatus } from '$lib/database.types';

export interface Booking {
	id: string;
	vehicle_id: string;
	customer_name: string;
	phone: string;
	email: string;
	driving_license: string;
	delivery_location: string;
	start_date: string;
	end_date: string;
	advance_amount: number;
	status: BookingStatus;
	otp_code: string | null;
	assigned_delivery_agent_id: string | null;
	created_at: string;
	updated_at: string;
	// Joined fields
	vehicle?: {
		id: string;
		model: string;
		type: string;
		rent_price: number;
		rent_type: string;
	};
	delivery_agent?: {
		id: string;
		name: string;
		phone: string;
	};
}

export interface BookingFilters {
	status?: BookingStatus;
	vehicle_id?: string;
	assigned_delivery_agent_id?: string;
	search?: string;
}

export interface CreateBookingData {
	vehicle_id: string;
	customer_name: string;
	phone: string;
	email: string;
	driving_license: string;
	delivery_location: string;
	start_date: string;
	end_date: string;
	advance_amount: number;
}

export interface UpdateBookingData {
	status?: BookingStatus;
	assigned_delivery_agent_id?: string;
	delivery_location?: string;
	start_date?: string;
	end_date?: string;
}

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

function createBookingStore() {
	let bookings = $state<Booking[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const selectQuery = `
		*,
		vehicle:vehicles(id, model, type, rent_price, rent_type),
		delivery_agent:users!bookings_assigned_delivery_agent_id_fkey(id, name, phone)
	`;

	async function fetchAll(filters?: BookingFilters): Promise<Booking[]> {
		loading = true;
		error = null;

		try {
			let query = supabase.from('bookings').select(selectQuery).order('created_at', { ascending: false });

			if (filters?.status) {
				query = query.eq('status', filters.status);
			}
			if (filters?.vehicle_id) {
				query = query.eq('vehicle_id', filters.vehicle_id);
			}
			if (filters?.assigned_delivery_agent_id) {
				query = query.eq('assigned_delivery_agent_id', filters.assigned_delivery_agent_id);
			}
			if (filters?.search) {
				query = query.or(`customer_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			bookings = (data as Booking[]) || [];
			return bookings;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch bookings';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchById(id: string): Promise<Booking | null> {
		const { data, error: fetchError } = await supabase
			.from('bookings')
			.select(selectQuery)
			.eq('id', id)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as Booking;
	}

	async function fetchByOTP(otp: string, phone: string): Promise<Booking | null> {
		const { data, error: fetchError } = await supabase
			.from('bookings')
			.select(selectQuery)
			.eq('otp_code', otp)
			.eq('phone', phone)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as Booking;
	}

	async function create(bookingData: CreateBookingData): Promise<Booking | null> {
		loading = true;
		error = null;

		try {
			const otp_code = generateOTP();

			const { data, error: insertError } = await supabase
				.from('bookings')
				.insert({ ...bookingData, otp_code, status: 'pending' })
				.select(selectQuery)
				.single();

			if (insertError) throw insertError;

			const newBooking = data as Booking;
			bookings = [newBooking, ...bookings];

			// Update vehicle status to booked
			await supabase
				.from('vehicles')
				.update({ availability_status: 'booked' })
				.eq('id', bookingData.vehicle_id);

			return newBooking;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create booking';
			return null;
		} finally {
			loading = false;
		}
	}

	async function update(id: string, updates: UpdateBookingData): Promise<Booking | null> {
		loading = true;
		error = null;

		const previousBookings = [...bookings];
		bookings = bookings.map((b) => (b.id === id ? { ...b, ...updates } : b));

		try {
			const { data, error: updateError } = await supabase
				.from('bookings')
				.update(updates)
				.eq('id', id)
				.select(selectQuery)
				.single();

			if (updateError) throw updateError;

			const updatedBooking = data as Booking;
			bookings = bookings.map((b) => (b.id === id ? updatedBooking : b));
			return updatedBooking;
		} catch (e) {
			bookings = previousBookings;
			error = e instanceof Error ? e.message : 'Failed to update booking';
			return null;
		} finally {
			loading = false;
		}
	}

	async function assignAgent(bookingId: string, agentId: string): Promise<Booking | null> {
		return update(bookingId, {
			assigned_delivery_agent_id: agentId,
			status: 'confirmed'
		});
	}

	async function updateStatus(bookingId: string, status: BookingStatus): Promise<Booking | null> {
		const booking = bookings.find((b) => b.id === bookingId);

		const result = await update(bookingId, { status });

		// Update vehicle status based on booking status
		if (result && booking) {
			if (status === 'returned' || status === 'cancelled') {
				await supabase
					.from('vehicles')
					.update({ availability_status: 'available' })
					.eq('id', booking.vehicle_id);
			}
		}

		return result;
	}

	async function cancel(id: string): Promise<boolean> {
		const booking = bookings.find((b) => b.id === id);
		const result = await updateStatus(id, 'cancelled');
		return result !== null;
	}

	function getByStatus(status: BookingStatus): Booking[] {
		return bookings.filter((b) => b.status === status);
	}

	function getByAgent(agentId: string): Booking[] {
		return bookings.filter((b) => b.assigned_delivery_agent_id === agentId);
	}

	return {
		get bookings() {
			return bookings;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchAll,
		fetchById,
		fetchByOTP,
		create,
		update,
		assignAgent,
		updateStatus,
		cancel,
		getByStatus,
		getByAgent
	};
}

export const bookingStore = createBookingStore();
