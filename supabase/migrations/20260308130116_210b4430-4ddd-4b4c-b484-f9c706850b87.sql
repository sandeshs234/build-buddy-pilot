
-- Fix RLS policies: convert RESTRICTIVE to PERMISSIVE so ANY matching policy grants access

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['activities','boq_items','inventory','equipment','safety_incidents','delays','purchase_orders','manpower','fuel_log','concrete_pours','daily_quantity'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins can manage all data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Project members can read project data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage own data" ON public.%I', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Project members can manage own project data" ON public.%I', tbl);
    
    EXECUTE format('CREATE POLICY "Admins can manage all data" ON public.%I FOR ALL TO authenticated USING (has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (has_role(auth.uid(), ''admin''::app_role))', tbl);
    EXECUTE format('CREATE POLICY "Project members can read project data" ON public.%I FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id))', tbl);
    EXECUTE format('CREATE POLICY "Users can manage own data" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl);
    EXECUTE format('CREATE POLICY "Project members can manage own project data" ON public.%I FOR ALL TO authenticated USING (is_project_member(auth.uid(), project_id) AND user_id = auth.uid()) WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid())', tbl);
  END LOOP;
END $$;

-- Fix notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Project members can insert notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Project members can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (is_project_member(auth.uid(), project_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Project members can view member profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can view member profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.project_members pm1
    JOIN public.project_members pm2 ON pm1.project_id = pm2.project_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = profiles.id
    AND pm1.status = 'approved' AND pm2.status = 'approved'
  )
);

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix project_members
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
DROP POLICY IF EXISTS "Project admin manages members" ON public.project_members;
CREATE POLICY "Members can view project members" ON public.project_members FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id) OR user_id = auth.uid());
CREATE POLICY "Project admin manages members" ON public.project_members FOR ALL TO authenticated USING ((get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin','co_admin'])) OR user_id = auth.uid()) WITH CHECK ((get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin','co_admin'])) OR user_id = auth.uid());

-- Fix data_changes
DROP POLICY IF EXISTS "Members can manage data changes" ON public.data_changes;
DROP POLICY IF EXISTS "Admin can approve changes" ON public.data_changes;
CREATE POLICY "Members can manage data changes" ON public.data_changes FOR ALL TO authenticated USING (is_project_member(auth.uid(), project_id)) WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid());
CREATE POLICY "Admin can approve changes" ON public.data_changes FOR UPDATE TO authenticated USING (get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin','co_admin']));

-- Fix chat_messages
DROP POLICY IF EXISTS "Members can manage chat" ON public.chat_messages;
CREATE POLICY "Members can manage chat" ON public.chat_messages FOR ALL TO authenticated USING (is_project_member(auth.uid(), project_id)) WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid());

-- Fix projects
DROP POLICY IF EXISTS "Anyone can lookup project by connection code" ON public.projects;
DROP POLICY IF EXISTS "Creator can manage projects" ON public.projects;
CREATE POLICY "Anyone can lookup project by connection code" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creator can manage projects" ON public.projects FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
