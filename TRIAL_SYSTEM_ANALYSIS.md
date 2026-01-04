# Trial System Analysis: Current State vs Desired State

## Your Requirements (Desired State)

1. **User selects a plan** → Gets free trial
2. **During trial** → User gets ALL features/limits of the selected plan
3. **If they upgrade** → Keep using the same plan (or upgraded plan)
4. **If they don't upgrade** → Account becomes read-only after trial expires

**Simple flow:**
```
User selects plan → Free trial → Same plan limits apply → Upgrade keeps plan → No upgrade = read-only
```

---

## Current System Analysis

### ✅ What's Working Correctly

1. **Plan Selection & Trial Start**
   - Location: `supabase/migrations/20250818015119_f8597317-fb32-4373-a7dc-554900a5c38a.sql`
   - When user signs up, `handle_new_user()` function:
     - Reads `selected_plan` from user metadata
     - Sets `subscription_plan` = selected plan (e.g., 'starter', 'professional', 'enterprise')
     - Sets `account_status` = 'trial'
     - Sets `trial_expires_at` = now() + plan's trial_days
   - ✅ **This matches your requirement**

2. **Trial Users Get Plan Limits**
   - Location: `supabase/migrations/20250911105543_28912d11-3193-4e39-8445-a5831cd8ce95.sql`
   - `enforce_plan_limits()` function:
     - Uses `subscription_plan` to look up limits from `plan_limits` table
     - Does NOT differentiate between trial and active users
     - Trial users with `subscription_plan = 'starter'` get starter limits (20 pages)
     - Trial users with `subscription_plan = 'professional'` get professional limits (50 pages)
   - ✅ **This matches your requirement**

3. **Upgrade Keeps Plan**
   - Location: `supabase/migrations/20250818021617_5d078ebb-8e67-470d-93a8-3e9bd0d7c7de.sql`
   - When subscription becomes active:
     - `subscription_plan` stays the same (or updates to new plan if upgrading)
     - `account_status` changes to 'active'
     - Trial dates are cleared
   - ✅ **This matches your requirement**

4. **Trial Expiration → Read-Only**
   - Location: `supabase/functions/account-enforcement/index.ts`
   - Daily cron job checks expired trials
   - After 3-day grace period, sets `account_status = 'read_only'`
   - Makes websites/funnels inactive
   - ✅ **This matches your requirement**

### Current Plan Limits (from migrations)

```sql
-- From 20250815180418_cd704f82-f362-46cd-9441-c50d65cb8435.sql
('starter', 500, 7, 1, 1, 1, 20, 50, 100, false, false, false)
--                    ↑  ↑  ↑  ↑  ↑   ↑
--                    stores, websites, funnels, pages, products, orders

('professional', 1500, 7, 5, 5, 10, 50, 100, 300, true, true, false)
('enterprise', 2999, 7, NULL, NULL, NULL, NULL, NULL, NULL, true, true, true)
```

---

## Potential Issues / Edge Cases

### 1. **Issue: Trial Users Hitting Page Limit**
- **Current**: Starter plan = 20 pages limit
- **Problem**: Some trial users are hitting this limit
- **Question**: Is 20 pages too low for trial users to properly test the platform?

### 2. **Issue: Plan Limits Lookup**
- The `enforce_plan_limits()` function uses `subscription_plan` to get limits
- This is correct behavior per your requirements
- But if `subscription_plan` is NULL or doesn't match any plan, it might fail

### 3. **Issue: Upgrade Process**
- When user upgrades, `subscription_plan` can change to a different plan
- This is correct if they upgrade to a higher tier
- But we need to ensure limits update immediately

### 4. **Issue: Account Status vs Plan Limits**
- The system correctly uses `subscription_plan` for limits (not `account_status`)
- This means trial users get full plan features, which is what you want
- ✅ **No issue here**

---

## Verification Needed

To confirm everything works as expected, we should check:

1. **Database State**
   - Are all trial users correctly set with `subscription_plan` matching their selected plan?
   - Are `plan_limits` table values correct?
   - Are there any users with NULL `subscription_plan`?

2. **Limit Enforcement**
   - Is `enforce_plan_limits()` correctly checking `subscription_plan`?
   - Are trial users getting the correct limits?

3. **Upgrade Flow**
   - When users upgrade, does `subscription_plan` update correctly?
   - Do limits update immediately?

4. **Expiration Flow**
   - Are expired trials correctly moving to read-only?
   - Are limits still enforced correctly in read-only mode?

---

## Conclusion

**The current system appears to already implement your requirements correctly:**

✅ User selects plan → Gets trial with that plan  
✅ Trial users get same limits as selected plan  
✅ Upgrade keeps/updates plan  
✅ No upgrade → read-only after expiration  

**However, there might be:**
- Data inconsistencies (some users might have wrong `subscription_plan`)
- The 20-page limit might be too restrictive for trial users
- Edge cases where `subscription_plan` is NULL or invalid

**Next Steps:**
1. Verify database state (check actual user data)
2. Confirm if 20 pages is the intended limit for starter plan trial users
3. Check for any edge cases or data inconsistencies
4. Create fixes if needed

