-- Fix membership dates for existing records
-- This script updates existing membership records to have correct expiry dates (January 31st)

-- Update existing membership records to have correct expiry dates
UPDATE memberships 
SET 
  expiry_date = CASE 
    -- If expiry date is January 21, 2027, fix it to January 31, 2027
    WHEN expiry_date = '2027-01-21 21:00:00' THEN '2027-01-31 23:59:59'
    -- If expiry date is in January 2027 but not the 31st, fix it to January 31, 2027
    WHEN YEAR(expiry_date) = 2027 AND MONTH(expiry_date) = 1 THEN '2027-01-31 23:59:59'
    -- If expiry date is invalid (1899), set it to January 31, 2027
    WHEN YEAR(expiry_date) < 1900 THEN '2027-01-31 23:59:59'
    -- Otherwise keep existing expiry date
    ELSE expiry_date
  END,
  joined_date = CASE 
    -- If joined date is invalid (NULL or 1899), set it to payment date
    WHEN joined_date IS NULL OR YEAR(joined_date) < 1900 THEN payment_date
    -- Otherwise keep existing joined date
    ELSE joined_date
  END,
  updated_at = NOW()
WHERE 
  -- Only update records with wrong expiry dates
  (expiry_date = '2027-01-21 21:00:00' OR 
   YEAR(expiry_date) = 2027 AND MONTH(expiry_date) = 1 AND DAY(expiry_date) <> 31 OR
   YEAR(expiry_date) < 1900);

-- Update user_profiles joined_date if it's invalid
UPDATE user_profiles 
SET 
  joined_date = CASE 
    -- If joined_date is invalid, set it to user creation date
    WHEN joined_date IS NULL OR YEAR(joined_date) < 1900 THEN 
      (SELECT created_at FROM users WHERE users.id = user_profiles.id LIMIT 1)
    -- Otherwise keep existing joined date
    ELSE joined_date
  END,
  updated_at = NOW()
WHERE 
  joined_date IS NULL OR YEAR(joined_date) < 1900;

-- Show the updated records for verification
SELECT 
  u.id,
  u.name,
  u.email,
  up.membership_number,
  up.joined_date as profile_joined_date,
  m.joined_date as membership_joined_date,
  m.expiry_date,
  m.payment_status,
  m.status
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN memberships m ON u.id = m.user_id
WHERE up.membership_number IS NOT NULL
ORDER BY u.id;
