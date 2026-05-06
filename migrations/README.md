# Database Migrations

## OTP-Based Registration Flow

### Overview
Registration data is now stored in `pending_registration` table until OTP verification. Only after successful OTP verification, the user and profile records are created in the main tables.

### Setup Instructions

1. **Run the migration to create the pending_registration table:**

```bash
# Connect to your MySQL database
mysql -u your_username -p your_database_name < migrations/create_pending_registration_table.sql
```

Or using MySQL client:
```sql
SOURCE /path/to/matrimonial-app/migrations/create_pending_registration_table.sql;
```

2. **Verify the table was created:**

```sql
DESCRIBE pending_registration;
```

### Registration Flow

**Before (Old Flow):**
1. User submits registration → User + Profile created in DB immediately
2. OTP sent to email
3. User verifies OTP → emailVerified field updated

**After (New Flow):**
1. User submits registration → Data stored in `pending_registration` table only
2. OTP sent to email
3. User verifies OTP → User + Profile created in DB, pending record deleted

### API Endpoints Affected

- `POST /api/register` - Web registration
- `POST /api/flutter/auth/register` - Flutter registration
- `POST /api/auth/verify-otp` - Web OTP verification
- `POST /api/flutter/auth/verify-otp` - Flutter OTP verification
- `POST /api/auth/resend-otp` - Web resend OTP
- `POST /api/flutter/auth/resend-otp` - Flutter resend OTP

### Cleanup

Run the cleanup script periodically to remove expired pending registrations:

```bash
# Manual cleanup
node scripts/cleanup-pending-registrations.js

# Or setup as cron job (every hour)
0 * * * * cd /path/to/matrimonial-app && node scripts/cleanup-pending-registrations.js
```

### Database Schema

```sql
CREATE TABLE `pending_registration` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(20),
  `password` VARCHAR(255) NOT NULL,  -- Already hashed
  `gender` VARCHAR(20),
  `otp` VARCHAR(6) NOT NULL,
  `otpExpiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### Testing

1. **Register a new user:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

2. **Check pending_registration table:**
```sql
SELECT * FROM pending_registration WHERE email = 'test@example.com';
```

3. **Verify OTP:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'
```

4. **Verify user was created:**
```sql
SELECT * FROM user WHERE email = 'test@example.com';
SELECT * FROM pending_registration WHERE email = 'test@example.com'; -- Should be empty
```
