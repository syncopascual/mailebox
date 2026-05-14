import type { RequestHandler } from './$types';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const { lockerId } = body;

	if (!lockerId) {
		return new Response(JSON.stringify({ error: 'Missing lockerId' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const client = locals.token 
		? new ConvexHttpClient(PUBLIC_CONVEX_URL, { auth: locals.token })
		: new ConvexHttpClient(PUBLIC_CONVEX_URL);

	const result = await client.mutation(api.mqtt.acknowledgeCommand, { 
		type: 'lock',
		lockerId: parseInt(lockerId, 10) 
	});

	return new Response(JSON.stringify(result), {
		status: result.success ? 200 : 404,
		headers: { 'Content-Type': 'application/json' }
	});
};
