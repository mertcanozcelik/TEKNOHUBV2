
-- OTAĞ HUB - TAM ERİŞİM VE YETKİ DÜZENLEMESİ (REVİZYON 6)
-- Katılımcı Bilgi Formu tablosu entegre edildi.

-- 1. TEMİZLİK
DROP TABLE IF EXISTS public.participant_forms CASCADE;
DROP TABLE IF EXISTS public.saved_reports CASCADE;
DROP TABLE IF EXISTS public.issues CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.roadmaps CASCADE;
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. TABLO YAPILARI
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

CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'User', 
    status TEXT DEFAULT 'Pending', 
    "assignedOtags" TEXT[] DEFAULT '{}',
    "preferredOtag" TEXT,
    "preferredOcgs" TEXT[] DEFAULT '{}',
    "avatarUrl" TEXT,
    bio TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- KATILIMCI BİLGİ FORMU TABLOSU
CREATE TABLE public.participant_forms (
    id TEXT PRIMARY KEY,
    "userId" TEXT REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    "roadmapId" TEXT REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "institution" TEXT,
    "expertiseAreas" TEXT,
    "academicAssets" TEXT,
    "capabilities" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("userId", "roadmapId") -- Her kullanıcı bir projeye bir kez form doldurabilir
);

-- 3. GÜVENLİK (RLS) AYARLARI
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_forms ENABLE ROW LEVEL SECURITY;

-- Genel Erişim Politikaları (Prototip Kolaylığı İçin)
CREATE POLICY "Profiles: Tam Erişim" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Roadmaps: Tam Erişim" ON public.roadmaps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Issues: Tam Erişim" ON public.issues FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Saved Reports: Tam Erişim" ON public.saved_reports FOR ALL USING (true) WITH CHECK (true);

-- Participant Forms Politikaları
CREATE POLICY "Participant Forms: Herkes okuyabilir" ON public.participant_forms FOR SELECT USING (true);
CREATE POLICY "Participant Forms: Kullanıcı ekleme ve güncelleme" ON public.participant_forms FOR ALL USING (true) WITH CHECK (true);

-- 4. BAŞLANGIÇ VERİLERİ
INSERT INTO public.roadmaps (id, title, "startDate", "endDate", "availableOcgs", "iconName", "colorClass", "currentStage")
VALUES 
('Quantum', 'Kuantum Teknolojileri', '2024-01-01', '2026-12-31', '{"Kuantum Haberleşme", "Kuantum Algılama", "Kuantum Bilgisayar"}', 'Zap', 'from-purple-600 to-pink-600', 'OneriToplama'),
('AI', 'Yapay Zeka ve Büyük Veri', '2023-06-01', '2025-12-31', '{"Doğal Dil İşleme", "Görüntü İşleme", "Otonom Karar Sistemleri"}', 'Brain', 'from-blue-600 to-indigo-600', 'OneriToplama'),
('Cyber', 'Siber Güvenlik', '2024-01-01', '2025-01-01', '{"Kriptografi", "Ağ Güvenliği", "Veri Mahremiyeti"}', 'Shield', 'from-rose-600 to-pink-600', 'NihaiListe');

-- 5. VARSAYILAN ADMİN HESABI
INSERT INTO public.profiles (id, name, email, role, status, "assignedOtags")
VALUES ('admin-root', 'Sistem Yöneticisi', 'admin@ssb.gov.tr', 'Admin', 'Approved', '{"Quantum", "AI", "Cyber"}')
ON CONFLICT (email) DO NOTHING;
