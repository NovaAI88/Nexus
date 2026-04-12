import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox as InboxIcon,
  Calendar,
  FolderOpen,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { load, save } from '../storage/localStore';
import { useProjects } from '../core/projects/useProjects';

// ── Storage keys ─────────────────────────────────────────────────────────────

const INBOX_KEY = 'nexus:inbox';
const TASKS_KEY = 'nexus:tasks';

// ── Types ─────────────────────────────────────────────────────────────────────

interface InboxItem {
  id: string;
  title: string;
  createdAt: string;
  archived?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

// Notify Sidebar badge to refresh
export function notifyInboxChanged(): void {
  window.dispatchEvent(new CustomEvent('nexus:inbox:updated'));
}

// Add an item to nexus:tasks (used by Schedule + Assign)
function addTaskToStore(
  title: string,
  projectId: string | null,
  date: string | null
): void {
  const tasks = load(TASKS_KEY, []);
  const newTask = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    projectId,
    date,
    title,
    notes: '',
    status: 'open',
    priority: 'normal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };
  save(TASKS_KEY, [newTask, ...tasks]);
}

// ── Inbox page ────────────────────────────────────────────────────────────────

export default function Inbox() {
  const navigate = useNavigate();
  const { projects } = useProjects();

  const [items, setItems] = useState<InboxItem[]>(() => load(INBOX_KEY, []));
  const [inputValue, setInputValue] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modal state
  const [assignModal, setAssignModal] = useState<{ itemId: string } | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ itemId: string } | null>(null);
  const [scheduleDateStr, setScheduleDateStr] = useState(() => toDateStr(new Date()));

  const activeItems = items.filter((i) => !i.archived);
  const archivedItems = items.filter((i) => i.archived);

  function persistItems(next: InboxItem[]) {
    setItems(next);
    save(INBOX_KEY, next);
    notifyInboxChanged();
  }

  function handleAdd() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const item: InboxItem = {
      id: `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      createdAt: new Date().toISOString(),
    };
    persistItems([item, ...items]);
    setInputValue('');
  }

  function handleArchive(id: string) {
    persistItems(items.map((i) => (i.id === id ? { ...i, archived: true } : i)));
  }

  function handleRestore(id: string) {
    persistItems(items.map((i) => (i.id === id ? { ...i, archived: false } : i)));
  }

  function handleAssign(itemId: string, projectId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    addTaskToStore(item.title, projectId, null);
    persistItems(items.filter((i) => i.id !== itemId));
    setAssignModal(null);
  }

  function handleSchedule(itemId: string) {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    addTaskToStore(item.title, null, scheduleDateStr);
    persistItems(items.filter((i) => i.id !== itemId));
    setScheduleModal(null);
    navigate(`/today?date=${scheduleDateStr}`);
  }

  // Close modals on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAssignModal(null);
        setScheduleModal(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div>
      {/* Header */}
      <header style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          Inbox
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Capture and triage everything here.
        </p>
      </header>

      {/* Main card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Capture bar */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Capture a task, idea, or note…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-primary)',
            }}
          />
          {inputValue.trim() && (
            <button
              onClick={handleAdd}
              style={{
                padding: '6px 14px',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Add
            </button>
          )}
        </div>

        {/* Active items or empty state */}
        {activeItems.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '64px 32px',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <InboxIcon size={28} style={{ color: 'var(--text-muted)' }} />
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                margin: 0,
              }}
            >
              Inbox zero
            </h2>
            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                maxWidth: '320px',
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Everything captured here is ready to be triaged into a project or scheduled for
              a day.
            </p>
          </div>
        ) : (
          <div>
            {activeItems.map((item, i) => (
              <ItemRow
                key={item.id}
                item={item}
                isLast={i === activeItems.length - 1 && archivedItems.length === 0}
                onArchive={() => handleArchive(item.id)}
                onAssign={() => {
                  setAssignModal({ itemId: item.id });
                  setScheduleModal(null);
                }}
                onSchedule={() => {
                  setScheduleModal({ itemId: item.id });
                  setAssignModal(null);
                  setScheduleDateStr(toDateStr(new Date()));
                }}
              />
            ))}
          </div>
        )}

        {/* Archived section */}
        {archivedItems.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setShowArchived(!showArchived)}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '12px',
                fontWeight: 500,
                textAlign: 'left',
                fontFamily: 'var(--font-primary)',
              }}
            >
              {showArchived ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Archived ({archivedItems.length})
            </button>
            {showArchived && (
              <div>
                {archivedItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 20px',
                      borderTop: '1px solid var(--border-subtle)',
                      opacity: 0.55,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: 'line-through',
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                        }}
                      >
                        {formatTime(item.createdAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(item.id)}
                      title="Restore"
                      style={{
                        background: 'none',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-md)',
                        transition: 'color 150ms ease, border-color 150ms ease',
                        fontFamily: 'var(--font-primary)',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--accent)';
                        e.currentTarget.style.borderColor = 'var(--accent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-muted)';
                        e.currentTarget.style.borderColor = 'var(--border)';
                      }}
                    >
                      <RotateCcw size={11} />
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign to Project modal */}
      {assignModal && (
        <ModalOverlay onClose={() => setAssignModal(null)}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              minWidth: '260px',
              maxWidth: '320px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
              }}
            >
              Assign to Project
            </h3>
            {projects.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                No projects found.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {projects.map((p: any) => (
                  <button
                    key={p.id}
                    onClick={() => handleAssign(assignModal.itemId, p.id)}
                    style={{
                      padding: '9px 12px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      textAlign: 'left',
                      transition: 'border-color 150ms ease, background 150ms ease',
                      fontFamily: 'var(--font-primary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setAssignModal(null)}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '7px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-primary)',
              }}
            >
              Cancel
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* Schedule modal */}
      {scheduleModal && (
        <ModalOverlay onClose={() => setScheduleModal(null)}>
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              minWidth: '240px',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 16px',
              }}
            >
              Schedule for
            </h3>
            <input
              type="date"
              value={scheduleDateStr}
              onChange={(e) => setScheduleDateStr(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                colorScheme: 'dark',
                fontFamily: 'var(--font-primary)',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button
                onClick={() => handleSchedule(scheduleModal.itemId)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Schedule
              </button>
              <button
                onClick={() => setScheduleModal(null)}
                style={{
                  padding: '8px 14px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-primary)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// ── ItemRow ────────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: InboxItem;
  isLast: boolean;
  onArchive: () => void;
  onAssign: () => void;
  onSchedule: () => void;
}

function ItemRow({ item, isLast, onArchive, onAssign, onSchedule }: ItemRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 20px',
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 150ms ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
          {formatTime(item.createdAt)}
        </div>
      </div>

      {/* Triage actions — visible on hover */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 150ms ease',
          flexShrink: 0,
        }}
      >
        <TriageBtn title="Schedule" onClick={onSchedule}>
          <Calendar size={13} />
        </TriageBtn>
        <TriageBtn title="Assign to Project" onClick={onAssign}>
          <FolderOpen size={13} />
        </TriageBtn>
        <TriageBtn title="Archive" onClick={onArchive} danger>
          <Archive size={13} />
        </TriageBtn>
      </div>
    </div>
  );
}

// ── TriageBtn ─────────────────────────────────────────────────────────────────

function TriageBtn({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-muted)',
        padding: '5px 7px',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        lineHeight: 0,
        transition: 'color 150ms ease, background 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = danger ? 'var(--error)' : 'var(--accent)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--text-muted)';
        e.currentTarget.style.background = 'none';
      }}
    >
      {children}
    </button>
  );
}

// ── ModalOverlay ──────────────────────────────────────────────────────────────

function ModalOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}
