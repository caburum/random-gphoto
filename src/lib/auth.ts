import { GoogleOAuthProvider, googleLogout, hasGrantedAllScopesGoogle } from 'google-oauth-gsi';
import { onMount } from 'svelte';
import { writable, type Writable } from 'svelte/store';

export const authState: Writable<{
	state: 'loading' | 'none' | 'success' | 'error';
	message?: string;
	token?: string;
}> = writable({
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

const SCOPES = ['openid', 'https://www.googleapis.com/auth/photoslibrary.readonly'];
export const login = googleProvider.useGoogleLogin({
	flow: 'implicit',
	overrideScope: true,
	scope: SCOPES.join(' '),
	onSuccess: (tokenResponse) => {
		if (!hasGrantedAllScopesGoogle(tokenResponse, 'openid', ...SCOPES)) {
			authState.set({ state: 'error', message: 'missing required scopes' });
		} else if (!tokenResponse.access_token) {
			authState.set({ state: 'error', message: 'missing token' });
		} else {
			authState.set({
				state: 'success',
				token: tokenResponse.access_token
				// expiration: Date.now() + tokenResponse.expires_in * 1000
			});
			localStorage.setItem('token', tokenResponse.access_token);
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
		const res = await (
			await fetch('https://oauth2.googleapis.com/tokeninfo', {
				headers: { Authorization: `Bearer ${lsToken}` }
			})
		)?.json();
		const scopes = res?.scope?.split(' ');
		if (scopes && SCOPES.every((scope) => scopes.includes(scope))) {
			authState.set({ state: 'success', token: lsToken });
			return;
		}
		localStorage.removeItem('token');
	}
	authState.set({ state: 'none' });
})();

export const logout = () => {
	googleLogout();
	localStorage.removeItem('token'); // forget token (though it will still be valid until it expires)
	// can't seem to find a way to revoke the token without messing up scopes for next login
	authState.set({ state: 'none' });
};

authState.subscribe((state) => console.log('authState', state));
