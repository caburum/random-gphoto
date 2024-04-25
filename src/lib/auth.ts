import { GoogleOAuthProvider, googleLogout, hasGrantedAllScopesGoogle } from 'google-oauth-gsi';
import { onMount } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export interface AuthState {
	state: 'loading' | 'none' | 'success' | 'error';
	message?: string;
	token?: string;
	id?: string;
	name?: string;
	email?: string;
}

export const authState: Writable<AuthState> = writable({
	state: 'loading'
});

export const googleProvider = new GoogleOAuthProvider({
	clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
	onScriptLoadError: () => {
		console.log('onScriptLoadError');
		authState.set({ state: 'error', message: 'failed to load google auth script' });
	},
	onScriptLoadSuccess: () => {}
});

const getUserInfo = async (token: string) => {
	const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) throw new Error(res.statusText);
	const userinfo = await res.json();
	return {
		id: userinfo.sub,
		name: userinfo.name,
		email: userinfo.email
	};
};

const SCOPES = [
	'openid',
	'https://www.googleapis.com/auth/userinfo.email',
	'https://www.googleapis.com/auth/userinfo.profile',
	'https://www.googleapis.com/auth/photoslibrary.readonly'
];
export const login = googleProvider.useGoogleLogin({
	flow: 'auth-code',
	overrideScope: true,
	scope: SCOPES.join(' '),
	state: location.origin,
	// on other origins, we need to redirect to the proper one
	ux_mode: import.meta.env.VITE_GOOGLE_REDIRECT_ORIGIN === location.origin ? 'popup' : 'redirect',
	redirect_uri: `${import.meta.env.VITE_GOOGLE_REDIRECT_ORIGIN || ''}/api/auth/callback`,
	onSuccess: async (codeResponse) => {
		console.log('codeResponse', codeResponse);

		const scope = codeResponse.scope.split(' ');
		if (!SCOPES.every((s) => scope.includes(s))) {
			authState.set({ state: 'error', message: 'missing required scopes' });
			return;
		}

		try {
			const callbackEndpoint = new URL('/api/auth/callback', location.toString());
			callbackEndpoint.searchParams.set('popup', '');
			callbackEndpoint.searchParams.set('state', codeResponse.state || '');
			callbackEndpoint.searchParams.set('code', codeResponse.code);

			const response = await fetch(callbackEndpoint.toString(), {
				method: 'GET'
			});
			const data = (await response.json()) as {
				access_token?: string; // for direct use
			};

			if (!data.access_token) {
				authState.set({ state: 'error', message: 'missing token' });
			} else {
				try {
					const userinfo = await getUserInfo(data.access_token);
					authState.set({
						state: 'success',
						token: data.access_token,
						// authuser: codeResponse.authuser,
						...userinfo
					});
				} catch (err) {
					authState.set({ state: 'error', message: (err as Error)?.message });
				}
			}
		} catch (err) {
			console.error(err);
		}
	},
	onError: (err) => {
		authState.set({ state: 'error', message: err.error_description });
	}
});

export const logout = async () => {
	authState.set({ state: 'loading' });
	googleLogout();
	document.cookie = 'access_token=; Path=/; Max-Age=0';
	await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); // refresh_token can only be cleared by the server
	authState.set({ state: 'none' });
};

export const refreshToken = async () => {
	authState.set({ state: 'loading' });
	const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' });
	const data = await res.json();
	if (!res.ok || !data.access_token) {
		logout();
	} else {
		const userinfo = await getUserInfo(data.access_token);
		authState.set({ state: 'success', token: data.access_token, ...userinfo });
	}
};

// https://stackoverflow.com/a/25490531
const getCookie = (header: string, name: string) => header.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';

// check token
(async () => {
	const accessToken = getCookie(document.cookie, 'access_token');
	if (accessToken) {
		try {
			const userinfo = await getUserInfo(accessToken);
			authState.set({ state: 'success', token: accessToken, ...userinfo });
		} catch (err) {
			await refreshToken();
		}
	} else {
		authState.set({ state: 'none' });
	}
})();

authState.subscribe((state) => console.log('authState', state));
