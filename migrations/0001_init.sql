-- Content Sources: the sentence bank behind Kiosk mode and Local History
-- mode (BTECH, Cache Valley, Box Elder County, Utah facts). Shared across
-- every device once this ships, unlike the old per-device localStorage
-- override - edits made through /admin apply everywhere immediately, no
-- code change or deploy needed.
CREATE TABLE content_sources (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_sources_topic ON content_sources(topic);
