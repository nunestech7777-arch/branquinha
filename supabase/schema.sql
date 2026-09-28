-- ====================================================================
-- DATE INVITATION - FULL SUPABASE SETUP
-- Paste this whole file into Supabase > SQL Editor and click Run.
-- Safe to run more than once: it creates what's missing and updates
-- what already exists.
--
-- Security model:
--   * Visitors (anon) can't touch the table directly; they save their
--     answer only through submit_date_response(), which validates it.
--   * Only accounts listed in admin_users can read or manage responses.
-- ====================================================================


-- 1. Responses table ---------------------------------------------------
CREATE TABLE IF NOT EXISTS public.date_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id TEXT NOT NULL DEFAULT 'date-invitation-main',
    selected_time TEXT NOT NULL,
    response TEXT NOT NULL DEFAULT 'accepted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT check_selected_time CHECK (selected_time IN ('19:00', '20:00')),
    CONSTRAINT check_response_accepted CHECK (response = 'accepted'),
    CONSTRAINT unique_invitation_response UNIQUE (invitation_id)
);

CREATE INDEX IF NOT EXISTS idx_date_responses_invitation_id ON public.date_responses(invitation_id);
CREATE INDEX IF NOT EXISTS idx_date_responses_created_at ON public.date_responses(created_at DESC);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_date_responses_updated_at ON public.date_responses;
CREATE TRIGGER set_date_responses_updated_at
    BEFORE UPDATE ON public.date_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.date_responses ENABLE ROW LEVEL SECURITY;


-- 2. Admins ------------------------------------------------------------
-- RLS on with no policies: the browser can't read or edit this list.
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- 3. Access rules on responses -----------------------------------------
-- Old policies from earlier versions of this file.
DROP POLICY IF EXISTS "Public anon can insert response" ON public.date_responses;
DROP POLICY IF EXISTS "Public anon can update response" ON public.date_responses;
DROP POLICY IF EXISTS "Authenticated users can select responses" ON public.date_responses;
DROP POLICY IF EXISTS "Authenticated users can manage responses" ON public.date_responses;
DROP POLICY IF EXISTS "Admins can manage responses" ON public.date_responses;

CREATE POLICY "Admins can manage responses"
    ON public.date_responses
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 4. How visitors save their answer ------------------------------------
CREATE OR REPLACE FUNCTION public.submit_date_response(
    p_invitation_id TEXT,
    p_selected_time TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_selected_time NOT IN ('19:00', '20:00') THEN
        RAISE EXCEPTION 'Invalid time: %', p_selected_time;
    END IF;

    INSERT INTO public.date_responses (invitation_id, selected_time, response)
    VALUES (p_invitation_id, p_selected_time, 'accepted')
    ON CONFLICT (invitation_id)
    DO UPDATE SET selected_time = EXCLUDED.selected_time;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_date_response(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_date_response(TEXT, TEXT) TO anon, authenticated;


-- 5. Realtime (live updates on the admin dashboard) --------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'date_responses'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.date_responses;
    END IF;
END;
$$;


-- 6. Admin account -----------------------------------------------------
-- The account must already exist in Authentication > Users.
-- Anyone else previously marked as admin loses admin rights.
INSERT INTO public.admin_users (user_id)
SELECT id FROM auth.users WHERE email = 'nunes@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

DELETE FROM public.admin_users
WHERE user_id NOT IN (SELECT id FROM auth.users WHERE email = 'nunes@gmail.com');

-- If login fails with "Email not confirmed", uncomment and run this line:
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email = 'nunes@gmail.com' AND email_confirmed_at IS NULL;


-- 7. Apply and check ---------------------------------------------------
NOTIFY pgrst, 'reload schema';

-- Should return one row: nunes@gmail.com
SELECT u.email AS admin_email, a.created_at
FROM public.admin_users a
JOIN auth.users u ON u.id = a.user_id;
