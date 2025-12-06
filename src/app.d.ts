import type { SupabaseClient, Session, User } from '@supabase/supabase-js';
import type { Database, UserRole } from '$lib/database.types';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>;
			session: Session | null;
			user: User | null;
			userProfile: {
				id: string;
				email: string;
				name: string;
				role: UserRole;
				phone: string | null;
			} | null;
		}
		interface PageData {
			session: Session | null;
			user: User | null;
			userProfile: {
				id: string;
				email: string;
				name: string;
				role: UserRole;
				phone: string | null;
			} | null;
		}
	}
}

export {};
