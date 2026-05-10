import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	mailboxes: defineTable({
		locker_number: v.float64(),
		recipient_uid: v.string(),
		parcel_id: v.string(),
		status: v.string()
	}).index('by_locker_number', ['locker_number']),
	parcels: defineTable({
		tracking_id: v.string(),
		recipient_uid: v.string(),
		courier_id: v.string(),
		delivered_by: v.float64(),
		in_locker_by: v.float64(),
		claim_date: v.float64(),
		claim_by: v.float64(),
		storage_date: v.float64(),
		status: v.string()
	}).index('by_recipient_parcel', ['recipient_uid', 'tracking_id']),
	scans: defineTable({
		uin: v.string(),
		transaction_id: v.string(),
		status: v.string(),
		scanned_at: v.number()
	}).index('by_uin', ['uin']),
	userRoles: defineTable({
		uin: v.string(),
		role: v.string()
	}).index('by_uin', ['uin'])
});
