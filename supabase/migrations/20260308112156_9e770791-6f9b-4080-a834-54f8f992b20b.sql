-- Allow any authenticated user to SELECT projects (needed for connection code lookup when joining)
CREATE POLICY "Anyone can lookup project by connection code"
ON public.projects FOR SELECT TO authenticated
USING (true);

-- Drop the narrower member-only select policy since the new one covers it
DROP POLICY IF EXISTS "Members can view projects" ON public.projects;