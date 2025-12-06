import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { env } from '$env/dynamic/private';
import type { Database } from './database.types';

function createAdminClient(): SupabaseClient<Database> | null {
	const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!serviceRoleKey) {
		console.warn('SUPABASE_SERVICE_ROLE_KEY not set - admin client unavailable');
		return null;
	}
	return createClient<Database>(PUBLIC_SUPABASE_URL, serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export const supabaseAdmin = createAdminClient();
