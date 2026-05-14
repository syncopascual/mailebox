import { httpRouter } from 'convex/server';
import { authComponent, createAuth } from './auth';
import { api } from './_generated/api.js';
import { httpAction } from './_generated/server';

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
	path: '/webhook/scan',
	method: 'POST',
	handler: httpAction(async (ctx, request) => {
		const body = await request.json();
		await ctx.runMutation(api.scanner.saveScan, {
			uin: body.uin,
			transaction_id: body.transaction_id,
			status: body.status ?? 'pending',
			scanned_at: body.scanned_at
		});
		return new Response('OK', { status: 200 });
	})
});

export default http;
