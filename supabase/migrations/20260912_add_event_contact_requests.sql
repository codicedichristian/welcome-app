CREATE TABLE event_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  event_name text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE event_contact_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert" ON event_contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read" ON event_contact_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
);
