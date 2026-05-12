import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const logAttempt = mutation({
  args: { locker_num: v.float64(), date: v.float64(), uin: v.string(), is_successful: v.boolean() },
  handler: async (ctx, args) => {
    const newAttemptId = await ctx.db.insert("attempts", { locker_number: args.locker_num, attempt_date: args.date, uin: args.uin, is_successful: args.is_successful });
    return newAttemptId;
  },
});

export const getAttempts = query({
  args: {},
  handler: async (ctx) => {
    const attempts = await ctx.db.query('attempts').collect();
    return attempts;
  }
});