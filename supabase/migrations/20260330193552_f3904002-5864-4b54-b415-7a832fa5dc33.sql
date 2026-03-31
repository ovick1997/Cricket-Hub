
-- Allow admins to create additional organizations
DROP POLICY IF EXISTS "Users without org can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to view all organizations (for multi-org management)
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

CREATE POLICY "Users can view organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (true);
