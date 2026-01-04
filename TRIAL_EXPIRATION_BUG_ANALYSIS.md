# Trial Expiration Bug Analysis

## Problem Summary

Users are getting "Page limit reached" error even though:
1. They have active trial accounts (`account_status = 'trial'`)
2. They haven't reached their page limits (e.g., 7 pages out of 50)
3. Dashboard shows "Trial ended - 2 days remaining" (grace period)
4. Profile page shows "Trial Plan - 0 days remaining"

## Root Cause Analysis

### Issue #1: Database Function Blocks During Grace Period

**Location:** `supabase/migrations/20250911105543_28912d11-3193-4e39-8445-a5831cd8ce95.sql`

**Problem Code (lines 32-35):**
```sql
-- Check if trial has expired for trial accounts
IF account_status = 'trial' AND trial_expires IS NOT NULL AND trial_expires < now() THEN
  RETURN false;
END IF;
```

**Issue:** 
- This function blocks resource creation immediately when `trial_expires_at < now()`
- It does NOT account for the 3-day grace period
- But the frontend shows grace period messages, suggesting users should still be able to create resources

**Expected Behavior:**
- Users should be able to create resources during grace period (3 days after trial expiry)
- Only block after grace period ends

### Issue #2: Frontend Shows Conflicting Messages

**Dashboard Banner (`PlanStatusBanner.tsx`):**
- Shows "ট্রায়াল শেষ - 2 দিন বাকি" (Trial ended - 2 days remaining)
- This is correct - user is in grace period

**Profile Page (`ProfileSettings.tsx`):**
- Shows "ট্রায়াল প্ল্যান - 0 দিন বাকি" (Trial Plan - 0 days remaining)
- Uses `getTrialDaysRemaining()` which returns 0 when trial has expired
- Should show grace period days instead

**Problem:**
- `getTrialDaysRemaining()` only checks if trial hasn't expired yet
- It doesn't account for grace period
- Should show grace period days when trial expired but still in grace

### Issue #3: Grace Period Inconsistency

**Different grace periods in codebase:**
- `usePlanLimits.tsx`: 3 days grace period
- `usePlanLimitsUpdated.tsx`: 7 days grace period  
- `account-enforcement` function: 3 days grace period

**Need to standardize:** Should be 3 days based on account-enforcement function

## Current Database State

**Example User:**
- `account_status`: 'trial'
- `trial_expires_at`: '2026-01-03 06:22:19' (expired on Jan 3)
- `current_time`: '2026-01-04 21:01:12' (current time)
- `grace_end`: '2026-01-06 06:22:19' (3 days after expiry)
- **Status**: Trial expired, but in grace period (2 days remaining)

**What happens:**
1. User tries to create page
2. Database function `enforce_plan_limits()` checks: `trial_expires_at < now()` → TRUE
3. Function returns `false` → Blocks creation
4. Error: "Page limit reached for your current plan"

**What should happen:**
1. User tries to create page
2. Database function checks: `trial_expires_at < now()` → TRUE
3. But also checks: `now() < (trial_expires_at + 3 days)` → TRUE (in grace period)
4. Function should return `true` → Allow creation during grace period

## Fix Required

### Fix #1: Update `enforce_plan_limits()` Function

**Current:**
```sql
-- Check if trial has expired for trial accounts
IF account_status = 'trial' AND trial_expires IS NOT NULL AND trial_expires < now() THEN
  RETURN false;
END IF;
```

**Should be:**
```sql
-- Check if trial has expired AND grace period has ended
IF account_status = 'trial' AND trial_expires IS NOT NULL THEN
  -- Allow during grace period (3 days after expiry)
  IF trial_expires < now() AND now() > (trial_expires + INTERVAL '3 days') THEN
    RETURN false; -- Grace period ended
  END IF;
  -- If in grace period, continue to check limits
END IF;
```

### Fix #2: Update `getTrialDaysRemaining()` Function

**Current (`usePlanLimits.tsx` line 275-284):**
```typescript
const getTrialDaysRemaining = (): number => {
  if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
    const expiryDate = new Date(userProfile.trial_expires_at);
    const now = new Date();
    const diffTime = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }
  return 0;
};
```

**Should be:**
```typescript
const getTrialDaysRemaining = (): number => {
  if (userProfile?.account_status === 'trial' && userProfile?.trial_expires_at) {
    const expiryDate = new Date(userProfile.trial_expires_at);
    const now = new Date();
    
    // If trial hasn't expired, return days until expiry
    if (now < expiryDate) {
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    // If trial expired but in grace period, return grace period days
    const graceEnd = new Date(expiryDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    if (now < graceEnd) {
      const diffTime = graceEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    }
    
    // Grace period ended
    return 0;
  }
  return 0;
};
```

### Fix #3: Update Profile Page Display

**Current (`ProfileSettings.tsx` line 118):**
```typescript
const daysRemaining = getTrialDaysRemaining();
```

**Should show:**
- If trial active: "ট্রায়াল প্ল্যান - X দিন বাকি"
- If trial expired but in grace: "ট্রায়াল শেষ - X দিন বাকি (গ্রেস পিরিয়ড)"
- If grace period ended: "ট্রায়াল শেষ - 0 দিন বাকি"

## Summary

**The Problem:**
1. Database function blocks resource creation immediately when trial expires
2. Frontend shows grace period but users can't actually use it
3. Profile page shows 0 days when it should show grace period days

**The Fix:**
1. Update `enforce_plan_limits()` to allow resource creation during grace period
2. Update `getTrialDaysRemaining()` to return grace period days when trial expired
3. Update profile page to show correct grace period status

**Impact:**
- Users will be able to create pages/funnels during grace period
- UI will show correct remaining days (grace period)
- System will be consistent between frontend and backend

