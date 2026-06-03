CREATE TABLE IF NOT EXISTS loads (
  load_id text PRIMARY KEY,
  origin text NOT NULL,
  destination text NOT NULL,
  pickup_datetime timestamptz NOT NULL,
  delivery_datetime timestamptz NOT NULL,
  equipment_type text NOT NULL,
  loadboard_rate numeric(12, 2) NOT NULL,
  notes text,
  weight integer,
  commodity_type text,
  num_of_pieces integer,
  miles integer,
  dimensions jsonb,
  target_rate numeric(12, 2) NOT NULL,
  max_auto_rate numeric(12, 2) NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS carriers (
  id serial PRIMARY KEY,
  mc_number text NOT NULL UNIQUE,
  dot_number text,
  legal_name text,
  allowed_to_operate boolean,
  out_of_service boolean,
  eligible boolean NOT NULL DEFAULT false,
  verification_source text NOT NULL,
  simulated boolean NOT NULL DEFAULT false,
  raw jsonb,
  verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS negotiations (
  id text PRIMARY KEY,
  session_id text NOT NULL,
  load_id text NOT NULL REFERENCES loads(load_id),
  mc_number text NOT NULL,
  carrier_id integer REFERENCES carriers(id),
  round_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  agreed_rate numeric(12, 2),
  last_offer_rate numeric(12, 2),
  last_counter_rate numeric(12, 2),
  offers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS negotiations_session_idx ON negotiations(session_id);
CREATE INDEX IF NOT EXISTS negotiations_load_idx ON negotiations(load_id);
CREATE INDEX IF NOT EXISTS negotiations_mc_idx ON negotiations(mc_number);

CREATE TABLE IF NOT EXISTS calls (
  id text PRIMARY KEY,
  happyrobot_run_id text,
  happyrobot_session_id text,
  negotiation_id text REFERENCES negotiations(id),
  load_id text REFERENCES loads(load_id),
  mc_number text,
  carrier_id integer REFERENCES carriers(id),
  outcome text NOT NULL,
  sentiment text NOT NULL,
  agreed_rate numeric(12, 2),
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  transcript text,
  summary text,
  transfer_mock boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS calls_outcome_idx ON calls(outcome);
CREATE INDEX IF NOT EXISTS calls_sentiment_idx ON calls(sentiment);
CREATE INDEX IF NOT EXISTS calls_created_at_idx ON calls(created_at);
