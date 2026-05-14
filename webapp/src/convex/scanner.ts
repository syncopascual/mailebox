// convex/scanner.ts
import { action, mutation, query } from './_generated/server.js';
import { v } from 'convex/values';
import { api } from './_generated/api.js';
import { publishToEmqx } from './mqtt';

const PYTHON_URL = 'http://143.198.85.47:8000';

export const syncScan = action({
	args: {},
	handler: async (ctx) => {
		const response = await fetch(`${PYTHON_URL}/api/scan-data`, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Python service is down or returned an error');
		}

		const data = await response.json();
		const scan = data.scan;

		if (!scan) {
			return { scan: null };
		}

		await ctx.runMutation(api.scanner.saveScan, {
			uin: scan.uin,
			transaction_id: scan.transaction_id,
			status: scan.status ?? 'pending',
			scanned_at: scan.scanned_at
		});

		return { scan };
	}
});

export const saveScan = mutation({
	args: {
		uin: v.string(),
		transaction_id: v.string(),
		status: v.string(),
		scanned_at: v.number()
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query('scans')
			.withIndex('by_uin', (q) => q.eq('uin', args.uin))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				transaction_id: args.transaction_id,
				status: args.status,
				scanned_at: args.scanned_at
			});
		} else {
			await ctx.db.insert('scans', {
				uin: args.uin,
				transaction_id: args.transaction_id,
				status: args.status,
				scanned_at: args.scanned_at
			});
		}
	}
});

export const getLatestScan = query({
	args: {},
	handler: async (ctx) => {
		const scan = await ctx.db
			.query('scans')
			.withIndex('by_scanned_at', (q) => q)
			.order('desc')
			.first();
		if (!scan) return null;
		if (Date.now() - scan.scanned_at * 1000 > 3 * 60 * 1000) return null;
		return scan;
	}
});

export const verifyOtp = action({
	args: {
		uin: v.string(),
		otp: v.string(),
		transaction_id: v.string(),
		locker_num: v.number(),
		tracking_num: v.string()
	},
	handler: async (ctx, args) => {
		const response = await fetch(`${PYTHON_URL}/api/otp`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				uin: args.uin,
				otp: args.otp,
				transaction_id: args.transaction_id
			})
		});

		if (!response.ok) {
			throw new Error('Python service is down or returned an error');
		}

		const data = await response.json();
		const authStatus = data.authStatus as boolean;

		if (authStatus) {
			await publishToEmqx('esp32/commands', JSON.stringify({ command: 'success' }));
			await publishToEmqx(
				'esp32/commands',
				JSON.stringify({ ID: args.locker_num, command: 'open' })
			);

			await ctx.runMutation(api.attempts.logAttempt, {
				locker_num: args.locker_num,
				date: Date.now(),
				uin: args.uin,
				is_successful: true
			});

			await ctx.runMutation(api.parcels.updateParcel, {
				tracking_num: args.tracking_num,
				status: 'Claimed'
			});

			return { authStatus: true, status: 'Unlocked' };
		} else {
			await publishToEmqx('esp32/commands', JSON.stringify({ command: 'failure' }));
			return { authStatus: false, status: 'OTP Invalid' };
		}
	}
});
