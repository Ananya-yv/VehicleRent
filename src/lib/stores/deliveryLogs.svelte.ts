import { supabase } from '$lib/supabase';
import type { DeliveryAction } from '$lib/database.types';

export interface DeliveryLog {
	id: string;
	booking_id: string;
	delivery_agent_id: string;
	action: DeliveryAction;
	action_time: string;
	notes: string | null;
	// Joined fields
	booking?: {
		id: string;
		customer_name: string;
		phone: string;
		delivery_location: string;
		vehicle: {
			model: string;
			type: string;
		};
	};
	delivery_agent?: {
		id: string;
		name: string;
	};
}

export interface DeliveryLogFilters {
	booking_id?: string;
	delivery_agent_id?: string;
	action?: DeliveryAction;
}

export interface CreateDeliveryLogData {
	booking_id: string;
	delivery_agent_id: string;
	action: DeliveryAction;
	notes?: string;
}

function createDeliveryLogStore() {
	let logs = $state<DeliveryLog[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const selectQuery = `
		*,
		booking:bookings(
			id, customer_name, phone, delivery_location,
			vehicle:vehicles(model, type)
		),
		delivery_agent:users!delivery_logs_delivery_agent_id_fkey(id, name)
	`;

	async function fetchAll(filters?: DeliveryLogFilters): Promise<DeliveryLog[]> {
		loading = true;
		error = null;

		try {
			let query = supabase
				.from('delivery_logs')
				.select(selectQuery)
				.order('action_time', { ascending: false });

			if (filters?.booking_id) {
				query = query.eq('booking_id', filters.booking_id);
			}
			if (filters?.delivery_agent_id) {
				query = query.eq('delivery_agent_id', filters.delivery_agent_id);
			}
			if (filters?.action) {
				query = query.eq('action', filters.action);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			logs = (data as DeliveryLog[]) || [];
			return logs;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch delivery logs';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchByBooking(bookingId: string): Promise<DeliveryLog[]> {
		return fetchAll({ booking_id: bookingId });
	}

	async function fetchByAgent(agentId: string): Promise<DeliveryLog[]> {
		return fetchAll({ delivery_agent_id: agentId });
	}

	async function create(logData: CreateDeliveryLogData): Promise<DeliveryLog | null> {
		loading = true;
		error = null;

		try {
			const { data, error: insertError } = await supabase
				.from('delivery_logs')
				.insert({
					...logData,
					action_time: new Date().toISOString()
				})
				.select(selectQuery)
				.single();

			if (insertError) throw insertError;

			const newLog = data as DeliveryLog;
			logs = [newLog, ...logs];

			// Update booking status based on action
			const newStatus = logData.action === 'delivered' ? 'delivered' : 'returned';
			await supabase.from('bookings').update({ status: newStatus }).eq('id', logData.booking_id);

			// If picked up, make vehicle available again
			if (logData.action === 'picked_up') {
				const { data: booking } = await supabase
					.from('bookings')
					.select('vehicle_id')
					.eq('id', logData.booking_id)
					.single();

				if (booking) {
					await supabase
						.from('vehicles')
						.update({ availability_status: 'available' })
						.eq('id', booking.vehicle_id);
				}
			}

			return newLog;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create delivery log';
			return null;
		} finally {
			loading = false;
		}
	}

	async function update(id: string, notes: string): Promise<DeliveryLog | null> {
		loading = true;
		error = null;

		try {
			const { data, error: updateError } = await supabase
				.from('delivery_logs')
				.update({ notes })
				.eq('id', id)
				.select(selectQuery)
				.single();

			if (updateError) throw updateError;

			const updatedLog = data as DeliveryLog;
			logs = logs.map((l) => (l.id === id ? updatedLog : l));
			return updatedLog;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update delivery log';
			return null;
		} finally {
			loading = false;
		}
	}

	function getByAction(action: DeliveryAction): DeliveryLog[] {
		return logs.filter((l) => l.action === action);
	}

	return {
		get logs() {
			return logs;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchAll,
		fetchByBooking,
		fetchByAgent,
		create,
		update,
		getByAction
	};
}

export const deliveryLogStore = createDeliveryLogStore();
