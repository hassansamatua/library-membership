# Tanzania Library Association - Membership System with Penalties & Cycles

## 🎯 Overview

A complete, production-ready membership payment system with:
- **Annual cycles** (Feb 1 - Jan 31)
- **Grace periods** (Feb-Mar, no penalties)
- **Progressive penalties** (1,000 TZS/month from Apr 1)
- **New member protection** (no penalties in first cycle)
- **Multi-cycle payments** (pay all unpaid cycles at once)
- **Automatic notifications** (email/SMS for all events)
- **Early payment support** (Oct-Jan for next cycle)

## ✨ Key Features

### 1. Automatic Cycle Management
- Cycles run Feb 1 - Jan 31
- System automatically calculates which cycle a date belongs to
- New users start in their approval month's cycle
- Next cycle automatically created when current pays

### 2. Smart Penalty System
```
Grace Period (Feb-Mar):
  └─ New users: No penalties ✓
  └─ Continuous users: No penalties ✓

Penalty Period (Apr-Jan):
  └─ New users (1st cycle): No penalties ✓
  └─ Continuous users: 1,000 TZS/month ✓

Formula: If paying May 1 → 50,000 base + (1 month × 1,000) = 51,000 TZS
```

### 3. Comprehensive Notifications
- **Approval**: Welcome + payment info + grace period dates
- **Grace Period Reminder**: Sent mid-period (Mar 15)
- **Penalty Warning**: Sent when penalties start (Apr 1)
- **Overdue Notices**: Periodic reminders for unpaid amounts
- **Payment Confirmation**: Receipt after successful payment

### 4. Flexible Payment Options
- Pay single cycle or multiple unpaid cycles
- System calculates penalties for each cycle
- Early payment for next cycle (Oct-Jan)
- Payment confirmation with detailed breakdown

## 🚀 Quick Start

### Step 1: Run Database Migration
```bash
php run_membership_cycles_migration.php
```

Verifies and creates:
- ✅ 4 new tables (membership_cycles, user_membership_status, cycle_payment_status, penalty_notifications)
- ✅ Updated memberships table (added cycle_year, is_new_user_cycle, penalty_amount)
- ✅ Updated payments table (added cycle_year, penalty_amount)
- ✅ Initial cycle data (2025-2028)

### Step 2: Configure Email (Optional)
Edit `.env.local`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@tanzanialibraryassociation.org
```

### Step 3: Test the System
```bash
php validate_membership_system.php
```

Returns detailed validation report with pass/fail/warning status.

### Step 4: Admin Approves User
```bash
curl -X POST http://localhost:3000/api/admin/approve-member \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"userId": 9, "membershipType": "personal"}'
```

This automatically:
- Marks user as approved
- Initializes membership cycles
- Sends approval notification
- Sets user as "new member"

### Step 5: User Makes Payment
```bash
curl -X POST http://localhost:3000/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "paymentReference": "TEST-1234567890",
    "amount": 50000,
    "paymentMethod": "halopesa"
  }'
```

System automatically:
- Calculates penalties if applicable
- Records payment in database
- Updates membership status
- Marks cycles as paid
- Sends payment confirmation

## 📊 Database Schema

### New Tables

#### membership_cycles
Stores annual cycle configuration
```sql
cycle_year INT (2025, 2026, 2027...)
start_date DATE (Feb 1)
end_date DATE (Jan 31)
grace_period_end DATE (Mar 31)
penalty_start_date DATE (Apr 1)
base_fee DECIMAL (50,000)
penalty_per_month DECIMAL (1,000)
```

#### user_membership_status
Tracks each user's membership journey
```sql
user_id INT (UNIQUE)
is_new_member BOOLEAN (first cycle flag)
first_membership_cycle INT (year user joined)
current_cycle_year INT (2026, 2027...)
status ENUM (active, inactive, suspended, expired)
payment_status ENUM (paid, grace_period, overdue, pending)
last_payment_date DATETIME
next_due_date DATE
```

#### cycle_payment_status
Tracks payment per user per cycle
```sql
user_id + cycle_year (UNIQUE)
is_paid BOOLEAN
payment_date DATETIME
amount_paid DECIMAL
penalty_amount DECIMAL
total_amount DECIMAL
payment_reference VARCHAR(100)
status ENUM (unpaid, grace_period, overdue, paid)
```

#### penalty_notifications
Notification history
```sql
user_id + cycle_year
notification_type ENUM (approval, grace_period_reminder, penalty_warning, overdue_notice)
sent_via ENUM (email, sms, both)
sent_date DATETIME
acknowledged BOOLEAN
```

## 📡 API Endpoints

### POST /api/admin/approve-member
**Approve a user for membership**

```bash
curl -X POST /api/admin/approve-member \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"userId": 9, "membershipType": "personal"}'
```

Response:
```json
{
  "success": true,
  "message": "User approved and notification sent",
  "user": {
    "id": 9,
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

### GET /api/payments/payment-status
**Get current payment status and cycle information**

```bash
curl /api/payments/payment-status \
  -H "Authorization: Bearer USER_TOKEN"
```

Response:
```json
{
  "approved": true,
  "isNewMember": true,
  "paymentStatus": "grace_period",
  
  "cycles": [
    {
      "cycleYear": 2026,
      "isPaid": false,
      "baseFee": 50000,
      "penalty": 0,
      "totalDue": 50000,
      "inGracePeriod": true,
      "gracePeriodEnd": "2026-04-01"
    }
  ],
  
  "summary": {
    "unpaidCycleCount": 1,
    "totalDue": 50000,
    "baseFeeTotal": 50000,
    "totalPenalty": 0,
    "paymentDeadline": "2026-04-01"
  }
}
```

### POST /api/payments/process
**Process payment for one or multiple cycles**

```bash
curl -X POST /api/payments/process \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "paymentReference": "TEST-123456",
    "amount": 50000,
    "paymentMethod": "halopesa",
    "cycleYear": 2026
  }'
```

Response:
```json
{
  "success": true,
  "payment": {
    "reference": "TEST-123456",
    "amount": 50000,
    "penalty": 0,
    "baseFee": 50000,
    "cyclesPaid": [2026],
    "paymentDate": "2026-01-15"
  },
  "message": "Payment successful! Paid 1 cycle(s) with no penalties"
}
```

## 📚 Helper Functions (lib/membershipCycles.ts)

```typescript
// Get cycle year for a date (Feb-Jan cycles)
getCycleYearForDate(date) → number

// Get cycle start/end dates
getCycleDates(cycleYear) → { startDate, endDate, gracePeriodEndDate, penaltyStartDate }

// Check if in grace period
isInGracePeriod(date, cycleYear) → boolean

// Get months since cycle start
getMonthsSinceCycleStart(date, cycleYear) → number

// Calculate penalty
calculatePenalty(paymentDate, cycleYear, isPreviouslyContinuous) → number

// Get all unpaid cycles
getUnpaidCycles(userId) → Array

// Initialize cycles for new user
initializeUserCycles(userId, joinDate, membershipType) → void

// Record cycle payment
recordCyclePayment(userId, cycleYear, amount, penalty, reference) → void

// Calculate total amount due
calculateTotalAmountDue(userId) → { totalAmount, breakdown }

// Mark user as continuous
markUserAsContinuous(userId) → void

// Update membership status
updateUserMembershipStatus(userId, status, paymentStatus) → void
```

## 🔔 Notification Functions (lib/notificationService.ts)

```typescript
// Send approval notification
sendApprovalNotification(userId, userName, membershipType) → Promise<boolean>

// Send grace period reminder
sendGracePeriodReminder(userId, userName, cycleYear, amount) → Promise<boolean>

// Send penalty warning
sendPenaltyWarning(userId, userName, cycleYear, baseFee, penalty, total) → Promise<boolean>

// Send payment confirmation
sendPaymentConfirmation(userId, userName, reference, amount, cycleYear) → Promise<boolean>

// Record notification
recordNotification(userId, cycleYear, notificationType, channel) → void

// Get notification history
getNotificationHistory(userId, cycleYear?) → Array
```

## 📋 Typical User Flows

### New User (Approved in February)
```
1. Admin approves user
   → Marked as "new member"
   → Cycles initialized: 2026, 2027
   → Approval notification sent

2. User pays during grace period (Feb-Mar)
   → Amount: 50,000 TZS (no penalty)
   → 2026 cycle marked as paid
   → Marked as "continuous" member

3. User checks payment status
   → Next cycle (2027) shows: 50,000 TZS
   → Grace period: Feb 1 - Mar 31, 2027
```

### Continuous User (Late Payment)
```
Current date: May 2026
Unpaid cycles: 2025, 2026

Calculation:
  2025: 50,000 base + 12,000 penalty (12 months) = 62,000 TZS
  2026: 50,000 base + 1,000 penalty (1 month) = 51,000 TZS
  Total: 113,000 TZS

User pays 113,000 TZS
  → Both cycles marked as paid
  → Payment confirmation sent
```

### Early Payment (October for Next Cycle)
```
Current date: October 15, 2025
Current cycle: 2025 (paid)

User pays for 2026 cycle early:
  → Amount: 50,000 TZS (no penalty, even though paying early)
  → 2026 marked as paid
  → When Feb 2026 arrives, no reminder sent (already paid)
```

## 🔧 Configuration

### Required Environment Variables
```env
# Database (existing)
DATABASE_URL=mysql://user:password@localhost/next_auth

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=app-password
EMAIL_FROM=noreply@tanzanialibraryassociation.org

# SMS (optional, for Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# Cron job secret (for automated tasks)
CRON_SECRET=your-secret-key
```

### Membership Fees (Configurable)
Edit `membership_cycles` table:
```sql
UPDATE membership_cycles
SET base_fee = 60000,           -- Change base fee
    penalty_per_month = 2000    -- Change monthly penalty
WHERE cycle_year = 2026;
```

## ⚙️ Implementation Checklist

- [x] Database schema and migration
- [x] Cycle calculation logic
- [x] Penalty calculation logic
- [x] Admin approval endpoint
- [x] Payment processing endpoint
- [x] Payment status endpoint
- [x] Notification service (email/SMS ready)
- [x] Multi-cycle payment handling
- [x] User status tracking (new/continuous)
- [x] Validation script
- [x] Documentation

**Remaining (for production):**
- [ ] Configure actual email provider
- [ ] Set up cron jobs for automated notifications
- [ ] Update UI to show cycle information
- [ ] Add grace period and penalty displays on payment page
- [ ] Integrate with accounting/invoicing system

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| `MEMBERSHIP_SYSTEM_SUMMARY.md` | Complete overview and implementation details |
| `MEMBERSHIP_CYCLES_IMPLEMENTATION.md` | Technical documentation and API reference |
| `MEMBERSHIP_CYCLES_QUICK_START.md` | Setup guide and testing instructions |
| `validate_membership_system.php` | Validation and testing script |

## 🧪 Testing

Run validation script:
```bash
php validate_membership_system.php
```

This tests:
- ✅ All tables exist
- ✅ Cycle data initialized
- ✅ User status records
- ✅ Payment records
- ✅ Table structure (new columns)
- ✅ Cycle calculations
- ✅ Grace period logic
- ✅ API endpoint files
- ✅ Library files

## 🐛 Troubleshooting

### Issue: "Unknown table 'membership_cycles'"
**Solution:** Run migration:
```bash
php run_membership_cycles_migration.php
```

### Issue: User not showing in payment status
**Check:**
1. Admin approved user via `/api/admin/approve-member`
2. `user_membership_status` table has record for user
3. `users.is_approved = TRUE`

### Issue: Penalties not calculating
**Check:**
1. Current date is after April 1
2. `user_membership_status.is_new_member = FALSE`
3. Payment cycle is not user's first cycle

### Issue: Email not sending
**Check:**
1. `.env.local` has EMAIL_* variables
2. Email provider credentials are correct
3. Check server logs for errors
4. Test email format: `sendEmailNotification('test@example.com', ...)`

## 📞 Support & Questions

Refer to documentation files:
- Technical questions → `MEMBERSHIP_CYCLES_IMPLEMENTATION.md`
- Setup issues → `MEMBERSHIP_CYCLES_QUICK_START.md`
- Testing problems → Run `validate_membership_system.php`
- General overview → `MEMBERSHIP_SYSTEM_SUMMARY.md`

## 📄 License

This implementation is custom-built for Tanzania Library Association.

## ✅ Production Readiness Checklist

- [x] Core logic implemented and tested
- [x] Database schema created with migration
- [x] API endpoints fully functional
- [x] Error handling and validation
- [x] Transaction safety (ACID compliance)
- [x] Documentation complete
- [x] Validation script included
- [ ] Email provider configured (user responsibility)
- [ ] Cron jobs set up (user responsibility)
- [ ] UI updated (future task)
- [ ] Load testing done
- [ ] Security audit completed

**Status**: Ready for staging/production deployment with email configuration

---

**Last Updated**: January 15, 2026  
**Version**: 1.0.0  
**Status**: ✅ Complete and Tested
