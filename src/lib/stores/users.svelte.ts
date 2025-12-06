import { supabase } from '$lib/supabase';
import type { UserRole } from '$lib/database.types';

export interface User {
	id: string;
	name: string;
	email: string;
	role: UserRole;
	phone: string | null;
	created_at: string;
}

export interface UserFilters {
	role?: UserRole;
	search?: string;
}

export interface UpdateUserData {
	name?: string;
	phone?: string;
	role?: UserRole;
}

function createUserStore() {
	let users = $state<User[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function fetchAll(filters?: UserFilters): Promise<User[]> {
		loading = true;
		error = null;

		try {
			let query = supabase.from('users').select('*').order('created_at', { ascending: false });

			if (filters?.role) {
				query = query.eq('role', filters.role);
			}
			if (filters?.search) {
				query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
			}

			const { data, error: fetchError } = await query;

			if (fetchError) throw fetchError;
			users = (data as User[]) || [];
			return users;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch users';
			return [];
		} finally {
			loading = false;
		}
	}

	async function fetchById(id: string): Promise<User | null> {
		const { data, error: fetchError } = await supabase
			.from('users')
			.select('*')
			.eq('id', id)
			.single();

		if (fetchError) {
			error = fetchError.message;
			return null;
		}
		return data as User;
	}

	async function update(id: string, updates: UpdateUserData): Promise<User | null> {
		loading = true;
		error = null;

		const previousUsers = [...users];
		users = users.map((u) => (u.id === id ? { ...u, ...updates } : u));

		try {
			const { data, error: updateError } = await supabase
				.from('users')
				.update(updates)
				.eq('id', id)
				.select()
				.single();

			if (updateError) throw updateError;

			const updatedUser = data as User;
			users = users.map((u) => (u.id === id ? updatedUser : u));
			return updatedUser;
		} catch (e) {
			users = previousUsers;
			error = e instanceof Error ? e.message : 'Failed to update user';
			return null;
		} finally {
			loading = false;
		}
	}

	async function remove(id: string): Promise<boolean> {
		loading = true;
		error = null;

		const previousUsers = [...users];
		users = users.filter((u) => u.id !== id);

		try {
			// Note: This only removes from users table, not auth.users
			// For full deletion, use Supabase admin API
			const { error: deleteError } = await supabase.from('users').delete().eq('id', id);

			if (deleteError) throw deleteError;
			return true;
		} catch (e) {
			users = previousUsers;
			error = e instanceof Error ? e.message : 'Failed to delete user';
			return false;
		} finally {
			loading = false;
		}
	}

	function getByRole(role: UserRole): User[] {
		return users.filter((u) => u.role === role);
	}

	function getDeliveryAgents(): User[] {
		return getByRole('delivery');
	}

	function getHelplineAgents(): User[] {
		return getByRole('helpline');
	}

	return {
		get users() {
			return users;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchAll,
		fetchById,
		update,
		remove,
		getByRole,
		getDeliveryAgents,
		getHelplineAgents
	};
}

export const userStore = createUserStore();
