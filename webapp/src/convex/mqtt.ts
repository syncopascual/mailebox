import { action, mutation, query } from './_generated/server.js';
import { v } from 'convex/values';
import { api } from './_generated/api.js';

function toBase64(str: string): string {
	if (typeof globalThis.btoa !== 'undefined') {
		return globalThis.btoa(str);
	}
	return Buffer.from(str).toString('base64');
}

export async function publishToEmqx(topic: string, payload: string) {
	const emqxApiUrl = process.env.EMQX_API_URL;
	const emqxAppId = process.env.EMQX_APP_ID;
	const emqxAppSecret = process.env.EMQX_APP_SECRET;

	if (!emqxApiUrl || !emqxAppId || !emqxAppSecret) {
		throw new Error('EMQX Serverless API environment variables are not configured');
	}

	const response = await fetch(`${emqxApiUrl}/publish`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Basic ${toBase64(`${emqxAppId}:${emqxAppSecret}`)}`
		},
		body: JSON.stringify({ topic, payload, qos: 1 })
	});

	if (!response.ok) {
		const errorBody = await response.text();
		throw new Error(`EMQX API error: ${response.status} ${response.statusText} - ${errorBody}`);
	}
}

export const setPendingCommand = mutation({
	args: {
		type: v.union(v.literal('lock'), v.literal('led')),
		lockerId: v.optional(v.number())
	},
	handler: async (ctx, args) => {

		if (args.type === 'lock' && args.lockerId !== undefined) {
			const existing = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type_lockerId', (q) => q.eq('type', args.type).eq('lockerId', args.lockerId))
				.first();
			if (existing) {
				await ctx.db.patch(existing._id, { acked: false, createdAt: Date.now() });
			} else {
				await ctx.db.insert('pendingCommands', { type: args.type, lockerId: args.lockerId, acked: false, createdAt: Date.now() });
			}
		} else {

			const existing = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type', (q) => q.eq('type', args.type))
				.first();
			if (existing) {
				await ctx.db.patch(existing._id, { acked: false, createdAt: Date.now() });
			} else {
				await ctx.db.insert('pendingCommands', { type: args.type, acked: false, createdAt: Date.now() });
			}
		}
	}
});

export const clearPendingCommand = mutation({
	args: {
		type: v.union(v.literal('lock'), v.literal('led')),
		lockerId: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		if (args.type === 'lock' && args.lockerId !== undefined) {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type_lockerId', (q) => q.eq('type', args.type).eq('lockerId', args.lockerId))
				.first();
			if (cmd) await ctx.db.delete(cmd._id);
		} else {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type', (q) => q.eq('type', args.type))
				.first();
			if (cmd) await ctx.db.delete(cmd._id);
		}
	}
});

export const checkCommandAck = query({
	args: {
		type: v.union(v.literal('lock'), v.literal('led')),
		lockerId: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		if (args.type === 'lock' && args.lockerId !== undefined) {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type_lockerId', (q) => q.eq('type', args.type).eq('lockerId', args.lockerId))
				.first();
			return cmd?.acked ?? false;
		} else {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type', (q) => q.eq('type', args.type))
				.first();
			return cmd?.acked ?? false;
		}
	}
});

export const acknowledgeCommand = mutation({
	args: {
		type: v.union(v.literal('lock'), v.literal('led')),
		lockerId: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		if (args.type === 'lock' && args.lockerId !== undefined) {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type_lockerId', (q) => q.eq('type', args.type).eq('lockerId', args.lockerId))
				.first();
			if (cmd) {
				await ctx.db.patch(cmd._id, { acked: true });
				return { success: true };
			}
		} else {
			const cmd = await ctx.db
				.query('pendingCommands')
				.withIndex('by_type', (q) => q.eq('type', args.type))
				.first();
			if (cmd) {
				await ctx.db.patch(cmd._id, { acked: true });
				return { success: true };
			}
		}
		return { success: false };
	}
});

export const publishOpen = action({
	args: {
		ID: v.union(v.string(), v.number()),
		command: v.union(v.literal('open'), v.literal('close'))
	},
	handler: async (ctx, args) => {
		const id = typeof args.ID === 'string' ? parseInt(args.ID, 10) : args.ID;

		await ctx.runMutation(api.mqtt.setPendingCommand, { type: 'lock', lockerId: id });

		for (let i = 0; i < 120; i++) {
			await publishToEmqx('esp32/commands', JSON.stringify({ ID: id, command: args.command }));
			
			const acked: boolean = await ctx.runQuery(api.mqtt.checkCommandAck, { type: 'lock', lockerId: id });
			if (acked) return { success: true };
			
			if (i < 119) {
				await new Promise((r) => setTimeout(r, 500));
			}
		}

		await ctx.runMutation(api.mqtt.clearPendingCommand, { type: 'lock', lockerId: id });
		return { success: false, error: 'Timeout' };
	}
});

export const publishLed = action({
	args: {
		status: v.union(v.literal('success'), v.literal('failure'))
	},
	handler: async (ctx, args) => {
		await ctx.runMutation(api.mqtt.setPendingCommand, { type: 'led' });

		for (let i = 0; i < 120; i++) {
			await publishToEmqx('esp32/commands', JSON.stringify({ command: args.status }));
			
			const acked: boolean = await ctx.runQuery(api.mqtt.checkCommandAck, { type: 'led' });
			if (acked) return { success: true };
			
			if (i < 119) {
				await new Promise((r) => setTimeout(r, 500));
			}
		}

		await ctx.runMutation(api.mqtt.clearPendingCommand, { type: 'led' });
		return { success: false, error: 'Timeout' };
	}
});
