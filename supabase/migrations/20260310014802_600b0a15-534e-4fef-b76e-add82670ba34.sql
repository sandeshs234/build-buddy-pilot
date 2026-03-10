
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;
