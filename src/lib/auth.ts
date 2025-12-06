import { supabase } from './supabase';
import type { UserRole } from './database.types';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	phone: string | null;
}

export interface SignUpData {
	name: string;
	email: string;
	password: string;
	phone: string;
	role: UserRole;
}

export interface SignInData {
	email: string;
	password: string;
}

export interface AuthResult {
	success: boolean;
	error?: string;
	user?: AuthUser;
}

export async function signUp(data: SignUpData): Promise<AuthResult> {
	const { name, email, password, phone, role } = data;

	const { data: authData, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				name,
				phone,
				role
			}
		}
	});

	if (error) {
		return { success: false, error: error.message };
	}

	if (!authData.user) {
		return { success: false, error: 'Failed to create user' };
	}

	const user = await getUserProfile(authData.user.id);
	if (!user) {
		return { success: false, error: 'Failed to create user profile' };
	}

	return { success: true, user };
}

export async function signIn(data: SignInData): Promise<AuthResult> {
	const { email, password } = data;

	const { data: authData, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});

	if (error) {
		return { success: false, error: error.message };
	}

	if (!authData.user) {
		return { success: false, error: 'Invalid credentials' };
	}

	const user = await getUserProfile(authData.user.id);
	if (!user) {
		return { success: false, error: 'User profile not found' };
	}

	return { success: true, user };
}

export async function signOut(): Promise<{ success: boolean; error?: string }> {
	const { error } = await supabase.auth.signOut();

	if (error) {
		return { success: false, error: error.message };
	}

	return { success: true };
}

export async function getSession(): Promise<Session | null> {
	const { data } = await supabase.auth.getSession();
	return data.session;
}

export async function getUser(): Promise<User | null> {
	const { data } = await supabase.auth.getUser();
	return data.user;
}

export async function getUserProfile(userId: string): Promise<AuthUser | null> {
	const { data, error } = await supabase
		.from('users')
		.select('id, email, name, role, phone')
		.eq('id', userId)
		.single();

	if (error || !data) {
		return null;
	}

	return data as AuthUser;
}

export async function getCurrentUserProfile(): Promise<AuthUser | null> {
	const user = await getUser();
	if (!user) return null;
	return getUserProfile(user.id);
}

export function getDashboardPath(role: UserRole): string {
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

export function onAuthStateChange(
	callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
	const { data } = supabase.auth.onAuthStateChange((event, session) => {
		callback(event, session);
	});

	return { unsubscribe: () => data.subscription.unsubscribe() };
}
