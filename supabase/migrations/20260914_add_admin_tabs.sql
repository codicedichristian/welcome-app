-- NULL means the admin sees ALL tabs (superadmin). A non-null array like
-- '{members,events,join-requests}' means they see only those tabs.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_tabs text[] DEFAULT NULL;
