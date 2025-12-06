import { error, type RequestEvent } from '@sveltejs/kit';
import type { UserRole } from '$lib/database.types';

interface UserProfile {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	phone: string | null;
}

export function requireAuth(event: RequestEvent): UserProfile {
	const { userProfile } = event.locals;

	if (!userProfile) {
		throw error(401, { message: 'Authentication required' });
	}

	return userProfile;
}

export function requireRole(event: RequestEvent, allowedRoles: UserRole[]): UserProfile {
	const userProfile = requireAuth(event);

	if (!allowedRoles.includes(userProfile.role)) {
		throw error(403, { message: 'Access denied. Insufficient permissions.' });
	}

	return userProfile;
}

export function requireAdmin(event: RequestEvent): UserProfile {
	return requireRole(event, ['admin']);
}

export function requireDeliveryAgent(event: RequestEvent): UserProfile {
	return requireRole(event, ['admin', 'delivery']);
}

export function requireHelplineAgent(event: RequestEvent): UserProfile {
	return requireRole(event, ['admin', 'helpline']);
}

export function requireAnyAgent(event: RequestEvent): UserProfile {
	return requireRole(event, ['admin', 'delivery', 'helpline']);
}

export function isAdmin(event: RequestEvent): boolean {
	return event.locals.userProfile?.role === 'admin';
}

export function isDeliveryAgent(event: RequestEvent): boolean {
	return event.locals.userProfile?.role === 'delivery';
}

export function isHelplineAgent(event: RequestEvent): boolean {
	return event.locals.userProfile?.role === 'helpline';
}

export function getCurrentUserId(event: RequestEvent): string | null {
	return event.locals.userProfile?.id || null;
}
