-- Menambahkan kolom custom_glossary ke tabel teachers
ALTER TABLE public.teachers 
ADD COLUMN IF NOT EXISTS custom_glossary JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.teachers.custom_glossary IS 'Daftar istilah kustom milik guru (Array of {word, definition})';
