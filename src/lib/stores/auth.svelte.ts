import { supabase } from '$lib/supabase';
import type { AuthUser } from '$lib/auth';
import type { Session } from '@supabase/supabase-js';

interface AuthState {
	user: AuthUser | null;
	session: Session | null;
	loading: boolean;
	initialized: boolean;
}

function createAuthStore() {
	let state = $state<AuthState>({
		user: null,
		session: null,
		loading: true,
		initialized: false
	});

	async function initialize() {
		if (state.initialized) return;

		state.loading = true;

		const { data: { session } } = await supabase.auth.getSession();

		if (session?.user) {
			const { data: profile } = await supabase
				.from('users')
				.select('id, email, name, role, phone')
				.eq('id', session.user.id)
				.single();

			state.user = profile as AuthUser | null;
			state.session = session;
		}

		state.loading = false;
		state.initialized = true;

		supabase.auth.onAuthStateChange(async (event, session) => {
			state.session = session;

			if (session?.user) {
				const { data: profile } = await supabase
					.from('users')
					.select('id, email, name, role, phone')
					.eq('id', session.user.id)
					.single();

				state.user = profile as AuthUser | null;
			} else {
				state.user = null;
			}

			state.loading = false;
		});
	}

	function setUser(user: AuthUser | null) {
		state.user = user;
	}

	function setSession(session: Session | null) {
		state.session = session;
	}

	function setLoading(loading: boolean) {
		state.loading = loading;
	}

	function reset() {
		state.user = null;
		state.session = null;
		state.loading = false;
	}

	return {
		get user() {
			return state.user;
		},
		get session() {
			return state.session;
		},
		get loading() {
			return state.loading;
		},
		get initialized() {
			return state.initialized;
		},
		get isAuthenticated() {
			return !!state.session && !!state.user;
		},
		initialize,
		setUser,
		setSession,
		setLoading,
		reset
	};
}

export const authStore = createAuthStore();
