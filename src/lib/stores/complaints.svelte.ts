import { supabase } from '$lib/supabase';
import type { ComplaintPriority, ComplaintStatus } from '$lib/database.types';

export interface Complaint {
	id: string;
	booking_id: string;
	description: string;
	priority: ComplaintPriority;
	status: ComplaintStatus;
	helpline_agent_id: string | null;
	created_at: string;
	updated_at: string;
	// Joined fields
	booking?: {
		id: string;
		customer_name: string;
		phone: string;
		email: string;
		vehicle: {
			model: string;
			type: string;
		};
	};
	helpline_agent?: {
		id: string;
		name: string;
		phone: string;
	};
}

export interface ComplaintFilters {
	status?: ComplaintStatus;
	priority?: ComplaintPriority;
	helpline_agent_id?: string;
	booking_id?: string;
	unassigned?: boolean;
}

export interface CreateComplaintData {
	booking_id: string;
	description: string;
	priority?: ComplaintPriority;
}

export interface UpdateComplaintData {
	description?: string;
	priority?: ComplaintPriority;
	status?: ComplaintStatus;
	helpline_agent_id?: string;
}

function createComplaintStore() {
	let complaints = $state<Complaint[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const selectQuery = `
		*,
		booking:bookings(
			id, customer_name, phone, email,
			vehicle:vehicles(model, type)
		),
		helpline_agent:users!complaints_helpline_agent_id_fkey(id, name, phone)
	`;

	async function fetchAll(filters?: ComplaintFilters): Promise<Complaint[]> {
		loading = true;
		error = null;

		try {
			let query = supabase
				.from('complaints')
				.select(selectQuery)
				.order('created_at', { ascending: false });

			if (filters?.status) {
				query = query.eq('status', filters.status);
			}
			if (filters?.priority) {
				query = query.eq('priority', filters.priority);
			}
			if (filters?.helpline_agent_id) {
				query = query.eq('helpline_agent_id', filters.helpline_agent_id);
			}
			if (filters?.booking_id) {
				query = query.eq('booking_id', filters.booking_id);
			}
			if (filters?.unassigned) {
				query = query.is('helpline_agent_id', null);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			complaints = (data as Complaint[]) || [];
			return complaints;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch complaints';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchById(id: string): Promise<Complaint | null> {
		const { data, error: fetchError } = await supabase
			.from('complaints')
			.select(selectQuery)
			.eq('id', id)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as Complaint;
	}

	async function create(complaintData: CreateComplaintData): Promise<Complaint | null> {
		loading = true;
		error = null;

		try {
			const { data, error: insertError } = await supabase
				.from('complaints')
				.insert({
					...complaintData,
					priority: complaintData.priority || 'medium',
					status: 'pending'
				})
				.select(selectQuery)
				.single();

			if (insertError) throw insertError;

			const newComplaint = data as Complaint;
			complaints = [newComplaint, ...complaints];
			return newComplaint;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create complaint';
			return null;
		} finally {
			loading = false;
		}
	}

	async function update(id: string, updates: UpdateComplaintData): Promise<Complaint | null> {
		loading = true;
		error = null;

		const previousComplaints = [...complaints];
		complaints = complaints.map((c) => (c.id === id ? { ...c, ...updates } : c));

		try {
			const { data, error: updateError } = await supabase
				.from('complaints')
				.update(updates)
				.eq('id', id)
				.select(selectQuery)
				.single();

			if (updateError) throw updateError;

			const updatedComplaint = data as Complaint;
			complaints = complaints.map((c) => (c.id === id ? updatedComplaint : c));
			return updatedComplaint;
		} catch (e) {
			complaints = previousComplaints;
			error = e instanceof Error ? e.message : 'Failed to update complaint';
			return null;
		} finally {
			loading = false;
		}
	}

	async function assign(complaintId: string, agentId: string): Promise<Complaint | null> {
		return update(complaintId, {
			helpline_agent_id: agentId,
			status: 'in_progress'
		});
	}

	async function claim(complaintId: string, agentId: string): Promise<Complaint | null> {
		return assign(complaintId, agentId);
	}

	async function updateStatus(
		complaintId: string,
		status: ComplaintStatus
	): Promise<Complaint | null> {
		return update(complaintId, { status });
	}

	async function resolve(complaintId: string): Promise<Complaint | null> {
		return updateStatus(complaintId, 'resolved');
	}

	async function remove(id: string): Promise<boolean> {
		loading = true;
		error = null;

		const previousComplaints = [...complaints];
		complaints = complaints.filter((c) => c.id !== id);

		try {
			const { error: deleteError } = await supabase.from('complaints').delete().eq('id', id);

			if (deleteError) throw deleteError;
			return true;
		} catch (e) {
			complaints = previousComplaints;
			error = e instanceof Error ? e.message : 'Failed to delete complaint';
			return false;
		} finally {
			loading = false;
		}
	}

	function getByStatus(status: ComplaintStatus): Complaint[] {
		return complaints.filter((c) => c.status === status);
	}

	function getByPriority(priority: ComplaintPriority): Complaint[] {
		return complaints.filter((c) => c.priority === priority);
	}

	function getUnassigned(): Complaint[] {
		return complaints.filter((c) => c.helpline_agent_id === null);
	}

	function getByAgent(agentId: string): Complaint[] {
		return complaints.filter((c) => c.helpline_agent_id === agentId);
	}

	return {
		get complaints() {
			return complaints;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchAll,
		fetchById,
		create,
		update,
		assign,
		claim,
		updateStatus,
		resolve,
		remove,
		getByStatus,
		getByPriority,
		getUnassigned,
		getByAgent
	};
}

export const complaintStore = createComplaintStore();
