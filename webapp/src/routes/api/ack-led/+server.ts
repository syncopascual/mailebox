import type { RequestHandler } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api.js';

export const POST: RequestHandler = async ({ locals }) => {
	const client = locals.token 
		? new ConvexHttpClient(PUBLIC_CONVEX_URL, { auth: locals.token })
		: new ConvexHttpClient(PUBLIC_CONVEX_URL);

	const result = await client.mutation(api.mqtt.acknowledgeCommand, { 
		type: 'led'
	});

	return new Response(JSON.stringify(result), {
		status: result.success ? 200 : 404,
		headers: { 'Content-Type': 'application/json' }
	});
};
