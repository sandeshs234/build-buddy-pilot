# Authentication Testing Checklist

This document provides a comprehensive testing checklist for all authentication flows in BuildForge. Use this for regression testing after authentication changes.

---

## 1. Email/Password Signup Flow

### Basic Signup
- [ ] Navigate to `/login` page
- [ ] Click "Create account" button
- [ ] Fill in Full Name field
- [ ] Fill in Email field with valid email
- [ ] Fill in Password field with strong password (8+ chars, uppercase, number, special char)
- [ ] Verify password strength indicator shows all 4 requirements met
- [ ] Click "Create Account" button
- [ ] Verify success toast message: "Account created! You can now sign in."
- [ ] Verify user is redirected to dashboard and logged in
- [ ] Verify user profile shows correct name in sidebar

### Password Strength Validation
- [ ] Test password with less than 8 characters
  - Expected: Strength indicator shows incomplete
  - Expected: "Create Account" button disabled or shows error
- [ ] Test password without uppercase letter
  - Expected: Uppercase requirement unchecked
- [ ] Test password without number
  - Expected: Number requirement unchecked
- [ ] Test password without special character
  - Expected: Special character requirement unchecked
- [ ] Test weak password rejection
  - Expected: Error toast: "Weak password - Must include 8+ chars, uppercase, number & special character"

### HIBP (Have I Been Pwned) Check
- [ ] Attempt to signup with a common/leaked password (e.g., "Password123!")
  - Expected: Signup fails with HIBP validation error
  - Expected: User is notified the password has been compromised
- [ ] Retry with a strong unique password
  - Expected: Signup succeeds

### Email Validation
- [ ] Test signup with invalid email format (e.g., "notanemail")
  - Expected: Error: "Invalid email format"
- [ ] Test signup with valid email format
  - Expected: Signup proceeds
- [ ] Test duplicate email signup
  - Expected: Error: "User with this email already exists"

### Auto-Confirm Email (if enabled)
- [ ] Complete signup with valid credentials
- [ ] Verify user can immediately sign in without email confirmation
  - Expected: No email verification step required

---

## 2. Email/Password Login Flow

### Basic Login
- [ ] Navigate to `/login` page
- [ ] Enter registered email address
- [ ] Enter correct password
- [ ] Click "Sign In" button
- [ ] Verify user is logged in and redirected to dashboard
- [ ] Verify user name appears in sidebar with "VIEWER" role badge

### Login Error Handling
- [ ] Test login with non-existent email
  - Expected: Error toast: "Login failed - User not found"
- [ ] Test login with correct email but wrong password
  - Expected: Error toast: "Login failed - Invalid password"
- [ ] Test login with empty email field
  - Expected: Validation error on email field
- [ ] Test login with empty password field
  - Expected: Validation error on password field

### Session Persistence
- [ ] Login successfully
- [ ] Refresh the page (F5)
  - Expected: User remains logged in
- [ ] Close browser tab and reopen the app
  - Expected: User session persists (if localStorage enabled)
- [ ] Check browser DevTools > Application > LocalStorage
  - Expected: Session token stored

### Sign Out
- [ ] Login to dashboard
- [ ] Click user profile in sidebar
- [ ] Click "Sign Out" button
  - Expected: User is logged out
  - Expected: Redirected to login page
  - Expected: Session token removed from localStorage

---

## 3. Password Reset Flow

### Request Password Reset
- [ ] Navigate to `/login` page
- [ ] Click "Forgot password?" link
- [ ] Verify Reset Password form appears
- [ ] Enter registered email address
- [ ] Click "Send Reset Link" button
- [ ] Verify success toast: "Check your email - Password reset link sent."
- [ ] Verify form clears or redirects to login

### Invalid Email Handling
- [ ] Click "Forgot password?"
- [ ] Leave email empty and click "Send Reset Link"
  - Expected: Error: "Enter your email"
- [ ] Enter non-existent email
  - Expected: Still shows success message (security best practice - don't reveal if email exists)

### Reset Password via Email Link
- [ ] Request password reset for your test account
- [ ] Check email inbox for reset link
- [ ] Click reset link in email
  - Expected: Redirected to `/reset-password` page
  - Expected: Page shows "Set New Password" form
- [ ] Enter new strong password (8+ chars, uppercase, number, special char)
- [ ] Click "Update Password" button
- [ ] Verify success toast: "Password updated - You can now sign in with your new password."
- [ ] Verify redirected to `/login` page
- [ ] Login with new password
  - Expected: Login succeeds with new password

### Old Password No Longer Works
- [ ] After password reset, attempt to login with old password
  - Expected: Login fails with "Invalid password" error

### Reset Link Expiration
- [ ] Request password reset
- [ ] Copy the reset link but wait 24+ hours before clicking
  - Expected: Link expires and shows error message

---

## 4. Google OAuth / Social Login

### Google Sign-In Button Functionality
- [ ] Navigate to `/login` page
- [ ] Verify "Sign in with Google" button is visible
- [ ] Click "Sign in with Google" button
  - Expected: Google login popup/redirect appears
- [ ] Verify button is also available on signup form
  - Expected: "Sign up with Google" button visible

### Google Login Flow (First Time)
- [ ] Click "Sign in with Google"
- [ ] Select/authenticate with a valid Google account
- [ ] Verify consent screen asks for required permissions
  - Expected: Email, profile permissions requested
- [ ] Grant permissions
  - Expected: Redirected back to app and logged in
  - Expected: User profile created with name from Google account
  - Expected: Sidebar shows user name and "VIEWER" role

### Google Login (Existing User)
- [ ] Logout from BuildForge
- [ ] Click "Sign in with Google"
- [ ] Select same Google account
  - Expected: Instant login without consent screen (cached)

### Google Signup vs Login
- [ ] First-time Google account user
  - Expected: Account auto-created and logged in
- [ ] Existing Google account user
  - Expected: Standard login without duplicate creation

### Apple Sign-In (if configured)
- [ ] Verify "Sign in with Apple" button is visible (if enabled)
- [ ] Click button
  - Expected: Apple authentication flow initiated
- [ ] Complete authentication
  - Expected: Logged in and redirected to dashboard

### OAuth Error Handling
- [ ] Start Google login and deny permissions
  - Expected: Error toast: "Google sign-in failed - Permissions required"
- [ ] Close Google popup mid-authentication
  - Expected: User returned to login page, no error shown

---

## 5. Multi-User / Project Membership

### New User Default Role
- [ ] Create new user via signup
- [ ] Navigate to Projects page
- [ ] Verify user sees "No projects yet" message
  - Expected: User role defaults to "VIEWER"
  - Expected: User cannot create projects initially

### User Role Visibility in Sidebar
- [ ] Login as admin user
- [ ] Verify "ADMIN" badge shown in sidebar
- [ ] Logout and login as viewer user
- [ ] Verify "VIEWER" badge shown in sidebar
- [ ] Verify sidebar modules visible match user's role permissions

### Project Member Approval Workflow
- [ ] As Admin: Create a project
- [ ] Share project connection code with another user
- [ ] As New User: Navigate to Projects > "Join Project"
- [ ] Enter connection code
  - Expected: Request shows as "Pending" status
- [ ] As Admin: Go to Project Settings > Members
- [ ] Verify pending member request appears
- [ ] Click "Approve" button
  - Expected: Member status changes to "Approved"
  - Expected: Member can now access project

### Project Role Assignment
- [ ] As Admin: Add member to project with role "co_admin"
  - Expected: Member can approve data changes
- [ ] As Admin: Add member with role "member"
  - Expected: Member can view/edit data but cannot approve

### Member Deletion
- [ ] As Admin: Go to Project Settings > Members
- [ ] Click trash icon next to a member
  - Expected: Member removed from project
  - Expected: Member loses access to project data

### Clear All Users (Admin Only)
- [ ] As Admin: Go to Project Settings > Members
- [ ] Click "Clear All Users" button
  - Expected: Confirmation dialog appears
  - Expected: All members except current admin removed
  - Expected: Success message shown

---

## 6. Role-Based Access Control (RBAC)

### Admin Role
- [ ] Login as ADMIN user
- [ ] Verify access to all sidebar modules:
  - [ ] Dashboard
  - [ ] Projects
  - [ ] Activities
  - [ ] BOQ Items
  - [ ] Change Orders
  - [ ] Daily Quantity
  - [ ] Manpower
  - [ ] Equipment
  - [ ] Fuel Log
  - [ ] Concrete Pour
  - [ ] Welding
  - [ ] Photos
  - [ ] Documents
- [ ] Verify ability to manage users:
  - [ ] Create project
  - [ ] Approve/Reject members
  - [ ] Delete users
  - [ ] Assign roles

### Project Manager Role
- [ ] Login as PROJECT_MANAGER user
- [ ] Verify access to planning modules:
  - [ ] Activities (CPM)
  - [ ] Change Orders
- [ ] Verify restricted access to:
  - [ ] User Management (should not see)
  - [ ] Accounting modules (should not see)

### Engineer Role
- [ ] Login as ENGINEER user
- [ ] Verify access to:
  - [ ] Activities
  - [ ] BOQ Items
  - [ ] Daily Quantity
  - [ ] Manpower
- [ ] Verify cannot access:
  - [ ] User Management
  - [ ] Financial modules

### Accountant Role
- [ ] Login as ACCOUNTANT user
- [ ] Verify access to financial data
- [ ] Verify cannot access:
  - [ ] Daily logs
  - [ ] Equipment tracking

### Safety Officer Role
- [ ] Login as SAFETY_OFFICER user
- [ ] Verify can only access safety modules
- [ ] Verify read-only access to other data

### Store Keeper Role
- [ ] Login as STORE_KEEPER user
- [ ] Verify access to inventory modules
- [ ] Verify cannot access planning modules

### Surveyor Role
- [ ] Login as SURVEYOR user
- [ ] Verify access to measurement modules
- [ ] Verify cannot access financial modules

### Viewer Role
- [ ] Login as VIEWER user
- [ ] Verify read-only access to all permitted data
- [ ] Verify cannot edit or delete data
- [ ] Verify cannot manage users

---

## 7. Data Access Control (RLS Verification)

### Project Isolation
- [ ] Create User A and User B
- [ ] Create Project 1 with User A as member
- [ ] Create Project 2 with User B as member
- [ ] Login as User A
  - Expected: Can only see Project 1 data
  - Expected: Cannot see Project 2 data
- [ ] Login as User B
  - Expected: Can only see Project 2 data
  - Expected: Cannot see Project 1 data

### Shared Project Access
- [ ] Add both User A and User B to Project 1
- [ ] Login as User A
  - Expected: Can see User B's data in Project 1
- [ ] Login as User B
  - Expected: Can see User A's data in Project 1

### Non-Member Isolation
- [ ] Create User C without project membership
- [ ] User C attempts to access Project 1 data via URL
  - Expected: Access denied / no data shown

---

## 8. Password Security Features

### HIBP Check (Leaked Password Prevention)
- [ ] Attempt signup with "123456" or other common password
  - Expected: Signup fails with HIBP error
- [ ] Attempt signup with unique strong password
  - Expected: Signup succeeds

### Password Change
- [ ] Login as user
- [ ] Change password from settings (if available)
- [ ] New password must meet requirements
  - Expected: 8+ characters, uppercase, number, special char
- [ ] Verify old password no longer works for login
  - Expected: Login fails with old password

### Session Security
- [ ] Login and verify JWT token in localStorage
- [ ] Check token expiration in JWT payload
- [ ] Wait for token near expiration
- [ ] Perform action that requires auth
  - Expected: Token auto-refreshes (if auto-refresh enabled)
  - Expected: User stays logged in

---

## 9. Edge Cases & Error Handling

### Concurrent Login Attempts
- [ ] Open two browser tabs
- [ ] Login in tab 1
- [ ] Attempt login in tab 2 with same credentials
  - Expected: Both sessions remain valid OR one session invalidated

### Multiple Device Login
- [ ] Login on desktop device
- [ ] Login on mobile device with same account
  - Expected: Both sessions active simultaneously (if multi-device allowed)

### Network Errors
- [ ] Disable network (Dev Tools > Offline)
- [ ] Attempt to login
  - Expected: Error message: "Network error - Check your connection"
- [ ] Attempt to signup
  - Expected: Error message shown

### Session Timeout
- [ ] Login successfully
- [ ] Wait for session timeout (typically 30+ days)
- [ ] Attempt to perform action
  - Expected: Redirected to login page
  - Expected: Message: "Session expired - Please log in again"

### CORS Issues
- [ ] Verify API requests from app domain succeed
- [ ] Check browser console for CORS errors
  - Expected: No CORS errors (properly configured)

---

## 10. Mobile Responsive Testing

### Login/Signup on Mobile
- [ ] Open app on mobile device (portrait)
- [ ] Verify login form is readable and usable
- [ ] Verify buttons are tap-friendly (min 44x44 px)
- [ ] Test on tablet (landscape)
  - Expected: Layout adapts properly

### Mobile Sign In with Google
- [ ] On mobile, click "Sign in with Google"
- [ ] Verify Google auth popup/redirect works
  - Expected: Native Google auth flow on mobile

### Mobile Password Reset
- [ ] On mobile, test forgot password flow
- [ ] Verify email links work on mobile
  - Expected: Reset page opens correctly

---

## 11. Browser Compatibility Testing

### Chrome/Chromium
- [ ] Test all signup/login flows
- [ ] Test OAuth flows
- [ ] Test password reset
- [ ] Verify localStorage works
  - Expected: All flows functional

### Firefox
- [ ] Repeat all flows from Chrome
  - Expected: All flows functional

### Safari (macOS/iOS)
- [ ] Test all flows
- [ ] Verify localStorage works
  - Expected: All flows functional

### Edge
- [ ] Test all flows
  - Expected: All flows functional

---

## 12. Security Testing (Manual)

### SQL Injection Attempt
- [ ] In email field, enter: `' OR '1'='1`
  - Expected: Treated as literal email, rejected as invalid

### XSS Attack Attempt
- [ ] In full name field, enter: `<script>alert('xss')</script>`
  - Expected: Stored safely, rendered as plain text
  - Expected: No alert shown when viewing profile

### CSRF Token Validation
- [ ] Check network requests for CSRF tokens
- [ ] Verify tokens change between requests
  - Expected: CSRF protection implemented

### Brute Force Protection
- [ ] Attempt to login with wrong password 10+ times
  - Expected: Account locks or rate-limit enforced
  - Expected: Cannot continue attempts immediately

---

## 13. Regression Test Summary

### Quick Smoke Test (Daily)
1. [ ] Signup with new email
2. [ ] Login with test account
3. [ ] Logout and login again
4. [ ] Reset password flow
5. [ ] Google OAuth signup
6. [ ] Verify user role in sidebar

### Full Regression (Weekly)
1. [ ] Run all tests in sections 1-7
2. [ ] Test all role types
3. [ ] Verify project access control
4. [ ] Test mobile responsiveness
5. [ ] Test browser compatibility

### Security Audit (Monthly)
1. [ ] Review HIBP check functionality
2. [ ] Verify RLS policies enforced
3. [ ] Test SQL injection prevention
4. [ ] Test XSS prevention
5. [ ] Review session security

---

## Test Credentials

### Admin Account
- Email: `admin@example.com`
- Password: `AdminPassword123!`

### Project Manager Account
- Email: `pm@example.com`
- Password: `PMPassword123!`

### Viewer Account
- Email: `viewer@example.com`
- Password: `ViewerPassword123!`

### Test Google Account
- Email: `test.buildforge@gmail.com`
- (Request access from project team)

---

## Known Issues / Deferred Tests

- [ ] (Add any known issues or pending test items here)

---

## Test Results Log

| Date | Tester | Status | Notes |
|------|--------|--------|-------|
| 2026-03-09 | AI Testing | ✅ PASS | Initial auth flows verified, HIBP enabled |
| | | | |
| | | | |

---

**Last Updated:** 2026-03-09
**Version:** 1.0
