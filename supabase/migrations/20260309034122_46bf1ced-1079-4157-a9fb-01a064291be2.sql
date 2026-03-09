
-- FIX 1: Recreate all RESTRICTIVE policies as PERMISSIVE to restore access control
-- This is critical - without PERMISSIVE policies, RLS blocks all access by default

-- Drop all existing RESTRICTIVE policies
DROP POLICY IF EXISTS "Users can view own activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;
DROP POLICY IF EXISTS "Users can view own boq_items" ON boq_items;
DROP POLICY IF EXISTS "Users can create boq_items" ON boq_items;
DROP POLICY IF EXISTS "Users can update own boq_items" ON boq_items;
DROP POLICY IF EXISTS "Users can view own chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can create chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Members can manage chat" ON chat_messages;
DROP POLICY IF EXISTS "Users can view own concrete_pours" ON concrete_pours;
DROP POLICY IF EXISTS "Users can create concrete_pours" ON concrete_pours;
DROP POLICY IF EXISTS "Users can update own concrete_pours" ON concrete_pours;
DROP POLICY IF EXISTS "Users can view own daily_quantity" ON daily_quantity;
DROP POLICY IF EXISTS "Users can create daily_quantity" ON daily_quantity;
DROP POLICY IF EXISTS "Users can update own daily_quantity" ON daily_quantity;
DROP POLICY IF EXISTS "Users can view own data_changes" ON data_changes;
DROP POLICY IF EXISTS "Users can create data_changes" ON data_changes;
DROP POLICY IF EXISTS "Admins can approve data_changes" ON data_changes;
DROP POLICY IF EXISTS "Users can delete own pending or rejected changes" ON data_changes;
DROP POLICY IF EXISTS "Users can view own delays" ON delays;
DROP POLICY IF EXISTS "Users can create delays" ON delays;
DROP POLICY IF EXISTS "Users can update own delays" ON delays;
DROP POLICY IF EXISTS "Users can view own equipment" ON equipment;
DROP POLICY IF EXISTS "Users can create equipment" ON equipment;
DROP POLICY IF EXISTS "Users can update own equipment" ON equipment;
DROP POLICY IF EXISTS "Users can view own fuel_log" ON fuel_log;
DROP POLICY IF EXISTS "Users can create fuel_log" ON fuel_log;
DROP POLICY IF EXISTS "Users can update own fuel_log" ON fuel_log;
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can create inventory" ON inventory;
DROP POLICY IF EXISTS "Users can update own inventory" ON inventory;
DROP POLICY IF EXISTS "Users can view own manpower" ON manpower;
DROP POLICY IF EXISTS "Users can create manpower" ON manpower;
DROP POLICY IF EXISTS "Users can update own manpower" ON manpower;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own procurement_tracking" ON procurement_tracking;
DROP POLICY IF EXISTS "Users can create procurement_tracking" ON procurement_tracking;
DROP POLICY IF EXISTS "Users can update own procurement_tracking" ON procurement_tracking;
DROP POLICY IF EXISTS "Project members can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Members can view project details" ON projects;
DROP POLICY IF EXISTS "Anyone can lookup project by connection code" ON projects;
DROP POLICY IF EXISTS "Users can view own purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can create purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can update own purchase_orders" ON purchase_orders;
DROP POLICY IF EXISTS "Users can view own safety_incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Users can create safety_incidents" ON safety_incidents;
DROP POLICY IF EXISTS "Users can update own safety_incidents" ON safety_incidents;

-- FIX 2: Recreate core policies as PERMISSIVE (access-granting)
-- ACTIVITIES
CREATE POLICY "Users can view project activities" ON activities
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create activities" ON activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update activities" ON activities
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- BOQ_ITEMS
CREATE POLICY "Users can view project boq_items" ON boq_items
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create boq_items" ON boq_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update boq_items" ON boq_items
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- CHAT_MESSAGES
CREATE POLICY "Members can read project chat" ON chat_messages
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND 
    public.is_project_member(auth.uid(), project_id)
  );

CREATE POLICY "Members can post chat" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    public.is_project_member(auth.uid(), project_id)
  );

CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can edit own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CONCRETE_POURS
CREATE POLICY "Users can view project concrete_pours" ON concrete_pours
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create concrete_pours" ON concrete_pours
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update concrete_pours" ON concrete_pours
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- DAILY_QUANTITY
CREATE POLICY "Users can view project daily_quantity" ON daily_quantity
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create daily_quantity" ON daily_quantity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update daily_quantity" ON daily_quantity
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- DATA_CHANGES (Fixed: DELETE now requires authenticated users only)
CREATE POLICY "Users can view data_changes" ON data_changes
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create data_changes" ON data_changes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Project admins can approve changes" ON data_changes
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin') OR
      public.has_role(auth.uid(), 'admin')
    )
  ) WITH CHECK (true);

CREATE POLICY "Users can delete own pending changes" ON data_changes
  FOR DELETE USING (auth.uid() = user_id AND status IN ('pending', 'rejected'));

-- DELAYS
CREATE POLICY "Users can view project delays" ON delays
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create delays" ON delays
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update delays" ON delays
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- EQUIPMENT
CREATE POLICY "Users can view project equipment" ON equipment
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create equipment" ON equipment
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update equipment" ON equipment
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- FUEL_LOG
CREATE POLICY "Users can view project fuel_log" ON fuel_log
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create fuel_log" ON fuel_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update fuel_log" ON fuel_log
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- INVENTORY
CREATE POLICY "Users can view project inventory" ON inventory
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create inventory" ON inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update inventory" ON inventory
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- MANPOWER
CREATE POLICY "Users can view project manpower" ON manpower
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create manpower" ON manpower
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update manpower" ON manpower
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROCUREMENT_TRACKING
CREATE POLICY "Users can view project procurement" ON procurement_tracking
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create procurement" ON procurement_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update procurement" ON procurement_tracking
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- PROFILES
CREATE POLICY "Users can view profiles" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- PROJECTS (FIX: Restrict connection code exposure)
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid() OR 
      public.is_project_member(auth.uid(), id)
    )
  );

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Project owners can update" ON projects
  FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- PURCHASE_ORDERS
CREATE POLICY "Users can view project purchase_orders" ON purchase_orders
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create purchase_orders" ON purchase_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update purchase_orders" ON purchase_orders
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());

-- SAFETY_INCIDENTS
CREATE POLICY "Users can view project safety_incidents" ON safety_incidents
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  );

CREATE POLICY "Users can create safety_incidents" ON safety_incidents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update safety_incidents" ON safety_incidents
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      public.is_project_member(auth.uid(), project_id)
    )
  ) WITH CHECK (user_id = auth.uid());
