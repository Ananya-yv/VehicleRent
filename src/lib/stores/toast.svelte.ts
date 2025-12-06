export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

function createToastStore() {
	let toasts = $state<Toast[]>([]);

	function add(message: string, type: ToastType = 'info', duration: number = 5000) {
		const id = crypto.randomUUID();
		const toast: Toast = { id, message, type, duration };

		toasts = [...toasts, toast];

		if (duration > 0) {
			setTimeout(() => {
				remove(id);
			}, duration);
		}

		return id;
	}

	function remove(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	function success(message: string, duration?: number) {
		return add(message, 'success', duration);
	}

	function error(message: string, duration?: number) {
		return add(message, 'error', duration);
	}

	function warning(message: string, duration?: number) {
		return add(message, 'warning', duration);
	}

	function info(message: string, duration?: number) {
		return add(message, 'info', duration);
	}

	function clear() {
		toasts = [];
	}

	return {
		get toasts() {
			return toasts;
		},
		add,
		remove,
		success,
		error,
		warning,
		info,
		clear
	};
}

export const toastStore = createToastStore();
