
-- Fix all RLS policies from RESTRICTIVE to PERMISSIVE

-- ACTIVITIES
DROP POLICY IF EXISTS "Users can manage own data" ON public.activities;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.activities;
DROP POLICY IF EXISTS "Project members can read project data" ON public.activities;
CREATE POLICY "Users can manage own data" ON public.activities FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.activities FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.activities FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- BOQ_ITEMS
DROP POLICY IF EXISTS "Users can manage own data" ON public.boq_items;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.boq_items;
DROP POLICY IF EXISTS "Project members can read project data" ON public.boq_items;
CREATE POLICY "Users can manage own data" ON public.boq_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.boq_items FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.boq_items FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- CONCRETE_POURS
DROP POLICY IF EXISTS "Users can manage own data" ON public.concrete_pours;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.concrete_pours;
DROP POLICY IF EXISTS "Project members can read project data" ON public.concrete_pours;
CREATE POLICY "Users can manage own data" ON public.concrete_pours FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.concrete_pours FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.concrete_pours FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- DAILY_QUANTITY
DROP POLICY IF EXISTS "Users can manage own data" ON public.daily_quantity;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.daily_quantity;
DROP POLICY IF EXISTS "Project members can read project data" ON public.daily_quantity;
CREATE POLICY "Users can manage own data" ON public.daily_quantity FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.daily_quantity FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.daily_quantity FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- DELAYS
DROP POLICY IF EXISTS "Users can manage own data" ON public.delays;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.delays;
DROP POLICY IF EXISTS "Project members can read project data" ON public.delays;
CREATE POLICY "Users can manage own data" ON public.delays FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.delays FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.delays FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- EQUIPMENT
DROP POLICY IF EXISTS "Users can manage own data" ON public.equipment;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.equipment;
DROP POLICY IF EXISTS "Project members can read project data" ON public.equipment;
CREATE POLICY "Users can manage own data" ON public.equipment FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.equipment FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.equipment FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- FUEL_LOG
DROP POLICY IF EXISTS "Users can manage own data" ON public.fuel_log;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.fuel_log;
DROP POLICY IF EXISTS "Project members can read project data" ON public.fuel_log;
CREATE POLICY "Users can manage own data" ON public.fuel_log FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.fuel_log FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.fuel_log FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- INVENTORY
DROP POLICY IF EXISTS "Users can manage own data" ON public.inventory;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.inventory;
DROP POLICY IF EXISTS "Project members can read project data" ON public.inventory;
CREATE POLICY "Users can manage own data" ON public.inventory FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.inventory FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.inventory FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- MANPOWER
DROP POLICY IF EXISTS "Users can manage own data" ON public.manpower;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.manpower;
DROP POLICY IF EXISTS "Project members can read project data" ON public.manpower;
CREATE POLICY "Users can manage own data" ON public.manpower FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.manpower FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.manpower FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- PURCHASE_ORDERS
DROP POLICY IF EXISTS "Users can manage own data" ON public.purchase_orders;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.purchase_orders;
DROP POLICY IF EXISTS "Project members can read project data" ON public.purchase_orders;
CREATE POLICY "Users can manage own data" ON public.purchase_orders FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.purchase_orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.purchase_orders FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- SAFETY_INCIDENTS
DROP POLICY IF EXISTS "Users can manage own data" ON public.safety_incidents;
DROP POLICY IF EXISTS "Admins can manage all data" ON public.safety_incidents;
DROP POLICY IF EXISTS "Project members can read project data" ON public.safety_incidents;
CREATE POLICY "Users can manage own data" ON public.safety_incidents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage all data" ON public.safety_incidents FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Project members can read project data" ON public.safety_incidents FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id));

-- NOTIFICATIONS - Fix overly permissive insert
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Project members can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (is_project_member(auth.uid(), project_id) OR has_role(auth.uid(), 'admin'::app_role));

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Members can manage chat" ON public.chat_messages;
CREATE POLICY "Members can manage chat" ON public.chat_messages FOR ALL TO authenticated USING (is_project_member(auth.uid(), project_id)) WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid());

-- DATA_CHANGES
DROP POLICY IF EXISTS "Members can manage data changes" ON public.data_changes;
DROP POLICY IF EXISTS "Admin can approve changes" ON public.data_changes;
CREATE POLICY "Members can manage data changes" ON public.data_changes FOR ALL TO authenticated USING (is_project_member(auth.uid(), project_id)) WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid());
CREATE POLICY "Admin can approve changes" ON public.data_changes FOR UPDATE TO authenticated USING (get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin'::text, 'co_admin'::text]));

-- PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- PROJECT_MEMBERS
DROP POLICY IF EXISTS "Project admin manages members" ON public.project_members;
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;
CREATE POLICY "Project admin manages members" ON public.project_members FOR ALL TO authenticated USING ((get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin'::text, 'co_admin'::text])) OR user_id = auth.uid()) WITH CHECK ((get_project_role(auth.uid(), project_id) = ANY (ARRAY['admin'::text, 'co_admin'::text])) OR user_id = auth.uid());
CREATE POLICY "Members can view project members" ON public.project_members FOR SELECT TO authenticated USING (is_project_member(auth.uid(), project_id) OR user_id = auth.uid());

-- PROJECTS
DROP POLICY IF EXISTS "Creator can manage projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can lookup project by connection code" ON public.projects;
CREATE POLICY "Creator can manage projects" ON public.projects FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Anyone can lookup project by connection code" ON public.projects FOR SELECT TO authenticated USING (true);

-- USER_ROLES
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
