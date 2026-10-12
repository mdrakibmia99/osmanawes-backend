# Backend Design Document: App Design - Business

> **Figma Source Metadata**
> - **File Key**: `bs3oUW2eAP4EYMftGOzQBK`
> - **Node ID**: `40006002:4414`
> - **Canvas / Page**: `App Design - Business`
> - **Focused Screens**: 
>   - `Menu` (Node ID: `40006242:5420`)
>   - `Menu- Modal` (Node ID: `40006250:9183`)

---

## 1. Executive Summary

This document specifies the backend architectural design, MongoDB schemas, TypeScript interfaces, and REST API contracts extracted from the Figma business management dashboard. The primary focus of this design is the **Menu & Item Management** system (with its associated Category relationship), as well as supporting domains visible across the canvas (Queue Control, Team Members, Analytics, and Reviews).

---

## 2. Visible UI Components Breakdown

### 2.1. Page Header & Navigation Controls
- **Page Title**: `"Menu"`
- **Primary Action Button**: `"Add new menu"` — Triggers the "Add Menu Item" modal.
- **Secondary Action Button**: `"Secondary"` — Optional filter / auxiliary action.

### 2.2. Menu Items Data Table
| UI Column | Data Type | Visible Example | Backend Property | Constraints & Notes |
| :--- | :--- | :--- | :--- | :--- |
| **ID** | Text / Code | `0001` | `itemCode` | Sequential or formatted business identifier |
| **Image** | Image Thumbnail | Image preview | `image` | S3 / CDN URL (`string`) |
| **Item Name** | Text | `Smash Burger` | `name` | Required, trimmed, indexed |
| **Category** | Text / Tag | `Burgers` | `category` | Ref to `Category` ObjectId or category name |
| **Price** | Currency | `£9.49` | `price`, `currency` | Numeric float (`9.49`), currency symbol (`GBP` / `£`) |
| **Status** | Status Badge | `Active` / `Inactive` | `status` | Enum: `'active' \| 'inactive'` |
| **Action** | Action Icons | Edit, Delete icons | — | Triggers Edit/Delete API calls |

### 2.3. "Add Menu Item" Modal Dialog
- **Modal Title**: `"Add Menu Item"`
- **Helper Subtext**: `"This is a hint text to help user."`

#### Form Fields:
1. **Item Name**:
   - Label: `"Item Name"`
   - Placeholder: `"Enter category title"` (or item title)
   - Input Type: Text input (`string`), required
2. **Category Selection**:
   - Label: `"Category "`
   - Placeholder: `"Enter category"`
   - Input Type: Dropdown / text input (relates to `Category` entity), required
3. **Price**:
   - Label: `"Price"`
   - Placeholder: `"Enter menu price"`
   - Input Type: Number / Decimal input (`number`), required
4. **Image Upload Area**:
   - Label: `"Image"`
   - Action Button: `"Click to upload"`
   - Allowed Types Hint: `"PNG or JPEG"`
   - Upload Method: `multipart/form-data` processed by multer/S3 helper
5. **AI Auto-Fill Feature**:
   - Action Button: `"Fill with AI"`
   - Backend Endpoint: AI-assisted item generation/enhancement
6. **Modal Actions**:
   - Primary Button: `"Add Item"` (Form submission)
   - Ghost Button: `"Cancel"` (Closes dialog without saving)

---

## 3. TypeScript Interfaces

```typescript
import { Model, Types } from 'mongoose';

// ==========================================
// Enums & Types
// ==========================================
export const MENU_ITEM_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type TMenuItemStatus =
  (typeof MENU_ITEM_STATUS)[keyof typeof MENU_ITEM_STATUS];

export const MENU_ITEM_STATUS_ENUM = Object.values(MENU_ITEM_STATUS);

// ==========================================
// Core Menu Item Model Interface
// ==========================================
export interface IMenuItem {
  _id?: Types.ObjectId | string;
  itemCode?: string;                  // e.g. "0001"
  name: string;                       // e.g. "Smash Burger"
  category: Types.ObjectId | string;  // Reference to Category model
  categoryName?: string;              // Cached / populated category name
  price: number;                      // e.g. 9.49
  currency: string;                   // Default: 'GBP' ('£')
  image: string;                      // CDN / static file URL
  status: TMenuItemStatus;            // 'active' | 'inactive'
  isDeleted?: boolean;                // Soft delete flag
  createdAt?: Date;
  updatedAt?: Date;
}

export type MenuItemModel = Model<IMenuItem, Record<string, unknown>>;

// ==========================================
// DTOs (Data Transfer Objects)
// ==========================================

export interface ICreateMenuItemDTO {
  name: string;
  category: string;
  price: number;
  currency?: string;
  image?: string;
  status?: TMenuItemStatus;
}

export interface IUpdateMenuItemDTO {
  name?: string;
  category?: string;
  price?: number;
  currency?: string;
  image?: string;
  status?: TMenuItemStatus;
}

export interface IMenuItemFilterQuery {
  searchTerm?: string;
  category?: string;
  status?: TMenuItemStatus;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sort?: string;
}

// ==========================================
// AI Auto-Fill DTO
// ==========================================
export interface IAIFillMenuItemRequest {
  prompt?: string;
  categoryName?: string;
}

export interface IAIFillMenuItemResponse {
  name: string;
  category: string;
  suggestedPrice: number;
  description?: string;
}
```

---

## 4. Mongoose Database Schema Design

```typescript
import { Schema, model } from 'mongoose';
import { IMenuItem, MenuItemModel, MENU_ITEM_STATUS, MENU_ITEM_STATUS_ENUM } from './menu.interface';

const menuItemSchema = new Schema<IMenuItem, MenuItemModel>(
  {
    itemCode: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      index: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'GBP',
    },
    image: {
      type: String,
      required: [true, 'Item image is required'],
      default: '',
    },
    status: {
      type: String,
      enum: MENU_ITEM_STATUS_ENUM,
      default: MENU_ITEM_STATUS.ACTIVE,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
menuItemSchema.index({ name: 'text', categoryName: 'text' });
menuItemSchema.index({ status: 1, isDeleted: 1 });
menuItemSchema.index({ price: 1 });

// Soft-delete query middleware
menuItemSchema.pre(/^find/, function (next) {
  const query = this as any;
  if (!query.getOptions()?.ignoreDeleted) {
    query.find({ isDeleted: { $ne: true } });
  }
  next();
});

export const MenuItem = model<IMenuItem, MenuItemModel>('MenuItem', menuItemSchema);
```

---

## 5. REST API Specifications

### Base Path: `/api/v1/menu`

| Method | Endpoint | Access Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/create` | `ADMIN`, `SUPER_ADMIN` | Create a new menu item (with image upload) |
| **GET** | `/` | `Public` / `USER` | Get all menu items with search, filter & pagination |
| **GET** | `/:id` | `Public` / `USER` | Get a single menu item by ID |
| **PATCH** | `/update/:id` | `ADMIN`, `SUPER_ADMIN` | Update an existing menu item |
| **DELETE** | `/delete/:id` | `ADMIN`, `SUPER_ADMIN` | Soft delete a menu item (`isDeleted: true`) |
| **POST** | `/fill-with-ai`| `ADMIN`, `SUPER_ADMIN` | Generate menu item suggestions using Gemini AI |

---

## 6. Redis Caching & Invalidation Architecture

Following the project's Redis caching standards:

### 6.1. Cache Key Patterns
- **Single Menu Item**: `menu:<id>`
- **Menu Items List**: `menu:list:<queryHash>`
- **Pattern for Lists**: `menu:list:*`
- **Pattern for All Menu Items**: `menu:*`

### 6.2. Invalidation Workflow
Whenever an administrator performs **Create**, **Update**, or **Delete**:
```typescript
const clearMenuCache = async () => {
  await Promise.all([
    cacheService.delByPattern('menu:*'),
    cacheService.delByPattern('menu:list:*'),
  ]);
};
```

---

## 7. Additional Domain Modules on the Canvas

For complete architectural reference, the canvas also features:
1. **Queue Control (`40006225:255`)**:
   - Real-time queue metrics (`queueSize`, `estimatedWaitTime`, `occupiedTables`/`totalTables`, `queueStatus`).
   - Actions: `Accept Reservation`, `Update Queue`, `Set Table Count`.
2. **Team Management (`40006291:3713` & `40007264:9350`)**:
   - Staff list and invitation modal (`memberName`, `email`, `role`: `Manager` | `Staff` | `Queue Updater`).
3. **Earnings & Analytics (`40006238:5301`)**:
   - Pass sales counter, total revenue in GBP, monthly revenue timeline chart.
4. **Reviews (`40006292:4322`)**:
   - Customer feedback list (`fullName`, `email`, `rating`, `detail` review text).
