
-- Add SELECT policies for project members on all data tables

CREATE POLICY "Project members can read project data"
ON public.activities FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.boq_items FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.concrete_pours FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.daily_quantity FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.delays FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.equipment FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.fuel_log FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.inventory FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.manpower FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.purchase_orders FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));

CREATE POLICY "Project members can read project data"
ON public.safety_incidents FOR SELECT TO authenticated
USING (is_project_member(auth.uid(), project_id));
