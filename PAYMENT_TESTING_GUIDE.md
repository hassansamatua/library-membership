# Quick Reference - Payment Flow Testing

## How to Test the Payment Flow

### Option 1: Automated Test
```bash
cd c:\xampp\htdocs\tutorial2
C:\xampp\php\php.exe test_payment_flow_complete.php
```

This will:
- Create a test payment
- Simulate the activate-test API call
- Verify all tables are updated correctly
- Confirm user can access membership card

### Option 2: Manual Testing
1. Open browser and go to: `http://localhost:3000/dashboard`
2. Navigate to the payment section
3. Select a payment method
4. Complete test payment
5. You should see the success page with reference number
6. Click "View Membership Card" button
7. Membership card should display (not the "Not Available" message)

## Database Verification

### Check if Payment is Completed
```sql
SELECT * FROM payments WHERE reference LIKE 'TEST-%' ORDER BY created_at DESC LIMIT 1;
-- Should show: status = 'completed', paid_at = NOW()
```

### Check if Membership Exists
```sql
SELECT * FROM memberships WHERE user_id = ? ORDER BY created_at DESC LIMIT 1;
-- Should show: status = 'active', payment_status = 'paid'
```

### Check if User Can Access Card
```sql
SELECT COUNT(*) as count FROM membership_payments 
WHERE user_id = ? AND status = 'completed';
-- Should return: count > 0
```

## Files Modified

1. **app/dashboard/payment/success/page.tsx**
   - Already correct, no changes needed

2. **app/api/payments/activate-test/route.ts**
   - Fixed memberships insert column names
   - Added membership_payments creation

3. **lib/membership.ts**
   - Added membership_payments creation in updateMembershipPayment()
   - Ensures real AzamPay payments also work correctly

## Expected Output After Payment

### In Database:
```
payments table:
  status = 'completed'
  paid_at = NOW()

memberships table:
  status = 'active'
  payment_status = 'paid'
  membership_number = 'TLAYYXXXXX'

membership_payments table:
  status = 'completed'
  payment_date = NOW()
```

### In UI:
```
✓ Success page shows:
  - Title: "Payment Successful!"
  - Message: "Test payment successful! Your membership has been activated."
  - Reference number displayed
  - "View Membership Card" button enabled

✓ Membership Card page shows:
  - Full membership card (NOT "Not Available" message)
  - Member name
  - Membership number
  - Phone number
  - Download/Print/Share options
```

## Troubleshooting

### Problem: "Membership Card Not Available"
**Cause:** No completed payment record in membership_payments table

**Solution:**
1. Check if payment exists: `SELECT * FROM payments WHERE user_id = ?`
2. Check if membership_payments record exists: `SELECT * FROM membership_payments WHERE user_id = ?`
3. Manually create record if missing:
```sql
INSERT INTO membership_payments 
(user_id, amount, payment_method, reference, payment_date, status, cycle_year)
VALUES (?, 40000, 'Test', 'TEST-123', NOW(), 'completed', 2026);
```

### Problem: "Unknown column" error
**Cause:** Using wrong column name in SQL

**Solution:** Always use these column names:
- In membership_payments: use `reference` NOT `payment_reference`
- In memberships: use `reference` for payment reference

### Problem: Payment shows "pending" instead of "completed"
**Cause:** activate-test API not called or failed

**Solution:**
1. Check browser console for errors
2. Check API response in Network tab
3. Manually update: `UPDATE payments SET status = 'completed', paid_at = NOW() WHERE reference = ?`

## Performance Notes

- Payment activation is fast (< 1 second typically)
- Membership card displays immediately after payment
- No need to refresh page after payment
- All updates happen in database transaction (atomic)

## Security Notes

- Test payments identified by "TEST-" prefix
- Only authenticated users can activate payments
- Token verification required in activate-test endpoint
- User can only activate their own payments
