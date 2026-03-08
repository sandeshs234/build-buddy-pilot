
-- Add storage_mode to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS storage_mode text DEFAULT NULL;

-- Activities table
CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wbs text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  planned_start text NOT NULL DEFAULT '',
  planned_end text NOT NULL DEFAULT '',
  actual_start text DEFAULT NULL,
  actual_end text DEFAULT NULL,
  percent_complete numeric NOT NULL DEFAULT 0,
  critical boolean NOT NULL DEFAULT false,
  predecessors text DEFAULT NULL,
  status text NOT NULL DEFAULT 'not-started',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- BOQ Items table
CREATE TABLE public.boq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  measure_type text NOT NULL DEFAULT 'direct',
  total_qty numeric NOT NULL DEFAULT 0,
  executed_qty numeric NOT NULL DEFAULT 0,
  rate numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory table
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT '',
  opening numeric NOT NULL DEFAULT 0,
  receipts numeric NOT NULL DEFAULT 0,
  issues numeric NOT NULL DEFAULT 0,
  balance numeric NOT NULL DEFAULT 0,
  min_level numeric NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Equipment table
CREATE TABLE public.equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  eq_id text NOT NULL DEFAULT '',
  equipment_name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  operator text NOT NULL DEFAULT '',
  ownership text NOT NULL DEFAULT 'owned',
  hours numeric NOT NULL DEFAULT 0,
  fuel numeric NOT NULL DEFAULT 0,
  activity text NOT NULL DEFAULT '',
  issues text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safety incidents table
CREATE TABLE public.safety_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'observation',
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  injured text NOT NULL DEFAULT '',
  cause text NOT NULL DEFAULT '',
  preventive text NOT NULL DEFAULT '',
  reporter text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Delays table
CREATE TABLE public.delays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  activity text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  cause text NOT NULL DEFAULT '',
  duration numeric NOT NULL DEFAULT 0,
  impact text NOT NULL DEFAULT '',
  recovery text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase orders table
CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  po_no text NOT NULL DEFAULT '',
  supplier text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  item_code text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Manpower table
CREATE TABLE public.manpower (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  mason numeric NOT NULL DEFAULT 0,
  carpenter numeric NOT NULL DEFAULT 0,
  steel numeric NOT NULL DEFAULT 0,
  welder numeric NOT NULL DEFAULT 0,
  fitter numeric NOT NULL DEFAULT 0,
  electrician numeric NOT NULL DEFAULT 0,
  operator numeric NOT NULL DEFAULT 0,
  skilled numeric NOT NULL DEFAULT 0,
  unskilled numeric NOT NULL DEFAULT 0,
  supervisor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fuel log table
CREATE TABLE public.fuel_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  equipment text NOT NULL DEFAULT '',
  liters numeric NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  odometer numeric NOT NULL DEFAULT 0,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Concrete pours table
CREATE TABLE public.concrete_pours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  grade text NOT NULL DEFAULT '',
  volume numeric NOT NULL DEFAULT 0,
  supplier text NOT NULL DEFAULT '',
  slump numeric NOT NULL DEFAULT 0,
  temperature numeric NOT NULL DEFAULT 0,
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Daily quantity table
CREATE TABLE public.daily_quantity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date text NOT NULL DEFAULT '',
  boq_code text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  qty numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  remarks text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manpower ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrete_pours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quantity ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can CRUD their own data, admins can see all
DO $$ 
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['activities','boq_items','inventory','equipment','safety_incidents','delays','purchase_orders','manpower','fuel_log','concrete_pours','daily_quantity'])
  LOOP
    EXECUTE format('CREATE POLICY "Users can manage own data" ON public.%I FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl);
    EXECUTE format('CREATE POLICY "Admins can manage all data" ON public.%I FOR ALL TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role)) WITH CHECK (public.has_role(auth.uid(), ''admin''::app_role))', tbl);
  END LOOP;
END $$;
