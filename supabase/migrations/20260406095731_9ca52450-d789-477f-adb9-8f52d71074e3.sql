
-- Drop the old update policy
DROP POLICY IF EXISTS "Admins can update profiles in their org" ON public.profiles;

-- Recreate: allow admin to update profiles that are in their org OR that are being moved INTO their org
CREATE POLICY "Admins can update profiles in their org" ON public.profiles
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), get_user_org_id(auth.uid()), 'admin'::app_role)
  OR user_id = auth.uid()
)
WITH CHECK (
  has_role(auth.uid(), get_user_org_id(auth.uid()), 'admin'::app_role)
  OR user_id = auth.uid()
);