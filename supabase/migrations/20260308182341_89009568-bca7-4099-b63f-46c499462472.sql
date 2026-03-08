CREATE POLICY "Users can delete own pending changes"
ON public.data_changes
FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND status = 'pending');