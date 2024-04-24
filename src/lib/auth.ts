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
	flow: 'implicit',
	overrideScope: true,
	scope: SCOPES.join(' '),
	onSuccess: async (tokenResponse) => {
		if (!hasGrantedAllScopesGoogle(tokenResponse, 'openid', ...SCOPES)) {
			authState.set({ state: 'error', message: 'missing required scopes' });
		} else if (!tokenResponse.access_token) {
			authState.set({ state: 'error', message: 'missing token' });
		} else {
			try {
				const userinfo = await getUserInfo(tokenResponse.access_token);
				authState.set({
					state: 'success',
					token: tokenResponse.access_token,
					// authuser: tokenResponse.authuser,
					...userinfo
				});
				localStorage.setItem('token', tokenResponse.access_token);
				console.log(tokenResponse);
			} catch (err) {
				authState.set({ state: 'error', message: (err as Error)?.message });
			}
		}
	},
	onError: (err) => {
		authState.set({ state: 'error', message: err.error_description });
	}
});

// check token
(async () => {
	const lsToken = localStorage.getItem('token');
	if (lsToken) {
		// const res = await (
		// 	await fetch('https://oauth2.googleapis.com/tokeninfo', {
		// 		headers: { Authorization: `Bearer ${lsToken}` }
		// 	})
		// )?.json();
		// const scopes = res?.scope?.split(' ');
		// if (scopes && SCOPES.every((scope) => scopes.includes(scope))) {
		// 	authState.set({ state: 'success', token: lsToken });
		// 	return;
		// }
		try {
			const userinfo = await getUserInfo(lsToken);
			authState.set({ state: 'success', token: lsToken, ...userinfo });
			return;
		} catch (err) {
			console.error(err);
		}
		localStorage.removeItem('token');
	}
	authState.set({ state: 'none' });
})();

export const logout = (full = true) => {
	if (full) googleLogout();
	localStorage.removeItem('token'); // forget token (though it will still be valid until it expires)
	// can't seem to find a way to revoke the token without messing up scopes for next login
	authState.set({ state: 'none' });
};

authState.subscribe((state) => console.log('authState', state));
