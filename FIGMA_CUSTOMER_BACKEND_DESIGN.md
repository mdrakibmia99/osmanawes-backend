# Backend Design Document: App Design - Customer

> **Figma Source Metadata**
> - **File Key**: `bs3oUW2eAP4EYMftGOzQBK`
> - **Node ID**: `40003001:15707`
> - **Canvas / Page**: `App Design - Customer`
> - **Primary Focused Screens**:
>   - `Home` (`40006026:2727`)
>   - `Detail` (`40006050:3670`)
>   - `You're in queue` (`40006067:3999`)
>   - `Passes- Active` (`40006105:1971`)
>   - `Buy Pass` (`40006136:937`)
>   - `Reservation` (`40006133:586`)
>   - `Menu` (`40006171:2105`)
>   - `Points` (`40006110:2652`)

---

## 1. Executive Summary

This document specifies the backend architectural design, MongoDB data models, TypeScript interfaces, REST APIs, real-time WebSocket events, and Redis caching strategies for the **Customer** role (`USER_ROLE.USER`). 

While the admin/business portal manages venue settings and queue operations, the Customer application enables end-users to:
1. Discover venues and inspect real-time line metrics (wait times, capacity, reviews).
2. Enter and monitor virtual queues in real-time.
3. Purchase and display time-expiring Q-Skip passes with rotating 30-second verification codes.
4. Reserve tables by date, time slot, and party size.
5. Earn and redeem loyalty points.
6. Browse venue menus and food categories.

---

## 2. Role-Based Access Control (RBAC)

- **Customer Role Identifier**: `USER_ROLE.USER` (`'user'`) in `src/app/modules/user/user.constants.ts`.
- **Administrative Role**: `USER_ROLE.ADMIN` (`'admin'`) and `USER_ROLE.SUPER_ADMIN` (`'super_admin'`).
- **Endpoint Protection Strategy**:
  - **Public (No Auth)**: Venue discovery, venue detail page, and public menu browsing.
  - **Customer Auth (`auth(USER_ROLE.USER)`)**: Joining queues, purchasing passes, viewing personal passes, booking reservations, and loyalty rewards.
  - **Staff / Admin Auth (`auth(USER_ROLE.ADMIN, USER_ROLE.SUPER_ADMIN)`)**: Pass validation (scanning/inputting code) and advancing queue positions.

---

## 3. Screen Inspection & Extracted UI Components

### 3.1. Venue Discovery & Details
- **Home Screen (`40006026:2727`)**:
  - Search input with placeholder `"Search"`.
  - Category selector filter pills: `"All"`, `"Restaurant"`, `"Cafe"`, `"Events"`.
  - Venue cards with wait time badges: `"Burger House" | 6 min`, `"Sky Lounge" | 15 min`.
- **Venue Detail Screen (`40006050:3670`)**:
  - Live Queue Metrics Badges: `WAIT TIME: 10 min`, `QUEUE SIZE: 18 People`, `Occupancy: 65%`.
  - Rating badge: `4.8 ★ (521 reviews)`, Distance: `0.4 mi`.
  - Action buttons: `Reserve`, `Q Skip Pass`, `Contact`, `Menu`.
  - Venue metadata: About description, address, map directions, and weekly opening hours table.

### 3.2. Live Queueing (`You're in queue`, `40006067:3999`)
- **Position Indicator**: Large badge displaying `YOUR POSITION: #7`.
- **Ahead Count**: `AHEAD OF YOU: 6`.
- **ETA**: `Estimated entrance in 10-15 mins`.
- **Instructional Alert**: `"We'll notify you when it's almost your turn. Keep this app open."`
- **Actions**:
  - Secondary button: `Message Business` (opens chat).
  - Destructive action: `Leave Queue`.

### 3.3. Q-Skip Passes (`Buy Pass` `40006136:937` & `Passes- Active` `40006105:1971`)
- **Purchase Screen**:
  - Price: `£2.99` per pass.
  - Benefits list: `"Skip The wait" (Saves 10-15 min)`, `"10% off total bill" (Applied at checkout)`.
  - Terms: `One-time use`, `Valid today`, `Non-refundable`.
  - Action button: `Buy Q Skip Pass`.
- **My Passes Screen**:
  - Status tabs: `Active` (selected), `Used`, `Expired`.
  - Pass Card: Venue name, validity timestamp (`Valid until: Today, 6:00 PM`).
  - Dynamic Rotating Code: 4-digit code (`8817`).
  - Countdown Timer: `00:25` (`"Code refreshes every 30s"`).
  - Action: `Refresh Code`.

### 3.4. Table Reservation (`Reservation`, `40006133:586`)
- **Date Selector**: Horizontal pill picker (`Today`, `Tomorrow`, `Wed 14`, `Thu 15`).
- **Time Slots Grid**: Selectable buttons (`12:00 PM`, `12:30 PM`, `01:00 PM`, `01:30 PM`, `2:00 PM`).
- **Party Size Stepper**: Guest count selector (`Guests: 1+`).
- **Special Requests**: Textarea with placeholder `"Any special requests (optional)"`.
- **Action**: Primary button `"Confirm Reservation"`.

### 3.5. Loyalty Points & Rewards (`Points`, `40006110:2652`)
- **Balance Card**: `"Q Skip Points Card"` displaying current points (`1250 pts`) and progress to next tier (`2000 pts`).
- **Earning Rules**:
  - `Join a queue`: `+10 pts`
  - `Visit a venue`: Points earned on completed visit
  - `Use a Q Skip pass`: Points earned on pass redemption
- **Rewards Store**:
  - Reward Card: `£5 Discount` (`2,000 pts to redeem`).
  - Action: Redeem voucher.

---

## 4. TypeScript Interfaces & Data Models

```typescript
import { Model, Types } from 'mongoose';

// ==========================================
// 1. Queue Domain
// ==========================================
export const QUEUE_STATUS = {
  WAITING: 'waiting',
  CALLED: 'called',
  ADMITTED: 'admitted',
  LEFT: 'left',
  CANCELLED: 'cancelled',
} as const;

export type TQueueStatus = (typeof QUEUE_STATUS)[keyof typeof QUEUE_STATUS];

export interface IQueueEntry {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  venueId: Types.ObjectId | string;
  position: number;                   // e.g. 7
  partySize: number;                  // Number of people
  status: TQueueStatus;
  estimatedWaitMinutes: number;       // e.g. 10
  joinedAt: Date;
  calledAt?: Date;
  admittedAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type QueueEntryModel = Model<IQueueEntry>;

// ==========================================
// 2. Q-Skip Pass Domain
// ==========================================
export const PASS_STATUS = {
  ACTIVE: 'active',
  USED: 'used',
  EXPIRED: 'expired',
} as const;

export type TPassStatus = (typeof PASS_STATUS)[keyof typeof PASS_STATUS];

export interface IQSkipPass {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  venueId: Types.ObjectId | string;
  venueName?: string;
  passCode: string;                   // 4-digit code e.g. "8817"
  codeExpiresAt: Date;                // Refreshes every 30s
  price: number;                      // 2.99
  currency: string;                   // 'GBP'
  status: TPassStatus;                // 'active' | 'used' | 'expired'
  validUntil: Date;                   // Today 6:00 PM
  paymentIntentId?: string;           // Stripe reference
  usedAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type QSkipPassModel = Model<IQSkipPass>;

// ==========================================
// 3. Reservation Domain
// ==========================================
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type TReservationStatus =
  (typeof RESERVATION_STATUS)[keyof typeof RESERVATION_STATUS];

export interface IReservation {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  venueId: Types.ObjectId | string;
  reservationDate: string;            // 'YYYY-MM-DD' e.g. "2026-10-15"
  timeSlot: string;                   // '12:00 PM'
  partySize: number;                  // 1 to 20
  specialRequests?: string;
  status: TReservationStatus;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ReservationModel = Model<IReservation>;

// ==========================================
// 4. Loyalty Points & Rewards Domain
// ==========================================
export interface IPointsWallet {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  currentPoints: number;              // e.g. 1250
  totalEarnedPoints: number;
  tier: string;                       // 'Bronze' | 'Silver' | 'Gold'
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPointsTransaction {
  _id?: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  points: number;                     // Positive (earn) or negative (redeem)
  type: 'earn' | 'redeem';
  description: string;                // e.g. "Join a queue (+10 pts)"
  referenceId?: string;
  createdAt?: Date;
}
```

---

## 5. Mongoose Schemas & Indexing

### 5.1. Queue Schema
```typescript
import { Schema, model } from 'mongoose';
import { IQueueEntry, QueueEntryModel, QUEUE_STATUS } from './queue.interface';

const queueEntrySchema = new Schema<IQueueEntry, QueueEntryModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    position: { type: Number, required: true },
    partySize: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(QUEUE_STATUS),
      default: QUEUE_STATUS.WAITING,
      index: true,
    },
    estimatedWaitMinutes: { type: Number, default: 10 },
    joinedAt: { type: Date, default: Date.now },
    calledAt: { type: Date },
    admittedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// High-performance compound indexes
queueEntrySchema.index({ venueId: 1, status: 1, position: 1 });
queueEntrySchema.index({ userId: 1, status: 1 });

export const QueueEntry = model<IQueueEntry, QueueEntryModel>('QueueEntry', queueEntrySchema);
```

### 5.2. Q-Skip Pass Schema
```typescript
import { Schema, model } from 'mongoose';
import { IQSkipPass, QSkipPassModel, PASS_STATUS } from './pass.interface';

const qSkipPassSchema = new Schema<IQSkipPass, QSkipPassModel>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    venueName: { type: String, default: '' },
    passCode: { type: String, required: true },
    codeExpiresAt: { type: Date, required: true },
    price: { type: Number, default: 2.99 },
    currency: { type: String, default: 'GBP' },
    status: {
      type: String,
      enum: Object.values(PASS_STATUS),
      default: PASS_STATUS.ACTIVE,
      index: true,
    },
    validUntil: { type: Date, required: true },
    paymentIntentId: { type: String },
    usedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

qSkipPassSchema.index({ userId: 1, status: 1, validUntil: -1 });
qSkipPassSchema.index({ passCode: 1, venueId: 1, status: 1 });

export const QSkipPass = model<IQSkipPass, QSkipPassModel>('QSkipPass', qSkipPassSchema);
```

---

## 6. REST API Endpoint Specifications

### 6.1. Queue Endpoints (`/api/v1/queue`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/join` | `USER` | Join the venue's virtual queue |
| `POST` | `/leave` | `USER` | Cancel waiting and leave the queue |
| `GET` | `/my-status` | `USER` | Get current position, people ahead, and ETA |
| `GET` | `/venue/:venueId/stats`| `Public` | Get public queue size, wait time, occupancy |
| `PATCH`| `/advance/:venueId` | `ADMIN` | Venue staff calls next customer |

### 6.2. Q-Skip Pass Endpoints (`/api/v1/passes`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/buy` | `USER` | Purchase a Q-Skip pass for £2.99 via Stripe |
| `GET` | `/my-passes` | `USER` | List passes with filter (`status=active\|used\|expired`) |
| `GET` | `/:id/refresh-code`| `USER` | Generate fresh 30-second verification code |
| `POST` | `/verify` | `ADMIN` | Staff verifies and redeems 4-digit pass code |

### 6.3. Table Reservation Endpoints (`/api/v1/reservations`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/book` | `USER` | Book a table for a date, time slot, and guest count |
| `GET` | `/my` | `USER` | View upcoming and past reservations |
| `PATCH`| `/:id/cancel` | `USER` | Cancel an upcoming reservation |
| `GET` | `/slots/:venueId` | `Public` | Check available reservation time slots |

### 6.4. Loyalty Points Endpoints (`/api/v1/points`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/my-wallet` | `USER` | Get points balance, tier, and history |
| `POST` | `/redeem` | `USER` | Redeem 2000 points for a £5 discount voucher |

---

## 7. Real-Time WebSocket & Redis Integration

### 7.1. Dynamic 30-Second Pass Code (Redis Architecture)
When the user views an active pass:
1. Backend generates a cryptographic 4-digit code (e.g. `8817`).
2. Stored in Redis with 30-second TTL:
   ```typescript
   await RedisService.set(`pass:code:${passId}`, code, 30);
   await RedisService.set(`pass:lookup:${code}:${venueId}`, passId, 30);
   ```
3. When staff scans or enters the code, Redis instantly verifies the code and marks the pass `used`.

### 7.2. Real-Time Queue Updates via Socket.IO
When queue state changes (e.g. customer enters or staff advances):
- **Room**: `queue:venue:<venueId>` and `queue:user:<userId>`.
- **Emitted Events**:
  - `queue:position_updated`: Sends updated position and ETA directly to waiting customers.
  - `queue:called`: Triggers push notification and UI alert: *"It's your turn! Please proceed to the host."*
