import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect, type Handle } from '@sveltejs/kit';
import type { Database, UserRole } from '$lib/database.types';
import { supabase } from '$lib/supabase';

interface UserProfile {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	phone: string | null;
}

const PROTECTED_ROUTES: Record<string, UserRole[]> = {
	'/admin': ['admin'],
	'/agent': ['delivery'],
	'/help': ['helpline']
};

const PUBLIC_ROUTES = ['/', '/sign-in', '/signup', '/vehicles', '/booking'];

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		auth: {
			autoRefreshToken: true,
			persistSession: true
		},
		global: {
			headers: {
				cookie: event.request.headers.get('cookie') || ''
			}
		}
	});

	const accessToken = event.cookies.get('sb-access-token');
	const refreshToken = event.cookies.get('sb-refresh-token');

	let session = null;
	let user = null;
	let userProfile: UserProfile | null = null;

	if (accessToken && refreshToken) {
		const { data, error } = await supabase.auth.setSession({
			access_token: accessToken,
			refresh_token: refreshToken
		});

		if (!error && data.session) {
			session = data.session;
			user = data.session.user;

			const { data: profile } = await supabase
				.from('users')
				.select('id, email, name, role, phone')
				.eq('id', user.id)
				.single();

			userProfile = profile as UserProfile | null;

			const isSecure = event.url.protocol === 'https:';
			
			if (data.session.access_token !== accessToken) {
				event.cookies.set('sb-access-token', data.session.access_token, {
					path: '/',
					httpOnly: true,
					secure: isSecure,
					sameSite: 'lax',
					maxAge: 60 * 60
				});
			}
			if (data.session.refresh_token !== refreshToken) {
				event.cookies.set('sb-refresh-token', data.session.refresh_token, {
					path: '/',
					httpOnly: true,
					secure: isSecure,
					sameSite: 'lax',
					maxAge: 60 * 60 * 24 * 30
				});
			}
		}
	}

	event.locals.supabase = supabase;
	event.locals.session = session;
	event.locals.user = user;
	event.locals.userProfile = userProfile;

	const path = event.url.pathname;

	const isPublicRoute = PUBLIC_ROUTES.some(
		(route) => path === route || path.startsWith(route + '/')
	);

	if (!isPublicRoute) {
		for (const [routePrefix, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
			if (path.startsWith(routePrefix)) {
				if (!session || !userProfile) {
					throw redirect(303, `/sign-in?redirect=${encodeURIComponent(path)}`);
				}

				if (!allowedRoles.includes(userProfile.role)) {
					throw redirect(303, '/unauthorized');
				}

				break;
			}
		}
	}

	if ((path === '/sign-in' || path === '/signup') && session && userProfile) {
		const dashboardPath = getDashboardPath(userProfile.role);
		throw redirect(303, dashboardPath);
	}

	return resolve(event);
};

function getDashboardPath(role: UserRole): string {
	switch (role) {
		case 'admin':
			return '/admin/dashboard';
		case 'delivery':
			return '/agent/dashboard';
		case 'helpline':
			return '/help/dashboard';
		default:
			return '/';
	}
}
