
-- Shared app data (admin-managed collections: projects, events, team, meetings, tasks, collaborate, notifications, subscribers, event_registrations mirror)
CREATE TABLE public.app_data (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_data TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.app_data TO authenticated;
GRANT ALL ON public.app_data TO service_role;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_data" ON public.app_data
  FOR SELECT USING (true);
CREATE POLICY "Admin can insert app_data" ON public.app_data
  FOR INSERT TO authenticated
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com');
CREATE POLICY "Admin can update app_data" ON public.app_data
  FOR UPDATE TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com')
  WITH CHECK (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com');
CREATE POLICY "Admin can delete app_data" ON public.app_data
  FOR DELETE TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com');

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER app_data_touch BEFORE UPDATE ON public.app_data
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Public form submissions (contact, membership applications, event registrations, subscribers)
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('contact','event_registration','membership_application','subscriber')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  event_id text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submissions_kind_idx ON public.submissions(kind, created_at DESC);
CREATE INDEX submissions_user_idx ON public.submissions(user_id) WHERE user_id IS NOT NULL;
GRANT SELECT, DELETE ON public.submissions TO authenticated;
GRANT INSERT ON public.submissions TO anon, authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit" ON public.submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com');
CREATE POLICY "User sees own submissions" ON public.submissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admin deletes submissions" ON public.submissions
  FOR DELETE TO authenticated
  USING (lower(coalesce(auth.jwt() ->> 'email','')) = 'njbsictclub@gmail.com');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
