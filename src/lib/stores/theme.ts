import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Initialize theme from localStorage or system preference
function getInitialTheme(): Theme {
	if (!browser) return 'dark';

	const stored = localStorage.getItem('theme') as Theme | null;
	if (stored === 'light' || stored === 'dark') return stored;

	// Check system preference
	if (window.matchMedia('(prefers-color-scheme: light)').matches) {
		return 'light';
	}

	return 'dark';
}

function createThemeStore() {
	const { subscribe, set: setStore, update } = writable<Theme>(getInitialTheme());

	const setTheme = (theme: Theme) => {
		if (browser) {
			localStorage.setItem('theme', theme);
			document.documentElement.setAttribute('data-theme', theme);
		}
		setStore(theme);
	};

	return {
		subscribe,
		set: setTheme,
		toggle: () => {
			update((current) => {
				const next = current === 'light' ? 'dark' : 'light';
				if (browser) {
					localStorage.setItem('theme', next);
					document.documentElement.setAttribute('data-theme', next);
				}
				return next;
			});
		},
		initialize: () => {
			if (browser) {
				const theme = getInitialTheme();
				document.documentElement.setAttribute('data-theme', theme);
			}
		}
	};
}

export const theme = createThemeStore();
