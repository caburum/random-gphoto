import { Context, Hono } from 'hono';
import { handle } from 'hono/vercel';

declare var process: {
	env: {
		VITE_GOOGLE_CLIENT_ID: string;
		GOOGLE_CLIENT_SECRET: string;
		VITE_GOOGLE_REDIRECT_ORIGIN?: string;
	};
};

const app = new Hono();

// https://stackoverflow.com/a/25490531
const getCookie = (header: string, name: string) => header.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')?.pop() || '';

app.get('/api/auth/init', (c: Context) => {
	const url = new URL(c.req.url);
	const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
	authorizationUrl.searchParams.set('client_id', process.env.VITE_GOOGLE_CLIENT_ID);
	// because vercel uses many origins, we only want to use the main one to handle auth since its all stateless
	// for dev, we will fall back to localhost
	authorizationUrl.searchParams.set(
		'redirect_uri',
		(process.env.VITE_GOOGLE_REDIRECT_ORIGIN || url.origin) + '/api/auth/callback'
	);
	authorizationUrl.searchParams.set('state', url.origin); // where to redirect after login
	authorizationUrl.searchParams.set('prompt', 'consent');
	authorizationUrl.searchParams.set('response_type', 'code');
	authorizationUrl.searchParams.set('include_granted_scopes', 'true');
	authorizationUrl.searchParams.set(
		'scope',
		'openid email profile https://www.googleapis.com/auth/photoslibrary.readonly'
	);
	authorizationUrl.searchParams.set('access_type', 'offline');

	return new Response(null, {
		status: 302,
		headers: {
			Location: authorizationUrl.toString()
		}
	});
});

// SameSite=Strict doesn't work peoprly with 302 redirects
const refreshTokenCookie = (refresh_token: string) =>
	`refresh_token=${refresh_token}; Path=/; SameSite=Lax; Secure; HttpOnly`;
const accessTokenCookie = (access_token: string) => `access_token=${access_token}; Path=/; SameSite=Lax; Secure`;

app.get('/api/auth/callback', async (c: Context) => {
	const url = new URL(c.req.url);
	const code = url.searchParams.get('code');
	if (!code) return c.json({ error: 'no code' }, 401);

	const isPopup = url.searchParams.get('popup') !== null;

	// when running a different origin, we need to redirect to an approved one
	// since cookies need to be set, we need to redirect there first before the app
	const targetOrigin = new URL(url.searchParams.get('state') || url.origin);
	const doRedirect = targetOrigin.origin !== url.origin;

	try {
		const tokenEndpoint = new URL('https://accounts.google.com/o/oauth2/token');
		tokenEndpoint.searchParams.set('code', code);
		tokenEndpoint.searchParams.set('grant_type', 'authorization_code');
		tokenEndpoint.searchParams.set('client_id', process.env.VITE_GOOGLE_CLIENT_ID);
		tokenEndpoint.searchParams.set('client_secret', process.env.GOOGLE_CLIENT_SECRET);
		tokenEndpoint.searchParams.set(
			'redirect_uri',
			isPopup ? 'postmessage' : `${process.env.VITE_GOOGLE_REDIRECT_ORIGIN || url.origin}/api/auth/callback`
		);
		console.log('tokenEndpoint', tokenEndpoint.toString());

		const tokenResponse = await fetch(tokenEndpoint.origin + tokenEndpoint.pathname, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenEndpoint.searchParams.toString()
		});
		const tokenData = (await tokenResponse.json()) as { access_token?: string; refresh_token?: string };
		console.log('tokenData', tokenData);

		if (!tokenData.access_token || !tokenData.refresh_token) return c.json({ error: 'missing tokens' }, 401);

		if (doRedirect) {
			// set cookies on the target origin
			targetOrigin.pathname = '/api/auth/callback2';
			targetOrigin.searchParams.set('access_token', tokenData.access_token);
			targetOrigin.searchParams.set('refresh_token', tokenData.refresh_token);
			return new Response(null, {
				status: 302,
				headers: {
					Location: targetOrigin.toString()
				}
			});
		} else {
			const response = new Response(
				JSON.stringify({
					access_token: tokenData.access_token
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			);
			response.headers.append('Set-Cookie', refreshTokenCookie(tokenData.refresh_token));
			response.headers.append('Set-Cookie', accessTokenCookie(tokenData.access_token));
			return response;
		}
	} catch (error) {
		console.error(error);
		return c.json({ error: 'callback failed' }, 500);
	}
});

app.get('/api/auth/callback2', async (c: Context) => {
	const url = new URL(c.req.url);
	const access_token = url.searchParams.get('access_token');
	const refresh_token = url.searchParams.get('refresh_token');
	if (!access_token || !refresh_token) return c.json({ error: 'missing tokens' }, 401);

	// todo: verify that tokens are real? maybe something malicious could happen here

	const response = new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
	response.headers.append('Set-Cookie', refreshTokenCookie(refresh_token));
	response.headers.append('Set-Cookie', accessTokenCookie(access_token));
	return response;
});

app.post('/api/auth/refresh', async (c: Context) => {
	const cookie = c.req.header('Cookie');
	if (!cookie) return c.json('no cookie', 401);

	const refreshToken = getCookie(cookie, 'refresh_token');
	if (!refreshToken) return c.json('no refresh_token', 401);

	console.log('refreshToken', refreshToken);

	try {
		const tokenEndpoint = new URL('https://oauth2.googleapis.com/token');
		tokenEndpoint.searchParams.set('grant_type', 'refresh_token');
		tokenEndpoint.searchParams.set('client_id', process.env.VITE_GOOGLE_CLIENT_ID);
		tokenEndpoint.searchParams.set('client_secret', process.env.GOOGLE_CLIENT_SECRET);
		tokenEndpoint.searchParams.set('refresh_token', refreshToken);

		const tokenResponse = await fetch(tokenEndpoint.origin + tokenEndpoint.pathname, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: tokenEndpoint.searchParams.toString()
		});
		const tokenData = (await tokenResponse.json()) as { access_token?: string };
		console.log('tokenData', tokenData);

		if (tokenData.access_token) {
			return new Response(
				JSON.stringify({
					access_token: tokenData.access_token
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json',
						'Set-Cookie': accessTokenCookie(tokenData.access_token)
					}
				}
			);
		} else {
			const response = new Response(null, {
				status: 401,
				headers: {}
			});
			const exp = '=deleted; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
			response.headers.append('Set-Cookie', 'access_token' + exp);
			response.headers.append('Set-Cookie', 'refresh_token' + exp);
			return response;
		}
	} catch (error) {
		return c.json('callback failed', 500);
	}
});

app.get('/api/auth', async (c: Context) => {
	return new Response();
});

export default app;

export const config = {
	runtime: 'edge'
};

export const GET = handle(app);
export const POST = handle(app);