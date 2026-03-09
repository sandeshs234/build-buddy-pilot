
-- FIX: Remove overly permissive WITH CHECK (true) for data_changes UPDATE policy
DROP POLICY IF EXISTS "Project admins can approve changes" ON data_changes;

-- Recreate with proper WITH CHECK condition
CREATE POLICY "Project admins can approve changes" ON data_changes
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin') OR
      public.has_role(auth.uid(), 'admin')
    )
  ) WITH CHECK (
    public.get_project_role(auth.uid(), project_id) IN ('admin', 'co_admin') OR
    public.has_role(auth.uid(), 'admin')
  );
