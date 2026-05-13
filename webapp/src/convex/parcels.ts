import { v } from 'convex/values';
import { query, mutation } from './_generated/server.js';

export const getParcels = query({
	args: {},
	handler: async (ctx) => {
		const parcels = await ctx.db.query('parcels').collect();
		console.log(parcels);
		return parcels;
	}
});

export const getParcel = query({
	args: { tracking_num: v.string() },
	handler: async (ctx, args) => {
		const parcels = await ctx.db.query('parcels').collect();
		const mailboxes = await ctx.db.query('mailboxes').collect();

		const userParcel = parcels.find((p) => p.tracking_id === args.tracking_num);

		if (userParcel == undefined) return userParcel;

		const mailbox = mailboxes.find((m) => m.parcel_id === userParcel._id);

		return {
			parcel_info: userParcel,
			locker_num: mailbox ? mailbox.locker_number : 'N/A'
		};
	}
});


export const updateParcel = mutation({
	args: { 
		tracking_num: v.string(),
		status: v.optional(v.string()), 
		courier: v.optional(v.string()),
		claim_date: v.optional(v.float64()),
	},
	handler: async (ctx, args) => {
		const userParcel = await ctx.db
			.query('parcels')
			.filter((q) => q.eq(q.field('tracking_id'), args.tracking_num))
			.first();

		if (!userParcel) {
			throw new Error(`Parcel with tracking number ${args.tracking_num} not found.`);
		}

		const { tracking_num, ...updates } = args;

		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(userParcel._id, updates);
		}

		return {
			success: true,
			parcel_info: { ...userParcel, ...updates }
		};
	}
});