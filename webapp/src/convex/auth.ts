import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.d.ts';
import { query } from './_generated/server.js';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import authConfig from './auth.config';
import { v } from 'convex/values';

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.
export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		// Configure simple, non-verified email/password to get started
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},
		plugins: [
			// The Convex plugin is required for Convex compatibility
			convex({ authConfig })
		]
	});
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return authComponent.getAuthUser(ctx);
	}
});

export const getUserRole = query({
	args: {},
	handler: async (ctx) => {
		const user = authComponent.getAuthUser(ctx);
		const id = (await user)._id;

		const role = await ctx.db
			.query('userRoles')
			.withIndex('by_uin', (q) => q.eq('uin', id))
			.first();

		console.log(role);
		return role;
	}
});
