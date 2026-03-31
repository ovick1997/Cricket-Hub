
-- Allow admins to update profiles in their organization (e.g. approve users)
CREATE POLICY "Admins can update profiles in their org"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), organization_id, 'admin'::app_role)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.has_role(auth.uid(), organization_id, 'admin'::app_role)
  OR user_id = auth.uid()
);

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
