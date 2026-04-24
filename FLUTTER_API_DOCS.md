# Flutter REST API Documentation

Base URL: `https://vivahdwar.com`

## Authentication Flow

### 1. Register
**POST** `/api/flutter/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. OTP sent to your email.",
  "userId": "uuid",
  "email": "john@example.com"
}
```

---

### 2. Verify OTP
**POST** `/api/flutter/auth/verify-otp`

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "type": "EMAIL_VERIFY"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER",
    "isPremium": false,
    "premiumPlan": null,
    "adminVerified": false
  }
}
```

---

### 3. Login
**POST** `/api/flutter/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "role": "USER",
    "isPremium": false,
    "premiumPlan": null,
    "adminVerified": true,
    "verificationBadge": false,
    "freeTrialActive": false,
    "freeTrialExpiry": null
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Email not verified (code: `EMAIL_NOT_VERIFIED`)
- `403` - Pending admin approval (code: `PENDING_APPROVAL`)
- `403` - Account suspended

---

### 4. Resend OTP
**POST** `/api/flutter/auth/resend-otp`

**Body:**
```json
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFY"
}
```

Types: `EMAIL_VERIFY`, `PASSWORD_RESET`, `LOGIN_OTP`

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

---

### 5. Forgot Password
**POST** `/api/flutter/auth/forgot-password`

**Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

---

### 6. Reset Password
**POST** `/api/flutter/auth/reset-password`

**Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "password": "newpassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login."
}
```

---

## Profile API

### Get Profile
**GET** `/api/flutter/profile/{id}`

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id` - User ID or `me` for current user

**Response (200):**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+919876543210",
  "isPremium": false,
  "premiumPlan": null,
  "verificationBadge": false,
  "adminVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "profile": {
    "gender": "MALE",
    "dob": "1995-01-01",
    "height": 175,
    "weight": 70,
    "religion": "Hindu",
    "caste": "Brahmin",
    "subCaste": "Sharma",
    "gotra": "Bharadwaj",
    "motherTongue": "Hindi",
    "education": "B.Tech",
    "profession": "Software Engineer",
    "income": "10-15 LPA",
    "country": "India",
    "state": "Maharashtra",
    "city": "Mumbai",
    "aboutMe": "...",
    "maritalStatus": "NEVER_MARRIED",
    "complexion": "Fair",
    "bodyType": "Athletic",
    "diet": "Vegetarian",
    "smoking": "NO",
    "drinking": "NO",
    "familyType": "Nuclear",
    "familyStatus": "Middle Class",
    "profileComplete": 85,
    "partnerPreferences": {
      "ageMin": 22,
      "ageMax": 28,
      "heightMin": 155,
      "heightMax": 170,
      "religion": "Hindu",
      "education": "Graduate",
      "profession": "Any"
    }
  },
  "photos": [
    {
      "id": "uuid",
      "url": "https://...",
      "isMain": true
    }
  ]
}
```

---

## Postman Testing

### 1. Register
```
POST https://vivahdwar.com/api/flutter/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "+919876543210",
  "password": "test1234"
}
```

### 2. Check Email for OTP (6 digits)

### 3. Verify OTP
```
POST https://vivahdwar.com/api/flutter/auth/verify-otp
Content-Type: application/json

{
  "email": "test@example.com",
  "otp": "123456"
}
```

### 4. Copy the `token` from response

### 5. Get Profile
```
GET https://vivahdwar.com/api/flutter/profile/me
Authorization: Bearer {paste-token-here}
```

### 6. Login (next time)
```
POST https://vivahdwar.com/api/flutter/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "test1234"
}
```

---

## Notes

- All tokens expire in 30 days
- OTPs expire in 10 minutes
- Phone/email hidden for non-premium users viewing other profiles
- Admin approval required before full access
- Free trial activated by admin after approval
