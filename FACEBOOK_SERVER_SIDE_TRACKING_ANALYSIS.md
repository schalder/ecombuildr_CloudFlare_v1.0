# Facebook Server-Side Tracking - Complete Setup Analysis

## 📋 Table of Contents
1. [Current Architecture Overview](#current-architecture-overview)
2. [Funnel Pages Tracking](#funnel-pages-tracking)
3. [Website Pages Tracking](#website-pages-tracking)
4. [Funnel Checkout Element (InlineCheckoutElement)](#funnel-checkout-element)
5. [Website Checkout Element (CheckoutFullElement)](#website-checkout-element)
6. [Purchase Event Tracking](#purchase-event-tracking)
7. [Funnel Offer Element](#funnel-offer-element)
8. [Issues Found](#issues-found)
9. [Recommendations](#recommendations)

---

## Current Architecture Overview

### How Server-Side Tracking Works

1. **Client-Side Event Capture**
   - Events are tracked via `usePixelTracking` hook
   - Events sent to Facebook Pixel (client-side) via `window.fbq()`
   - Events stored in `pixel_events` table

2. **Database Trigger**
   - Trigger `forward_facebook_events_trigger` fires on INSERT to `pixel_events`
   - Function `forward_pixel_event_to_facebook()` checks:
     - If Facebook is configured (`_providers.facebook.configured = true`)
     - If server-side tracking is enabled
     - If Access Token exists
     - Gets config from `website_id` OR `funnel_id` column

3. **Server-Side Forwarding**
   - Edge Function `send-facebook-event` receives event
   - Hashes user data (SHA256)
   - Sends to Facebook Conversions API

4. **Deduplication**
   - Both client and server-side use same `event_id`
   - Facebook automatically deduplicates

---

## Funnel Pages Tracking

### How It Works

**File:** `src/pages/storefront/FunnelStepPage.tsx`

1. **Page Load**
   ```typescript
   <PixelManager 
     storeId={funnel.store_id}
     funnelId={funnel.id}  // ✅ Correctly passed
     websitePixels={{
       facebook_pixel_id: funnel.settings?.facebook_pixel_id,
       google_analytics_id: funnel.settings?.google_analytics_id,
       google_ads_id: funnel.settings?.google_ads_id,
     }}
   >
   ```

2. **PixelManager Initialization**
   - `PixelManager` receives `funnelId={funnel.id}`
   - Calls `usePixelTracking(currentPixels, storeId, websiteId, funnelId)`
   - `funnelId` is correctly passed to tracking hook

3. **PageView Event**
   - `trackPageView()` called automatically on page load
   - Event stored with:
     - `store_id`: funnel.store_id ✅
     - `website_id`: null ✅ (correct for funnels)
     - `funnel_id`: funnel.id ✅ (set by usePixelTracking hook)
     - `event_data._providers.facebook.configured`: true/false ✅

4. **Server-Side Forwarding**
   - Trigger checks `NEW.funnel_id` column
   - Looks up funnel config: `f.settings->>'facebook_access_token'`
   - Forwards if `facebook_server_side_enabled = true`

### ✅ Status: WORKING CORRECTLY

---

## Website Pages Tracking

### How It Works

**File:** `src/components/storefront/WebsiteLayout.tsx`

1. **Page Load**
   ```typescript
   <PixelManager websitePixels={website.settings} storeId={website.store_id}>
   ```
   - Note: No `funnelId` prop (correct for websites)

2. **PixelManager Initialization**
   - `PixelManager` extracts `websiteId` from `WebsiteContext`
   - Calls `usePixelTracking(currentPixels, storeId, websiteId, undefined)`
   - `websiteId` is correctly passed

3. **PageView Event**
   - `trackPageView()` called automatically
   - Event stored with:
     - `store_id`: website.store_id ✅
     - `website_id`: website.id ✅ (set by usePixelTracking hook)
     - `funnel_id`: null ✅ (correct for websites)
     - `event_data._providers.facebook.configured`: true/false ✅

4. **Server-Side Forwarding**
   - Trigger checks `NEW.website_id` column
   - Looks up website config: `w.facebook_access_token`
   - Forwards if `facebook_server_side_enabled = true`

### ✅ Status: WORKING CORRECTLY

---

## Funnel Checkout Element (InlineCheckoutElement)

### How It Works

**File:** `src/components/page-builder/elements/InlineCheckoutElement.tsx`

1. **Element Initialization**
   ```typescript
   const { pixels } = usePixelContext(); // Gets pixels from PixelManager
   const { trackPurchase, trackInitiateCheckout } = usePixelTracking(
     pixels, 
     store?.id, 
     websiteId, 
     funnelId  // ✅ From URL params
   );
   ```

2. **InitiateCheckout Event**
   - Fires when user clicks "Place Order"
   - Uses `trackInitiateCheckout()` from hook
   - ✅ Correctly sets `funnel_id` column via hook

3. **Purchase Event - COD Orders**
   ```typescript
   // Line 718: Direct insert (BYPASSES HOOK)
   await supabase.from('pixel_events').insert({
     store_id: store.id,
     website_id: resolvedWebsiteId || null,
     // ❌ MISSING: funnel_id: orderFunnelId
     event_type: 'Purchase',
     event_data: {
       funnel_id: orderFunnelId  // ✅ In event_data, but NOT in column
     }
   });
   ```

   **Problem:** `funnel_id` is in `event_data` but NOT in the column!
   - Trigger checks `NEW.funnel_id` (column)
   - Won't find funnel config
   - Server-side forwarding will fail ❌

4. **Purchase Event - Online Payments**
   - Redirects to `PaymentProcessing.tsx`
   - See PaymentProcessing section below

### ❌ Status: ISSUE FOUND - Missing `funnel_id` column in direct inserts

---

## Website Checkout Element (CheckoutFullElement)

### How It Works

**File:** `src/components/page-builder/elements/EcommerceSystemElements.tsx`

1. **Element Initialization**
   - Uses `usePixelTracking` hook
   - Gets `websiteId` from context
   - No `funnelId` (correct for website checkout)

2. **Purchase Event**
   - Uses `trackPurchase()` from hook
   - ✅ Correctly sets `website_id` column via hook
   - ✅ Server-side forwarding works

### ✅ Status: WORKING CORRECTLY

---

## Purchase Event Tracking

### Purchase Event Flow

#### 1. Funnel Checkout - COD Orders

**File:** `src/components/page-builder/elements/InlineCheckoutElement.tsx`

**Flow:**
```
User clicks "Place Order" (COD)
  ↓
Order created in database
  ↓
Direct insert to pixel_events (line 718)
  ❌ Missing funnel_id column!
  ✅ Has funnel_id in event_data
  ↓
Trigger fires
  ❌ Checks NEW.funnel_id (column) - NULL!
  ❌ Can't find funnel config
  ❌ Server-side forwarding SKIPPED
```

**Issue:** `funnel_id` column not set in insert statement

---

#### 2. Funnel Checkout - Online Payments (EBPay/EPS)

**File:** `src/pages/storefront/PaymentProcessing.tsx`

**Flow:**
```
Payment successful
  ↓
Order created/updated
  ↓
Direct insert to pixel_events (line 563)
  ❌ Missing funnel_id column!
  ✅ Has funnel_id in event_data
  ↓
Trigger fires
  ❌ Checks NEW.funnel_id (column) - NULL!
  ❌ Can't find funnel config
  ❌ Server-side forwarding SKIPPED
```

**Issue:** `funnel_id` column not set in insert statement

---

#### 3. Order Confirmation Page

**File:** `src/pages/storefront/OrderConfirmation.tsx`

**Flow:**
```
Page loads
  ↓
Checks if purchase already tracked
  ↓
Direct insert to pixel_events (line 205)
  ❌ Missing funnel_id column!
  ✅ Has funnel_id in event_data
  ↓
Trigger fires
  ❌ Checks NEW.funnel_id (column) - NULL!
  ❌ Can't find funnel config
  ❌ Server-side forwarding SKIPPED
```

**Issue:** `funnel_id` column not set in insert statement

---

#### 4. Website Checkout - All Payment Methods

**File:** `src/components/page-builder/elements/EcommerceSystemElements.tsx`

**Flow:**
```
User completes checkout
  ↓
Uses trackPurchase() hook
  ✅ Correctly sets website_id column
  ✅ Server-side forwarding works
```

**Status:** ✅ WORKING CORRECTLY

---

## Funnel Offer Element

### How It Works

**File:** `src/components/page-builder/elements/FunnelOfferElement.tsx`

1. **Element Purpose**
   - Shows upsell/downsell offer after purchase
   - User can accept or decline

2. **Event Tracking**
   - ❌ **NO EVENT TRACKING IMPLEMENTED**
   - Should track "AddToCart" or "ViewContent" when offer shown
   - Should track "Purchase" if user accepts offer

3. **Current Behavior**
   - Calls `funnel-offer` Edge Function
   - Updates order
   - Redirects to next step
   - **No pixel events tracked**

### ❌ Status: MISSING EVENT TRACKING

---

## Issues Found

### 🔴 Critical Issues

#### Issue #1: Missing `funnel_id` Column in Direct Inserts

**Location:**
- `src/components/page-builder/elements/InlineCheckoutElement.tsx` (line 718)
- `src/pages/storefront/PaymentProcessing.tsx` (line 563)
- `src/pages/storefront/OrderConfirmation.tsx` (line 205)

**Problem:**
```typescript
// Current (WRONG):
await supabase.from('pixel_events').insert({
  store_id: store.id,
  website_id: websiteId || null,
  // ❌ MISSING: funnel_id: funnelId
  event_type: 'Purchase',
  event_data: {
    funnel_id: funnelId  // ✅ In event_data, but trigger checks column!
  }
});
```

**Impact:**
- Server-side trigger checks `NEW.funnel_id` (column)
- Column is NULL, so trigger can't find funnel config
- Server-side forwarding is SKIPPED for funnel purchases
- Only client-side tracking works (can be blocked by ad blockers)

**Fix Required:**
```typescript
// Should be:
await supabase.from('pixel_events').insert({
  store_id: store.id,
  website_id: websiteId || null,
  funnel_id: funnelId || null,  // ✅ ADD THIS
  event_type: 'Purchase',
  event_data: {
    funnel_id: funnelId  // ✅ Keep this too for event_data
  }
});
```

---

#### Issue #2: Funnel Offer Element Missing Event Tracking

**Location:**
- `src/components/page-builder/elements/FunnelOfferElement.tsx`

**Problem:**
- No pixel events tracked when offer is shown
- No pixel events tracked when offer is accepted
- Missing "ViewContent" for offer product
- Missing "AddToCart" or "Purchase" if user accepts

**Impact:**
- Offer interactions not tracked
- Can't measure offer conversion rates
- Missing data for Facebook optimization

**Fix Required:**
- Add `usePixelTracking` hook
- Track "ViewContent" when offer loads
- Track "Purchase" if user accepts offer

---

### 🟡 Minor Issues

#### Issue #3: Inconsistent Event Data Structure

**Problem:**
- Some events use `funnel_id` in `event_data`
- Some events don't include customer data in `event_data`
- Purchase events should include `customer_email`, `customer_phone`, `customer_name` for better matching

**Impact:**
- Facebook matching may be less accurate
- Missing user data reduces conversion tracking quality

**Recommendation:**
- Standardize event data structure
- Always include customer data in Purchase events when available

---

## Recommendations

### Priority 1: Fix Critical Issues

1. **Add `funnel_id` column to all direct inserts**
   - Fix `InlineCheckoutElement.tsx` line 718
   - Fix `PaymentProcessing.tsx` line 563
   - Fix `OrderConfirmation.tsx` line 205

2. **Add event tracking to Funnel Offer Element**
   - Track "ViewContent" when offer shown
   - Track "Purchase" when offer accepted

### Priority 2: Enhance Event Data

3. **Include customer data in Purchase events**
   - Add `customer_email`, `customer_phone`, `customer_name` to `event_data`
   - Improves Facebook matching accuracy

4. **Standardize event data structure**
   - Create helper function for consistent event data
   - Ensure all events include required fields

### Priority 3: Testing & Validation

5. **Add test event codes for debugging**
   - Use Facebook Test Event Code during development
   - Verify events appear in Facebook Events Manager

6. **Add logging for server-side forwarding**
   - Log when events are forwarded
   - Log when events are skipped (and why)
   - Helps debug configuration issues

---

## Summary

### ✅ What's Working

1. **Funnel Pages**: PageView events tracked correctly
2. **Website Pages**: PageView events tracked correctly
3. **Website Checkout**: Purchase events tracked correctly (uses hook)
4. **Database Trigger**: Correctly checks website/funnel config
5. **Edge Function**: Correctly formats and sends to Facebook

### ❌ What's Broken

1. **Funnel Checkout - COD**: Missing `funnel_id` column → Server-side forwarding fails
2. **Funnel Checkout - Online Payments**: Missing `funnel_id` column → Server-side forwarding fails
3. **Order Confirmation (Funnels)**: Missing `funnel_id` column → Server-side forwarding fails
4. **Funnel Offer Element**: No event tracking implemented

### 🔧 Fixes Required

1. Add `funnel_id` column to 3 direct insert statements
2. Add event tracking to Funnel Offer Element
3. Include customer data in Purchase events

---

## Next Steps

1. Fix missing `funnel_id` columns (Critical)
2. Add Funnel Offer tracking (High Priority)
3. Test with Facebook Test Event Code
4. Verify events appear in Facebook Events Manager
5. Monitor `facebook_event_failures` table for errors

