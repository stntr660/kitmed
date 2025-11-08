# KITMED Database Schema Documentation

## Overview
This document describes the complete database schema for the KITMED medical equipment platform.

## Entities Summary
Total Models: 18

### Category
Fields: 14
**Type**: Core entity

**Fields:**
- `id` (String) **[Primary Key]**
- `name` (String)
- `slug` (String) **[Unique]**
- `description` (String) *[Optional]*
- `parentId` (String) *[Optional]*
- `sortOrder` (Int)
- `isActive` (Boolean)
- `metaTitle` (String) *[Optional]*
- ... and 6 more fields

---

### CategoryTranslation
Fields: 7
**Type**: Translation table for multi-language support

**Fields:**
- `id` (String) **[Primary Key]**
- `categoryId` (String)
- `languageCode` (String)
- `name` (String)
- `description` (String) *[Optional]*
- `metaTitle` (String) *[Optional]*
- `metaDescription` (String) *[Optional]*

---

### Product
Fields: 19
**Type**: Core entity

**Fields:**
- `id` (String) **[Primary Key]**
- `sku` (String) **[Unique]**
- `categoryId` (String)
- `name` (String)
- `slug` (String) **[Unique]**
- `shortDescription` (String) *[Optional]*
- `longDescription` (String) *[Optional]*
- `specifications` (Json) *[Optional]*
- ... and 11 more fields

---

### ProductTranslation
Fields: 9
**Type**: Translation table for multi-language support

**Fields:**
- `id` (String) **[Primary Key]**
- `productId` (String)
- `languageCode` (String)
- `name` (String)
- `shortDescription` (String) *[Optional]*
- `longDescription` (String) *[Optional]*
- `specifications` (Json) *[Optional]*
- `metaTitle` (String) *[Optional]*
- ... and 1 more fields

---

### ProductMedia
Fields: 9
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `productId` (String)
- `type` (String)
- `url` (String)
- `altText` (String) *[Optional]*
- `title` (String) *[Optional]*
- `sortOrder` (Int)
- `isPrimary` (Boolean)
- ... and 1 more fields

---

### ProductAttribute
Fields: 6
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `productId` (String)
- `name` (String)
- `value` (String)
- `type` (String)
- `sortOrder` (Int)

---

### RFPRequest
Fields: 19
**Type**: Core entity

**Fields:**
- `id` (String) **[Primary Key]**
- `referenceNumber` (String) **[Unique]**
- `status` (String)
- `customerName` (String)
- `customerEmail` (String)
- `customerPhone` (String) *[Optional]*
- `companyName` (String) *[Optional]*
- `companyAddress` (String) *[Optional]*
- ... and 11 more fields

---

### RFPItem
Fields: 7
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `rfpId` (String)
- `productId` (String)
- `quantity` (Int)
- `specialRequirements` (String) *[Optional]*
- `quotedPrice` (Decimal) *[Optional]*
- `createdAt` (DateTime)

---

### Partner
Fields: 12
**Type**: Core entity

**Fields:**
- `id` (String) **[Primary Key]**
- `name` (String)
- `slug` (String) **[Unique]**
- `description` (String) *[Optional]*
- `websiteUrl` (String) *[Optional]*
- `logoUrl` (String) *[Optional]*
- `isFeatured` (Boolean)
- `sortOrder` (Int)
- ... and 4 more fields

---

### PartnerTranslation
Fields: 5
**Type**: Translation table for multi-language support

**Fields:**
- `id` (String) **[Primary Key]**
- `partnerId` (String)
- `languageCode` (String)
- `name` (String)
- `description` (String) *[Optional]*

---

### Page
Fields: 12
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `slug` (String) **[Unique]**
- `title` (String)
- `content` (String) *[Optional]*
- `status` (String)
- `metaTitle` (String) *[Optional]*
- `metaDescription` (String) *[Optional]*
- `isHomepage` (Boolean)
- ... and 4 more fields

---

### PageTranslation
Fields: 7
**Type**: Translation table for multi-language support

**Fields:**
- `id` (String) **[Primary Key]**
- `pageId` (String)
- `languageCode` (String)
- `title` (String)
- `content` (String) *[Optional]*
- `metaTitle` (String) *[Optional]*
- `metaDescription` (String) *[Optional]*

---

### Banner
Fields: 14
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `title` (String)
- `subtitle` (String) *[Optional]*
- `imageUrl` (String) *[Optional]*
- `ctaText` (String) *[Optional]*
- `ctaUrl` (String) *[Optional]*
- `position` (String)
- `sortOrder` (Int)
- ... and 6 more fields

---

### BannerTranslation
Fields: 6
**Type**: Translation table for multi-language support

**Fields:**
- `id` (String) **[Primary Key]**
- `bannerId` (String)
- `languageCode` (String)
- `title` (String)
- `subtitle` (String) *[Optional]*
- `ctaText` (String) *[Optional]*

---

### User
Fields: 12
**Type**: Core entity

**Fields:**
- `id` (String) **[Primary Key]**
- `email` (String) **[Unique]**
- `passwordHash` (String)
- `firstName` (String)
- `lastName` (String)
- `role` (String)
- `isActive` (Boolean)
- `lastLogin` (DateTime) *[Optional]*
- ... and 4 more fields

---

### UserSession
Fields: 5
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `userId` (String)
- `token` (String) **[Unique]**
- `expiresAt` (DateTime)
- `createdAt` (DateTime)

---

### ActivityLog
Fields: 9
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `userId` (String) *[Optional]*
- `action` (String)
- `resourceType` (String)
- `resourceId` (String) *[Optional]*
- `details` (Json) *[Optional]*
- `ipAddress` (String) *[Optional]*
- `userAgent` (String) *[Optional]*
- ... and 1 more fields

---

### PageView
Fields: 7
**Type**: Support/Junction table

**Fields:**
- `id` (String) **[Primary Key]**
- `pagePath` (String)
- `referrer` (String) *[Optional]*
- `userAgent` (String) *[Optional]*
- `ipAddress` (String) *[Optional]*
- `sessionId` (String) *[Optional]*
- `createdAt` (DateTime)

---

