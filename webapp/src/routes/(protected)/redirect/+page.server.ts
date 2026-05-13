import type { PageServerLoad } from './$types.js';
import { redirect } from '@sveltejs/kit';
import { ConvexHttpClient } from 'convex/browser';
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '$convex/_generated/api.js';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.token) throw redirect(303, '/login');

    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL, { auth: locals.token });
    const roleData = await client.query(api.auth.getUserRole, {});

    // checks if user is admin or courier
    if (roleData?.role === 'admin') throw redirect(303, '/admin');
    if (roleData?.role === 'courier') throw redirect(303, '/courier');
    throw redirect(303, '/login');
};