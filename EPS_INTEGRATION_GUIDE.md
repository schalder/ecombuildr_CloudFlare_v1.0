# EPS Payment Gateway Integration Guide

## Overview
The EPS Payment Gateway has been successfully integrated into your application, replacing SSLCommerz. EPS provides comprehensive payment solutions including:

- **Bank Transfers**: Direct bank-to-bank transfers
- **Card Payments**: Credit/Debit card processing
- **Mobile Financial Services (MFS)**: bKash, Nagad, Rocket, and other MFS providers

## Configuration

### Sandbox Credentials (for testing)
You can use these test credentials to configure EPS in sandbox mode:

```
Merchant ID: 29e86e70-0ac6-45eb-ba04-9fcb0aaed12a
Store ID: d44e705f-9e3a-41de-98b1-1674631637da
Username: Epsdemo@gmail.com
Password: Epsdemo258@
Hash Key: FHZxyzeps56789gfhg678ygu876o=
```

### How to Configure

1. Go to **Store Settings** → **Payment** tab
2. Enable **EPS Payment Gateway**
3. Enter your EPS credentials:
   - Merchant ID
   - Store ID
   - Username
   - Password
   - Hash Key
4. Set **Live Mode** to off for sandbox testing
5. Click **Save Payment Settings**

## How It Works for Your Users

### For Store/Website Visitors:
1. Customer adds products to cart
2. Proceeds to checkout
3. Selects "Bank/Card/MFS (EPS)" as payment method
4. Clicks "Place Order"
5. Redirected to EPS payment gateway
6. Chooses their preferred payment method:
   - Bank transfer
   - Credit/Debit card
   - Mobile banking (bKash, Nagad, etc.)
7. Completes payment
8. Redirected back to your site with payment status

### For Funnel Users:
Same process applies to funnel checkout forms with EPS integration.

## Payment Flow

```
Customer Checkout → EPS Gateway → Payment Method Selection → Payment → Verification → Order Confirmation
```

## API Integration Details

The integration includes:
- **Payment initialization**: Creates secure payment sessions
- **Transaction verification**: Verifies payment status
- **Webhook handling**: Processes payment notifications
- **Hash validation**: Ensures transaction security using HMAC-SHA512

## Migration from SSLCommerz

✅ **Completed automatically:**
- Removed SSLCommerz configuration UI
- Replaced with EPS payment gateway settings
- Updated all checkout forms and payment processing
- Migrated database payment method types
- Updated edge functions for EPS API integration

✅ **What changed:**
- Payment method "SSLCommerz" → "EPS"
- New payment gateway configuration fields
- Enhanced payment options (Bank + Card + MFS)
- Improved security with HMAC-SHA512 hashing

## Testing

1. Configure EPS with sandbox credentials
2. Add products to cart on your storefront
3. Proceed to checkout
4. Select "Bank/Card/MFS (EPS)" payment method
5. Complete test payment on EPS gateway
6. Verify order status updates correctly

## Production Setup

When ready for live payments:
1. Obtain production credentials from EPS
2. Update payment settings with live credentials
3. Enable "Live Mode" toggle
4. Test with small amounts first

## Support

For EPS-specific issues, contact EPS support:
- Website: https://www.eps.com.bd/
- For technical integration support

For application-level issues, use the Lovable support channels.