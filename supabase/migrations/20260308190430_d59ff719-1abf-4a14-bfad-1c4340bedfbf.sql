DROP POLICY IF EXISTS "Users can delete own pending changes" ON public.data_changes;
CREATE POLICY "Users can delete own pending or rejected changes"
  ON public.data_changes FOR DELETE
  USING ((user_id = auth.uid()) AND (status IN ('pending', 'rejected')));