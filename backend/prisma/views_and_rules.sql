-- 1. Check constraint on decisions: overrides require a non-empty reason
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_override_reason') THEN
    ALTER TABLE decisions ADD CONSTRAINT check_override_reason CHECK (
      (decision NOT IN ('OVERRIDE_APPROVE', 'OVERRIDE_REJECT'))
      OR (reason IS NOT NULL AND length(trim(reason)) > 0)
    );
  END IF;
END $$;

-- 2. Append-only rules on audit_log
CREATE OR REPLACE RULE audit_log_no_update AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE OR REPLACE RULE audit_log_no_delete AS ON DELETE TO audit_log DO INSTEAD NOTHING;

-- 3. SQL View fairness_summary
CREATE OR REPLACE VIEW fairness_summary AS
SELECT
  c.women_led,
  c.sector,
  c.has_digital_history,
  COUNT(DISTINCT lc.id)::int AS total_cases,
  ROUND(AVG(s.default_prob)::numeric, 4) AS avg_default_prob,
  ROUND(
    COALESCE(
      (COUNT(CASE WHEN d.decision IN ('APPROVE', 'OVERRIDE_APPROVE') THEN 1 END)::numeric /
      NULLIF(COUNT(d.id), 0)::numeric), 0
    ), 4
  ) AS approval_rate
FROM cooperatives c
LEFT JOIN loan_cases lc ON lc.cooperative_id = c.id
LEFT JOIN scores s ON s.loan_case_id = lc.id AND s.is_what_if = false
LEFT JOIN decisions d ON d.loan_case_id = lc.id
GROUP BY c.women_led, c.sector, c.has_digital_history;
