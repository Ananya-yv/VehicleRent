import type { Database } from '$lib/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '$lib/server/auth';

declare module '@sveltejs/kit' {
	interface Locals {
		supabase: SupabaseClient<Database>;
		session: import('@supabase/supabase-js').Session | null;
		user: import('@supabase/supabase-js').User | null;
		userProfile: UserProfile | null;
	}
}
