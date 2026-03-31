-- Drop the overly permissive policy
DROP POLICY "Authenticated users can create organizations" ON public.organizations;

-- More restrictive: only allow if user has no org yet
CREATE POLICY "Users without org can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);
