/**
 * StyleClothes Security Specification
 */

// 1. Data Invariants
// - Users must be authenticated to create orders.
// - Orders must have a valid userId matching the requester.
// - Products can only be modified by admins.
// - Inventory levels cannot be negative.
// - Payment status can only be transitioned from 'unpaid' to 'pending_verification' by users, and to 'paid' by admins.

// 2. The Dirty Dozen Payloads (Failures to block)
// - Create product as non-admin
// - Update stock count to negative
// - Update another user's order
// - Change order status to 'delivered' as a normal user
// - Set paymentStatus to 'paid' as a normal user
// - Read all user profiles as a normal user
// - Delete products as non-admin
// - Inject malicious characters in IDs
// - Exceed 1MB document limit
// - Spoof ownerId
// - Update immutable fields like createdAt
// - Anonymous writes to products collection
