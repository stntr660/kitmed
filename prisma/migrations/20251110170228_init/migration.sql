-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "image_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "category_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    CONSTRAINT "category_translations_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference_fournisseur" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "constructeur" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "pdf_brochure_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "fiche_technique" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    CONSTRAINT "product_translations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt_text" TEXT,
    "title" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_attributes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "product_attributes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rfp_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reference_number" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_phone" TEXT,
    "company_name" TEXT,
    "company_address" TEXT,
    "contact_person" TEXT,
    "message" TEXT,
    "urgency_level" TEXT NOT NULL DEFAULT 'normal',
    "preferred_contact_method" TEXT NOT NULL DEFAULT 'email',
    "assigned_to" TEXT,
    "notes" TEXT,
    "quote_amount" REAL,
    "quote_valid_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rfp_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rfp_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "special_requirements" TEXT,
    "quoted_price" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rfp_items_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "rfp_requests" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rfp_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "partner_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "partner_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "partner_translations_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'published',
    "meta_title" TEXT,
    "meta_description" TEXT,
    "is_homepage" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "page_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    CONSTRAINT "page_translations_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT,
    "cta_text" TEXT,
    "cta_url" TEXT,
    "position" TEXT NOT NULL DEFAULT 'homepage',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" DATETIME,
    "end_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "banner_translations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banner_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "cta_text" TEXT,
    CONSTRAINT "banner_translations_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "banners" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'editor',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "page_path" TEXT NOT NULL,
    "referrer" TEXT,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "session_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "category_translations_category_id_language_code_key" ON "category_translations"("category_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_reference_fournisseur_key" ON "products"("reference_fournisseur");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_translations_product_id_language_code_key" ON "product_translations"("product_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "rfp_requests_reference_number_key" ON "rfp_requests"("reference_number");

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "partner_translations_partner_id_language_code_key" ON "partner_translations"("partner_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "page_translations_page_id_language_code_key" ON "page_translations"("page_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "banner_translations_banner_id_language_code_key" ON "banner_translations"("banner_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_key" ON "user_sessions"("token");
