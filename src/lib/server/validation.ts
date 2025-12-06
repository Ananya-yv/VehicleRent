import { error } from '@sveltejs/kit';

export interface ValidationRule {
	required?: boolean;
	type?: 'string' | 'number' | 'boolean' | 'email' | 'phone' | 'uuid' | 'date';
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
	enum?: string[];
}

export interface ValidationSchema {
	[key: string]: ValidationRule;
}

export function validate<T>(
	data: unknown,
	schema: ValidationSchema
): T {
	if (!data || typeof data !== 'object') {
		throw error(400, { message: 'Invalid request body' });
	}

	const result: Record<string, unknown> = {};
	const errors: string[] = [];

	for (const [field, rules] of Object.entries(schema)) {
		const value = (data as Record<string, unknown>)[field];

		// Required field
		if (rules.required && (value === undefined || value === null || value === '')) {
			errors.push(`${field} is required`);
			continue;
		}

		if (value === undefined || value === null || value === '') {
			continue; // If not required and empty -> skip checks
		}

		// Type validation
		if (rules.type) {
			switch (rules.type) {
				case 'string':
					if (typeof value !== 'string') errors.push(`${field} must be a string`);
					break;
				case 'number':
					if (typeof value !== 'number' || isNaN(value)) errors.push(`${field} must be a number`);
					break;
				case 'boolean':
					if (typeof value !== 'boolean') errors.push(`${field} must be a boolean`);
					break;
				case 'email':
					if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
						errors.push(`${field} must be a valid email`);
					break;
				case 'phone':
					if (typeof value !== 'string' || !/^[\d\s+\-()]{10,20}$/.test(value))
						errors.push(`${field} must be a valid phone number`);
					break;
				case 'uuid':
					if (
						typeof value !== 'string' ||
						!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
					)
						errors.push(`${field} must be a valid UUID`);
					break;
				case 'date':
					if (typeof value !== 'string' || isNaN(Date.parse(value)))
						errors.push(`${field} must be a valid date`);
					break;
			}
		}

		// String validation
		if (typeof value === 'string') {
			if (rules.minLength && value.length < rules.minLength)
				errors.push(`${field} must be at least ${rules.minLength} characters`);
			if (rules.maxLength && value.length > rules.maxLength)
				errors.push(`${field} must be at most ${rules.maxLength} characters`);
		}

		// Number validation
		if (typeof value === 'number') {
			if (rules.min !== undefined && value < rules.min)
				errors.push(`${field} must be at least ${rules.min}`);
			if (rules.max !== undefined && value > rules.max)
				errors.push(`${field} must be at most ${rules.max}`);
		}

		// Enum validation
		if (rules.enum && !rules.enum.includes(String(value))) {
			errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
		}

		result[field] = value;
	}

	if (errors.length > 0) {
		throw error(400, { message: errors.join('; ') });
	}

	return result as T;
}

export function parseJson(request: Request): Promise<unknown> {
	return request.json().catch(() => {
		throw error(400, { message: 'Invalid JSON body' });
	});
}
