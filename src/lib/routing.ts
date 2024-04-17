import { writable, type Writable } from 'svelte/store';
import AppPage from '../AppPage.svelte';
import SettingsPage from '../SettingsPage.svelte';

export const routes = {
	app: AppPage,
	settings: SettingsPage
};

export const currentPage: Writable<keyof typeof routes> = writable('app');
