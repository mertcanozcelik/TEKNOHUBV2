
-- OTAĞ HUB - FULL DATABASE RESET & SCHEMA REVISION (REVİZYON 4)

-- 1. CLEANUP
DROP TABLE IF EXISTS public.saved_reports CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roadmaps CASCADE;
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. ROADMAPS TABLE
CREATE TABLE public.roadmaps (
    id TEXT PRIMARY KEY, 
    title TEXT NOT NULL,
    description TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "updatedAt" TEXT DEFAULT (now())::text,
    "iconName" TEXT DEFAULT 'Activity',
    "colorClass" TEXT DEFAULT 'from-blue-600 to-indigo-600',
    "availableOcgs" TEXT[] DEFAULT '{}',
    milestones JSONB DEFAULT '[]',
    "currentStage" TEXT DEFAULT 'Lansman'
);

-- 3. PROFILES TABLE
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'User', 
    status TEXT DEFAULT 'Pending', 
    "assignedOtags" TEXT[] DEFAULT '{}',
    "preferredOtag" TEXT,
    "preferredOcgs" TEXT[] DEFAULT '{}',
    "avatarUrl" TEXT,
    bio TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ISSUES TABLE
CREATE TABLE public.issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    domain TEXT REFERENCES public.roadmaps(id) ON DELETE CASCADE,
    ocg TEXT,
    vade TEXT DEFAULT 'Orta',
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Orta',
    "dueDate" TEXT,
    "suggestedBy" TEXT,
    approved BOOLEAN DEFAULT FALSE,
    evaluation JSONB DEFAULT '{}',
    resources JSONB DEFAULT '[]',
    comments JSONB DEFAULT '[]',
    history JSONB DEFAULT '[]',
    "createdAt" TEXT
);

-- 5. SAVED REPORTS TABLE
CREATE TABLE public.saved_reports (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "authorName" TEXT,
    query TEXT NOT NULL,
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    "otagTitle" TEXT,
    "isGlobal" BOOLEAN DEFAULT FALSE,
    "isApproved" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- --- YETKİ KONTROL FONKSİYONU ---
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $body$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text
    AND role = 'Admin'
  );
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --- SECURITY CONFIGURATION (RLS) ---

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Profiles: Herkes görebilir" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Kayıt sırasında ekleme" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Profiles: Kullanıcı kendini günceller" ON public.profiles FOR UPDATE USING (id = auth.uid()::text);
CREATE POLICY "Profiles: Admin yönetimi" ON public.profiles FOR INSERT, UPDATE, DELETE USING (public.is_admin());

-- 2. Roadmaps Policies
CREATE POLICY "Roadmaps: Herkes okur" ON public.roadmaps FOR SELECT USING (true);
CREATE POLICY "Roadmaps: Admin yönetir" ON public.roadmaps FOR ALL USING (public.is_admin());

-- 3. Issues Policies
CREATE POLICY "Issues: Herkes okur" ON public.issues FOR SELECT USING (true);
CREATE POLICY "Issues: Giriş yapan önerir" ON public.issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Issues: Admin yönetir" ON public.issues FOR ALL USING (public.is_admin());

-- 4. Saved Reports Policies
CREATE POLICY "Saved Reports: Onaylıları herkes okur" ON public.saved_reports FOR SELECT 
USING (("isGlobal" = TRUE AND "isApproved" = TRUE) OR "userId" = auth.uid()::text);
CREATE POLICY "Saved Reports: Kullanıcı kendi raporunu yönetir" ON public.saved_reports FOR ALL USING ("userId" = auth.uid()::text);
CREATE POLICY "Saved Reports: Admin yönetir" ON public.saved_reports FOR ALL USING (public.is_admin());

-- --- INITIAL DATA ---
INSERT INTO public.roadmaps (id, title, "startDate", "endDate", "availableOcgs", "iconName", "colorClass", "currentStage")
VALUES 
('Quantum', 'Kuantum Teknolojileri', '2024-01-01', '2026-12-31', '{"Kuantum Haberleşme", "Kuantum Algılama", "Kuantum Bilgisayar"}', 'Zap', 'from-purple-600 to-pink-600', 'OneriToplama'),
('AI', 'Yapay Zeka ve Büyük Veri', '2023-06-01', '2025-12-31', '{"Doğal Dil İşleme", "Görüntü İşleme", "Otonom Karar Sistemleri"}', 'Brain', 'from-blue-600 to-indigo-600', 'OneriToplama'),
('Cyber', 'Siber Güvenlik', '2024-01-01', '2025-01-01', '{"Kriptografi", "Ağ Güvenliği", "Veri Mahremiyeti"}', 'Shield', 'from-rose-600 to-pink-600', 'NihaiListe');
