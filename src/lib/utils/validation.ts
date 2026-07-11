export type ValidationRule<T> = (value: T) => string | null;

export function required(message = 'This field is required'): ValidationRule<any> {
	return (value) => {
		if (value === null || value === undefined || value === '') {
			return message;
		}
		return null;
	};
}

export function minLength(min: number, message?: string): ValidationRule<string> {
	return (value) => {
		if (value && value.length < min) {
			return message || `Must be at least ${min} characters`;
		}
		return null;
	};
}

export function maxLength(max: number, message?: string): ValidationRule<string> {
	return (value) => {
		if (value && value.length > max) {
			return message || `Must be no more than ${max} characters`;
		}
		return null;
	};
}

export function min(minVal: number, message?: string): ValidationRule<number> {
	return (value) => {
		if (value !== null && value !== undefined && value < minVal) {
			return message || `Must be at least ${minVal}`;
		}
		return null;
	};
}

export function max(maxVal: number, message?: string): ValidationRule<number> {
	return (value) => {
		if (value !== null && value !== undefined && value > maxVal) {
			return message || `Must be no more than ${maxVal}`;
		}
		return null;
	};
}

export function email(message = 'Invalid email address'): ValidationRule<string> {
	return (value) => {
		if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			return message;
		}
		return null;
	};
}

export function validate<T>(value: T, rules: ValidationRule<T>[]): string | null {
	for (const rule of rules) {
		const error = rule(value);
		if (error) return error;
	}
	return null;
}
