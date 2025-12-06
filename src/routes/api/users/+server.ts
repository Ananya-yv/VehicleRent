import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdmin } from '$lib/server/auth';

// GET /api/users - List all users (admin only)
export const GET: RequestHandler = async ({ url, locals }) => {
	requireAdmin({ locals } as any);

	let query = locals.supabase.from('users').select('*').order('created_at', { ascending: false });

	// Apply filters
	const role = url.searchParams.get('role');
	const search = url.searchParams.get('search');

	if (role) {
		query = query.eq('role', role);
	}
	if (search) {
		query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
	}

	const { data, error: fetchError } = await query;

	if (fetchError) {
		throw error(500, { message: fetchError.message });
	}

	return json({ data });
};

// Note: User creation is handled by Supabase Auth + trigger
// POST would require admin access to Supabase Auth API
