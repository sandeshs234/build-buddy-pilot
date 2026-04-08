-- Drop the overly broad profiles SELECT policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Tighten notifications INSERT to prevent cross-user spam
DROP POLICY IF EXISTS "Project members can insert notifications" ON public.notifications;
CREATE POLICY "Project members can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (
    (is_project_member(auth.uid(), project_id) OR has_role(auth.uid(), 'admin'::app_role))
    AND (
      user_id = auth.uid()
      OR is_project_member(user_id, project_id)
    )
  );