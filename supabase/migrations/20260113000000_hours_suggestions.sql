-- Create function for updated_at trigger (if doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hours suggestions table for user-submitted corrections
CREATE TABLE hours_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,

  -- Suggested hours (structured format, same as locations.opening_hours_structured)
  suggested_hours JSONB NOT NULL,

  -- Optional note from suggester
  note TEXT,

  -- Rate limiting: store IP hash (not raw IP for privacy)
  ip_hash TEXT NOT NULL,

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  admin_note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hours_suggestions_location ON hours_suggestions(location_id);
CREATE INDEX idx_hours_suggestions_status ON hours_suggestions(status);
CREATE INDEX idx_hours_suggestions_created ON hours_suggestions(created_at DESC);

-- Rate limiting index: find recent submissions from same IP
CREATE INDEX idx_hours_suggestions_ip_rate ON hours_suggestions(ip_hash, created_at DESC);

-- RLS Policies
ALTER TABLE hours_suggestions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (rate limited at application level)
CREATE POLICY "Anyone can submit hours suggestions"
  ON hours_suggestions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view all suggestions
CREATE POLICY "Admins can view all suggestions"
  ON hours_suggestions FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Only admins can update (approve/reject)
CREATE POLICY "Admins can update suggestions"
  ON hours_suggestions FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Trigger for updated_at
CREATE TRIGGER update_hours_suggestions_updated_at
  BEFORE UPDATE ON hours_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE hours_suggestions IS 'User-submitted corrections to location opening hours';
