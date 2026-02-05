# Email Verification Button Plan

## Problem
Enterprise email security systems (Outlook, Proofpoint, etc.) automatically
click links in emails to scan for malware. This potentially includes the
verify/unsubscribe links in the emails sent by this app. This causes:
- Verification emails to be marked as verified before users see them
- Users receiving confirmation emails before verification emails
- Users getting unsubscribed when they didn't mean to and not knowing it
- Confusing user experience

## Solution
Add a button requirement to the verification/unsubscribe pages. Security
scanners load pages and execute JavaScript, but they **don't click buttons in
the UI**.

## Changes

### Files: `src/verify.tsx` and `src/unsubscribe.tsx`

**Current behavior:**
- Page loads → automatically calls `verify()` / `unsubscribe()` in `useEffect`
- Security scanners trigger verification/unsubscribe without user interaction

**New behavior:**
- Page loads → a message asks the user to click the button to
  verify/unsubscribe
- User clicks button → calls `verify()` / `unsubscribe()`
- Security scanners don't click the button → no auto-verification, no
  auto-unsubscribe

### Implementation

1. Remove automatic lambda invocations from `useEffect`
2. Add button with `onClick` handler
3. Disable button after user clicks, with appropriate styling put into `src/App.css`
4. After click, show verification status message

## Why This Works

✅ Security scanners load URLs and execute JS, but don't simulate button clicks
✅ Works on both desktop and mobile (no mouse-specific events) 
✅ Simple implementation - no external dependencies 
✅ Minimal UX impact - just one button click

## Code Changes

- Remove `useEffect` that auto-calls `verify()` / `unsubscribe()`
- Add `handleVerifyClick` / `handleUnsubscribeClick` function
- Add button with disabled state while waiting for lambda / after lambda returns
