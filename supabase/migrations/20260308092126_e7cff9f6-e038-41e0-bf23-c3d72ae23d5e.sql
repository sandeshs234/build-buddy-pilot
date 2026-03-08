
-- Projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  connection_code text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(connection_code)
);

-- Project members table
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'co_admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Chat messages table with realtime
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Data changes (draft/approval system)
CREATE TABLE public.data_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  record_id text NOT NULL,
  operation text NOT NULL DEFAULT 'insert' CHECK (operation IN ('insert', 'update', 'delete')),
  data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add project_id to all data tables
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.boq_items ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.safety_incidents ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.delays ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.manpower ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.fuel_log ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.concrete_pours ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
ALTER TABLE public.daily_quantity ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_changes ENABLE ROW LEVEL SECURITY;

-- Function: check if user is member of a project
CREATE OR REPLACE FUNCTION public.is_project_member(_user_id uuid, _project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = _user_id AND project_id = _project_id AND status = 'approved'
  )
$$;

-- Function: check project role
CREATE OR REPLACE FUNCTION public.get_project_role(_user_id uuid, _project_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.project_members
  WHERE user_id = _user_id AND project_id = _project_id AND status = 'approved'
  LIMIT 1
$$;

-- Projects: creator can see, members can see
CREATE POLICY "Creator can manage projects" ON public.projects
FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can view projects" ON public.projects
FOR SELECT TO authenticated
USING (public.is_project_member(auth.uid(), id));

-- Project members: admin can manage, users can view own
CREATE POLICY "Project admin manages members" ON public.project_members
FOR ALL TO authenticated
USING (
  public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin')
  OR user_id = auth.uid()
)
WITH CHECK (
  public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Members can view project members" ON public.project_members
FOR SELECT TO authenticated
USING (public.is_project_member(auth.uid(), project_id) OR user_id = auth.uid());

-- Chat: project members can read/write
CREATE POLICY "Members can manage chat" ON public.chat_messages
FOR ALL TO authenticated
USING (public.is_project_member(auth.uid(), project_id))
WITH CHECK (public.is_project_member(auth.uid(), project_id) AND user_id = auth.uid());

-- Data changes: project members can create, admin approves
CREATE POLICY "Members can manage data changes" ON public.data_changes
FOR ALL TO authenticated
USING (public.is_project_member(auth.uid(), project_id))
WITH CHECK (public.is_project_member(auth.uid(), project_id) AND user_id = auth.uid());

CREATE POLICY "Admin can approve changes" ON public.data_changes
FOR UPDATE TO authenticated
USING (public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin'));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.data_changes;
