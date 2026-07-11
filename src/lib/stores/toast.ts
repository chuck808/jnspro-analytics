import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
	id: string;
	message: string;
	type: ToastType;
	duration?: number;
}

function createToastStore() {
	const { subscribe, update } = writable<ToastMessage[]>([]);

	return {
		subscribe,
		show(message: string, type: ToastType = 'info', duration = 5000) {
			const id = crypto.randomUUID();
			update((toasts) => [...toasts, { id, message, type, duration }]);
			return id;
		},
		dismiss(id: string) {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		success(message: string) {
			return this.show(message, 'success');
		},
		error(message: string) {
			return this.show(message, 'error', 7000);
		},
		warning(message: string) {
			return this.show(message, 'warning');
		},
		info(message: string) {
			return this.show(message, 'info');
		}
	};
}

export const toast = createToastStore();
