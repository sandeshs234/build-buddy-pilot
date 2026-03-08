
CREATE TABLE public.procurement_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  material_code text NOT NULL DEFAULT '',
  material_description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  required_qty numeric NOT NULL DEFAULT 0,
  ordered_qty numeric NOT NULL DEFAULT 0,
  received_qty numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  supplier text NOT NULL DEFAULT '',
  po_number text NOT NULL DEFAULT '',
  order_date text NOT NULL DEFAULT '',
  expected_delivery text NOT NULL DEFAULT '',
  actual_delivery text NOT NULL DEFAULT '',
  unit_rate numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  remarks text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.procurement_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own data" ON public.procurement_tracking
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all data" ON public.procurement_tracking
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Project members can manage own project data" ON public.procurement_tracking
  FOR ALL TO authenticated
  USING (is_project_member(auth.uid(), project_id) AND user_id = auth.uid())
  WITH CHECK (is_project_member(auth.uid(), project_id) AND user_id = auth.uid());

CREATE POLICY "Project members can read project data" ON public.procurement_tracking
  FOR SELECT TO authenticated
  USING (is_project_member(auth.uid(), project_id));
