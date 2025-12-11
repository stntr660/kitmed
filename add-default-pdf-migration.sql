-- Add default_pdf_url column to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS default_pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN partners.default_pdf_url IS 'Default PDF brochure URL for manufacturer products to fallback to when product has no PDF';