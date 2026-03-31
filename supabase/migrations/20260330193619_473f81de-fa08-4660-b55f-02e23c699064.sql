
-- Tighten org creation: only users without org or existing admins
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Users without an org can create their first
    NOT EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND organization_id IS NOT NULL
    )
    OR
    -- Existing admins can create additional orgs
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
