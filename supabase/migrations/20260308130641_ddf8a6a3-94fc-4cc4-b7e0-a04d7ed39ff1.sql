
-- Fix privilege escalation: split project_members policy
DROP POLICY IF EXISTS "Project admin manages members" ON public.project_members;

-- Admins/co-admins can fully manage members
CREATE POLICY "Project admin manages members" ON public.project_members
  FOR ALL TO authenticated
  USING (get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin','co_admin']))
  WITH CHECK (get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin','co_admin']));

-- Users can only INSERT themselves as 'member' with 'pending' status (join request)
CREATE POLICY "Users can request to join" ON public.project_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'member' AND status = 'pending');

-- Users can view their own membership records
CREATE POLICY "Users can view own membership" ON public.project_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own membership (leave project)
CREATE POLICY "Users can leave project" ON public.project_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
