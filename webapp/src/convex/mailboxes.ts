import { v } from 'convex/values';
import { query, mutation } from './_generated/server.js';

export const getMailboxes = query({
	args: {},
	handler: async (ctx) => {
		const mailboxes = await ctx.db.query('mailboxes').collect();

		const parcels = await ctx.db.query('parcels').collect();

		const merge = mailboxes.map((mailbox) => ({
			...mailbox,
			parcel_info: parcels.find((p) => p._id === mailbox.parcel_id)
		}));

		console.log(merge);
		return merge;
	}
});

export const getAvailableMailboxes = query({
	args: {},
	handler: async (ctx) => {
		const mailboxes = await ctx.db
			.query('mailboxes')
			.filter((q) => q.eq(q.field('status'), 'Available'))
			.collect()
			
		return mailboxes.map((m) => ({
			_id: m._id,
			locker_number: m.locker_number
		}))
	}
});

export const addParcelToLocker = mutation({
	args: { locker_number: v.float64(), tracking_id: v.string() },
	handler: async (ctx, args) => {
		const parcel = await ctx.db
			.query('parcels')
			.filter((q) => q.eq(q.field('tracking_id'), args.tracking_id))
			.first();

		if (!parcel) {
			throw new Error('Parcel tracking number not found');
		}

		const mailbox = await ctx.db
			.query('mailboxes')
			.filter((q) => q.eq(q.field('locker_number'), args.locker_number))
			.first();

		if (!mailbox) {
			throw new Error('Mailbox number not found');
		}

		if (mailbox.status !== 'Available') {
			throw new Error('Mailbox not available');
		}

		await ctx.db.patch(mailbox._id, {
			status: 'Unavailable',
			parcel_id: parcel._id,
			recipient_uid: parcel.recipient_uid
		});

		await ctx.db.patch(parcel._id, {
			status: 'Sorting'
		});

		return { success: true };
	}
});

export const clearLocker = mutation({
	args: { 
		parcel_id: v.string(),
	},
	handler: async (ctx, args) => {
		const parcelLocker = await ctx.db
			.query('mailboxes')
			.filter((q) => q.eq(q.field('parcel_id'), args.parcel_id))
			.first();

		if (!parcelLocker) {
			throw new Error(`No mailbox contains parcel with id ${args.parcel_id}.`);
		}

		const updates = { recipient_uid:  "", parcel_id: "", status: "Available"};

		if (Object.keys(updates).length > 0) {
			await ctx.db.patch(parcelLocker._id, updates);
		}

		return {
			success: true,
			locker_info: { ...parcelLocker, ...updates }
		};
	}
});
