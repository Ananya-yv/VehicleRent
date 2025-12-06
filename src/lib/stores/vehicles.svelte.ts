import { supabase } from '$lib/supabase';
import type { AvailabilityStatus, RentType } from '$lib/database.types';

export interface Vehicle {
	id: string;
	model: string;
	type: string;
	rent_type: RentType;
	rent_price: number;
	condition: string | null;
	availability_status: AvailabilityStatus;
	created_at: string;
	updated_at: string;
}

export interface VehicleFilters {
	search?: string;
	type?: string;
	rent_type?: RentType;
	availability_status?: AvailabilityStatus;
}

export interface CreateVehicleData {
	model: string;
	type: string;
	rent_type: RentType;
	rent_price: number;
	condition?: string;
	availability_status?: AvailabilityStatus;
}

export interface UpdateVehicleData {
	model?: string;
	type?: string;
	rent_type?: RentType;
	rent_price?: number;
	condition?: string;
	availability_status?: AvailabilityStatus;
}

function createVehicleStore() {
	let vehicles = $state<Vehicle[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function fetchAll(filters?: VehicleFilters): Promise<Vehicle[]> {
		loading = true;
		error = null;

		try {
			let query = supabase.from('vehicles').select('*').order('created_at', { ascending: false });

			if (filters?.availability_status) {
				query = query.eq('availability_status', filters.availability_status);
			}
			if (filters?.type) {
				query = query.eq('type', filters.type);
			}
			if (filters?.rent_type) {
				query = query.eq('rent_type', filters.rent_type);
			}
			if (filters?.search) {
				query = query.ilike('model', `%${filters.search}%`);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			vehicles = (data as Vehicle[]) || [];
			return vehicles;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch vehicles';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchById(id: string): Promise<Vehicle | null> {
		const { data, error: fetchError } = await supabase
			.from('vehicles')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as Vehicle;
	}

	async function create(vehicleData: CreateVehicleData): Promise<Vehicle | null> {
		loading = true;
		error = null;

		try {
			const { data, error: insertError } = await supabase
				.from('vehicles')
				.insert(vehicleData)
				.select()
				.single();

			if (insertError) throw insertError;

			const newVehicle = data as Vehicle;
			vehicles = [newVehicle, ...vehicles];
			return newVehicle;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create vehicle';
			return null;
		} finally {
			loading = false;
		}
	}

	async function update(id: string, updates: UpdateVehicleData): Promise<Vehicle | null> {
		loading = true;
		error = null;

		// Optimistic update
		const previousVehicles = [...vehicles];
		vehicles = vehicles.map((v) => (v.id === id ? { ...v, ...updates } : v));

		try {
			const { data, error: updateError } = await supabase
				.from('vehicles')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (updateError) throw updateError;

			const updatedVehicle = data as Vehicle;
			vehicles = vehicles.map((v) => (v.id === id ? updatedVehicle : v));
			return updatedVehicle;
		} catch (e) {
			// Rollback on error
			vehicles = previousVehicles;
			error = e instanceof Error ? e.message : 'Failed to update vehicle';
			return null;
		} finally {
			loading = false;
		}
	}

	async function remove(id: string): Promise<boolean> {
		loading = true;
		error = null;

		// Optimistic update
		const previousVehicles = [...vehicles];
		vehicles = vehicles.filter((v) => v.id !== id);

		try {
			const { error: deleteError } = await supabase.from('vehicles').delete().eq('id', id);

			if (deleteError) throw deleteError;
			return true;
		} catch (e) {
			// Rollback on error
			vehicles = previousVehicles;
			error = e instanceof Error ? e.message : 'Failed to delete vehicle';
			return false;
		} finally {
			loading = false;
		}
	}

	function getAvailableVehicles(): Vehicle[] {
		return vehicles.filter((v) => v.availability_status === 'available');
	}

	function getVehicleTypes(): string[] {
		return [...new Set(vehicles.map((v) => v.type))];
	}

	return {
		get vehicles() {
			return vehicles;
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
		remove,
		getAvailableVehicles,
		getVehicleTypes
	};
}

export const vehicleStore = createVehicleStore();
