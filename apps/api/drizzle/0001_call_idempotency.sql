CREATE UNIQUE INDEX IF NOT EXISTS calls_happyrobot_run_id_unique
ON calls (happyrobot_run_id)
WHERE happyrobot_run_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS calls_happyrobot_session_id_unique
ON calls (happyrobot_session_id)
WHERE happyrobot_session_id IS NOT NULL;
