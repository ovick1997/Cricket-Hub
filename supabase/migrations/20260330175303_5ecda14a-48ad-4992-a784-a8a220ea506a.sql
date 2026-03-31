-- Allow authenticated users to create organizations (for initial setup)
CREATE POLICY "Authenticated users can create organizations"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert their own user_roles (for org setup)
-- This supplements the admin-only policy for the initial admin role
CREATE POLICY "Users can assign themselves during org setup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
