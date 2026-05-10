import type { LayoutServerLoad } from '../$types.js';
import { redirect } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api.js';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.token) {
		throw redirect(303, '/login');
	}

	// check if the user is an admim here using a Convex query
	const client = new ConvexHttpClient(PUBLIC_CONVEX_URL, { auth: locals.token });
	const roleData = await client.query(api.auth.getUserRole, {});
	if (!roleData || roleData.role !== 'admin') {
		throw redirect(303, '/login');
	}
};
