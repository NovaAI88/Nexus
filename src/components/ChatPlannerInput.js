import { useState, useCallback, useRef, useEffect } from 'react';
import { parseChatInput } from '../core/chat/chatParser';

const BLOCK_TYPE_COLORS = {
  work: '#7b8cff',
  fitness: '#34d399',
  meal: '#eab308',
  break: '#94a3b8',
  recovery: '#a78bfa',
  life: '#f472b6',
};

const HISTORY_KEY = 'nexus:chat-history';
const MAX_HISTORY = 5;

function ChatPlannerInput({ date, currentMinutes, freeGaps, onAddBlock }) {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState(null); // { blocks, errors }
  const [confirmed, setConfirmed] = useState(false);
  const inputRef = useRef(null);

  const handleParse = useCallback(() => {
    if (!input.trim()) return;
    const result = parseChatInput(input, { date, currentMinutes, freeGaps });

    if (result.meta === 'plan-day') {
      // Meta command: trigger engine auto-plan (handled by parent)
      setPreview({ blocks: [], errors: ['Auto-plan coming soon. Try specific blocks like "3h vortex, gym, dinner at 7"'] });
      return;
    }

    setPreview(result);
    setConfirmed(false);
  }, [input, date, currentMinutes, freeGaps]);

  const handleConfirm = useCallback(() => {
    if (!preview?.blocks.length) return;
    for (const block of preview.blocks) {
      onAddBlock(date, {
        type: block.type,
        label: block.label,
        start: block.start,
        end: block.end,
      });
    }
    // Save to history
    try {
      const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const updated = [input, ...history.filter((h) => h !== input)].slice(0, MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch { /* ignore */ }

    setConfirmed(true);
    setTimeout(() => {
      setInput('');
      setPreview(null);
      setConfirmed(false);
    }, 1200);
  }, [preview, onAddBlock, date, input]);

  const handleClear = useCallback(() => {
    setInput('');
    setPreview(null);
    setConfirmed(false);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (preview?.blocks.length > 0 && !confirmed) {
        handleConfirm();
      } else {
        handleParse();
      }
    }
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleParse, handleConfirm, handleClear, preview, confirmed]);

  // Focus input on mount
  useEffect(() => {
    // Don't auto-focus on mount to avoid stealing focus from other inputs
  }, []);

  return (
    <div className="chat-planner">
      <div className="chat-planner-header">
        <span className="chat-planner-icon">~</span>
        <span className="chat-planner-title">Plan</span>
      </div>
      <div className="chat-planner-input-wrap">
        <input
          ref={inputRef}
          className="chat-planner-input"
          type="text"
          placeholder='e.g. "3h vortex, gym, dinner at 7"'
          value={input}
          onChange={(e) => { setInput(e.target.value); setPreview(null); setConfirmed(false); }}
          onKeyDown={handleKeyDown}
        />
        {input && (
          <button className="chat-planner-parse-btn" onClick={handleParse} type="button">
            Parse
          </button>
        )}
      </div>

      {/* Preview pills */}
      {preview && preview.blocks.length > 0 && (
        <div className="chat-preview">
          <div className="chat-preview-pills">
            {preview.blocks.map((block) => (
              <div
                key={block.id}
                className="chat-preview-pill"
                style={{ '--pill-color': BLOCK_TYPE_COLORS[block.type] || '#7b8cff' }}
              >
                <span className="chat-pill-time">{block.start}–{block.end}</span>
                <span className="chat-pill-label">{block.label}</span>
                <span className="chat-pill-type">{block.type}</span>
              </div>
            ))}
          </div>
          <div className="chat-preview-actions">
            {confirmed ? (
              <span className="chat-confirmed-msg">Scheduled!</span>
            ) : (
              <>
                <button className="chat-confirm-btn" onClick={handleConfirm} type="button">
                  Confirm ({preview.blocks.length} block{preview.blocks.length > 1 ? 's' : ''})
                </button>
                <button className="chat-clear-btn" onClick={handleClear} type="button">
                  Clear
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Errors */}
      {preview && preview.errors.length > 0 && (
        <div className="chat-errors">
          {preview.errors.map((err, i) => (
            <span key={i} className="chat-error">{err}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatPlannerInput;
