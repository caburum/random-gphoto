import { get, writable, type Writable } from 'svelte/store';
import type { ComponentType } from 'svelte';
import AppPage from '../AppPage.svelte';
import SettingsPage from '../SettingsPage.svelte';
import PrivacyPolicyPage from '../PrivacyPolicyPage.svelte';

const _routes = {
	'': {
		// fallback as default route
		name: 'app',
		page: AppPage,
		noAuth: true
	},
	settings: {
		name: 'settings',
		page: SettingsPage
	},
	'privacy-policy': {
		name: 'privacy policy',
		page: PrivacyPolicyPage,
		hidden: true,
		noAuth: true
	}
};

export const routes: {
	[Property in keyof typeof _routes]: {
		page: ComponentType;
		name: string;
		hidden?: boolean;
		noAuth?: boolean;
	};
} = _routes;

const updatePage = (page: string) => {
	location.hash = '/' + page;
};

const parsePage = (): keyof typeof routes | null => {
	const page = location.hash.slice(2);
	if (page in routes) return page as any;
	return null;
};

window.onhashchange = (e) => {
	const page = parsePage();
	if (page !== null) currentPage.set(page);
	else updatePage(get(currentPage));
};

export const currentPage: Writable<keyof typeof routes> = writable(parsePage() ?? '');

currentPage.subscribe(updatePage);
