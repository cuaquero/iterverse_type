/**
 * AdminPage — standalone route at /admin. Lets staff edit the
 * Kiosk/Local-History-mode content pack (BTECH, Cache Valley, Box Elder
 * County, Utah facts) without touching code.
 *
 * Real authentication happens before this ever loads: functions/admin/
 * _middleware.js gates the whole /admin/* path behind a verified
 * Cloudflare Access identity (see docs/ACCESS.md) — the same platform-auth
 * pattern every other Iterverse product uses. This component never checks
 * a password itself; by the time it renders, Access has already confirmed
 * who's signed in, and functions/admin/whoami.js just surfaces that email
 * for display.
 *
 * There's still no backend for the actual content (see CLAUDE.md) — edits
 * are stored as a per-device localStorage override on top of the shipped
 * JSON (src/services/contentAdmin.js), the same way Kiosk's own settings
 * and leaderboard work. Access controls *who can reach this page*; it
 * doesn't turn the content store into a shared one.
 */

import React, { useEffect, useMemo, useState } from "react";
import styled, { createGlobalStyle } from "styled-components";
import "../assets/iterverse/tokens.css";
import "../assets/iterverse/fonts.css";
import btechMark from "../assets/iterverse/btech-mark.png";
import { checkEntryText, MIN_LENGTH, MAX_LENGTH } from "../scripts/contentValidation";
import {
  getEffectiveSentences,
  addSentence,
  editSentence,
  deleteSentence,
  hasOverrides,
  resetOverrides,
} from "../services/contentAdmin";

const AdminGlobalStyle = createGlobalStyle`
  html, body, #root {
    height: 100%;
    margin: 0;
  }

  :root {
    --surface-page: #232526;
    --surface-card: #36393b;
    --surface-subtle: #3a3a3e;
    --text-body: #f7f7f8;
    --text-muted: #8a8a90;
    --border-subtle: rgba(255, 255, 255, 0.12);
    --border-default: rgba(255, 255, 255, 0.24);
  }
`;

const Screen = styled.div`
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: var(--surface-page);
  color: var(--text-body);
  font-family: var(--font-sans);
`;

const Banner = styled.div`
  min-height: 64px;
  flex: 0 0 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2) var(--space-4);
  padding: var(--space-2) var(--space-4);
`;

const BrandGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

const Wordmark = styled.span`
  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.015em;
  opacity: 0.9;
  strong {
    font-weight: var(--fw-bold);
    color: #ffffff;
  }
  em {
    font-style: normal;
    font-weight: 300;
    color: var(--text-muted);
  }
`;

const ProductName = styled.span`
  font-size: 22px;
  font-weight: 400;
  color: #ffffff;
  opacity: 0.9;
  margin-left: 4px;
`;

const BrandDivider = styled.span`
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.25);
  margin-left: 10px;
  flex-shrink: 0;
`;

const BtechMark = styled.img`
  height: 18px;
  width: auto;
  margin-left: 10px;
  flex-shrink: 0;
`;

const ExitLink = styled.a`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--fs-sm);
  color: var(--text-muted);
  text-decoration: none;
  &:hover {
    color: var(--text-body);
  }
`;

const IdentityLine = styled.span`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--fs-sm);
  color: var(--text-muted);
`;

const LogoutButton = styled.button`
  flex-shrink: 0;
  white-space: nowrap;
  font-size: var(--fs-sm);
  font-family: var(--font-sans);
  color: var(--color-brand);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:hover {
    color: var(--color-brand-hover);
  }
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-8) var(--space-4);
`;

const Title = styled.h1`
  font-size: var(--fs-xl);
  font-weight: var(--fw-bold);
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: var(--fs-sm);
  color: var(--text-muted);
  margin: 0;
`;

const PrimaryButton = styled.button`
  padding: var(--space-3) var(--space-6);
  font-size: var(--fs-md);
  font-family: var(--font-sans);
  font-weight: var(--fw-medium);
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-brand);
  color: var(--white);
  cursor: pointer;
  &:hover {
    background: var(--color-brand-hover);
  }
`;

const GhostButton = styled.button`
  padding: var(--space-2) var(--space-4);
  font-size: var(--fs-sm);
  font-family: var(--font-sans);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-body);
  cursor: pointer;
  &:hover {
    background: var(--surface-subtle);
  }
`;

const EditorWrap = styled.div`
  width: min(90vw, 760px);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const EditorHeaderRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
  flex-wrap: wrap;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: var(--space-3);
`;

const Notice = styled.div`
  font-size: var(--fs-sm);
  color: var(--text-muted);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
`;

const TopicSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const TopicHeading = styled.h2`
  font-size: var(--fs-md);
  font-weight: var(--fw-bold);
  margin: 0;
`;

const EntryRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
`;

const EntryText = styled.div`
  flex: 1;
  font-size: var(--fs-sm);
  line-height: var(--lh-normal);
`;

const EntryActions = styled.div`
  display: flex;
  gap: var(--space-2);
  flex-shrink: 0;
`;

const SmallButton = styled.button`
  padding: 4px 10px;
  font-size: 12px;
  font-family: var(--font-sans);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-body);
  cursor: pointer;
  &:hover {
    background: var(--surface-subtle);
  }
`;

const DangerButton = styled(SmallButton)`
  border-color: var(--color-danger);
  color: var(--color-danger);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
`;

const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: var(--fw-medium);
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-muted);
`;

const TextInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  font-size: var(--fs-sm);
  font-family: var(--font-sans);
  background: var(--surface-page);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-body);
`;

const TextArea = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  min-height: 4.5em;
  padding: var(--space-2) var(--space-3);
  font-size: var(--fs-sm);
  font-family: var(--font-sans);
  background: var(--surface-page);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  color: var(--text-body);
  resize: vertical;
`;

const CharCount = styled.div`
  font-size: 11px;
  color: ${({ $overLimit }) => ($overLimit ? "var(--color-danger)" : "var(--text-muted)")};
`;

const ProblemList = styled.ul`
  margin: 0;
  padding-left: var(--space-5);
  font-size: 12px;
  color: var(--color-danger);
`;

const emptyDraft = { topic: "", text: "" };

const AdminPage = () => {
  const [email, setEmail] = useState(null);

  useEffect(() => {
    fetch("/admin/whoami")
      .then((res) => res.json())
      .then((data) => setEmail(data.email || null))
      .catch(() => {});
  }, []);

  const [sentences, setSentences] = useState(() => getEffectiveSentences());
  const [editingId, setEditingId] = useState(null); // id being edited, or "new"
  const [draft, setDraft] = useState(emptyDraft);

  const refresh = () => setSentences(getEffectiveSentences());

  const topics = useMemo(() => {
    const grouped = new Map();
    sentences.forEach((s) => {
      if (!grouped.has(s.topic)) grouped.set(s.topic, []);
      grouped.get(s.topic).push(s);
    });
    return Array.from(grouped.entries());
  }, [sentences]);

  const handleLogout = async () => {
    // Cloudflare Access's logout endpoint has no return-URL param and signs
    // the account out of every Access app, not just this one - trigger it
    // in the background, then send the browser to the marketing page
    // ourselves (same pattern every other Iterverse product's "Log out"
    // link uses).
    try {
      await fetch("/cdn-cgi/access/logout", { credentials: "include" });
    } catch {
      // Ignore - redirect regardless so the user isn't stuck.
    }
    window.location.href = "/";
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setDraft({ topic: entry.topic, text: entry.text });
  };

  const startNew = () => {
    setEditingId("new");
    setDraft(emptyDraft);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const problems = useMemo(() => {
    if (editingId == null) return [];
    return checkEntryText(draft.text, draft.topic);
  }, [editingId, draft]);

  const handleSave = (e) => {
    e.preventDefault();
    if (problems.length > 0) return;
    if (editingId === "new") {
      addSentence(draft.topic.trim(), draft.text.trim());
    } else {
      editSentence(editingId, draft.topic.trim(), draft.text.trim());
    }
    cancelEdit();
    refresh();
  };

  const handleDelete = (id) => {
    deleteSentence(id);
    refresh();
  };

  const handleResetAll = () => {
    if (!window.confirm("Revert every change on this device back to the shipped content pack?")) {
      return;
    }
    resetOverrides();
    cancelEdit();
    refresh();
  };

  return (
    <Screen>
      <AdminGlobalStyle />
      <Banner>
        <BrandGroup>
          <svg viewBox="0 0 92 92" width="20" height="20" aria-hidden="true">
            <polygon
              points="30,18 62,18 78,46 62,74 30,74 14,46"
              fill="none"
              stroke="var(--btech-red)"
              strokeWidth="11"
              strokeLinejoin="miter"
            />
            <rect x="41.5" y="31" width="9" height="30" fill="currentColor" />
          </svg>
          <Wordmark>
            <strong>iter</strong>
            <em>verse</em>
          </Wordmark>{" "}
          <ProductName>Type</ProductName>
          <BrandDivider aria-hidden="true" />
          <BtechMark src={btechMark} alt="Bridgerland Technical College" />
        </BrandGroup>
        <HeaderActions>
          {email && <IdentityLine>{email}</IdentityLine>}
          <LogoutButton onClick={handleLogout}>Log out</LogoutButton>
          <ExitLink href="/">Exit</ExitLink>
        </HeaderActions>
      </Banner>

      <Main>
        <EditorWrap>
          <EditorHeaderRow>
            <div>
              <Title>Content Sources</Title>
              <Subtitle>
                {sentences.length} sentences across {topics.length} topics — changes apply
                immediately in Kiosk and Local History mode, on this device only.
              </Subtitle>
            </div>
            <HeaderActions>
              <GhostButton onClick={startNew}>Add sentence</GhostButton>
              {hasOverrides() && (
                <GhostButton onClick={handleResetAll}>Reset to shipped defaults</GhostButton>
              )}
            </HeaderActions>
          </EditorHeaderRow>

          <Notice>
            Edits are saved to this browser only — there's no shared backend, so they don't
            appear on other kiosks or devices. See LOCAL_HISTORY_GUIDE.md for what makes good
            content (factual, family-friendly, 40–140 characters).
          </Notice>

          {editingId === "new" && (
            <EntryForm
              draft={draft}
              setDraft={setDraft}
              problems={problems}
              onSave={handleSave}
              onCancel={cancelEdit}
              isNew
            />
          )}

          {topics.map(([topic, entries]) => (
            <TopicSection key={topic}>
              <TopicHeading>{topic}</TopicHeading>
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <EntryForm
                    key={entry.id}
                    draft={draft}
                    setDraft={setDraft}
                    problems={problems}
                    onSave={handleSave}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <EntryRow key={entry.id}>
                    <EntryText>{entry.text}</EntryText>
                    <EntryActions>
                      <SmallButton onClick={() => startEdit(entry)}>Edit</SmallButton>
                      <DangerButton onClick={() => handleDelete(entry.id)}>Delete</DangerButton>
                    </EntryActions>
                  </EntryRow>
                )
              )}
            </TopicSection>
          ))}
        </EditorWrap>
      </Main>
    </Screen>
  );
};

const EntryForm = ({ draft, setDraft, problems, onSave, onCancel, isNew }) => (
  <Form onSubmit={onSave}>
    <div>
      <FieldLabel htmlFor="entry-topic">Topic</FieldLabel>
      <TextInput
        id="entry-topic"
        value={draft.topic}
        onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))}
        placeholder="e.g. Cache Valley"
      />
    </div>
    <div>
      <FieldLabel htmlFor="entry-text">Sentence</FieldLabel>
      <TextArea
        id="entry-text"
        value={draft.text}
        onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))}
        placeholder="A single factual, verifiable sentence."
      />
      <CharCount $overLimit={draft.text.length > MAX_LENGTH || draft.text.length < MIN_LENGTH}>
        {draft.text.length} / {MIN_LENGTH}–{MAX_LENGTH} characters
      </CharCount>
    </div>
    {problems.length > 0 && (
      <ProblemList>
        {problems.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ProblemList>
    )}
    <HeaderActions>
      <PrimaryButton type="submit" disabled={problems.length > 0}>
        {isNew ? "Add" : "Save"}
      </PrimaryButton>
      <GhostButton type="button" onClick={onCancel}>
        Cancel
      </GhostButton>
    </HeaderActions>
  </Form>
);

export default AdminPage;
