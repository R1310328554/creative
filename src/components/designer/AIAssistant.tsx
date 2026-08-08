import { useEffect, useRef, useState } from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { AI_QUICK_PROMPTS, AI_REFINE_PROMPTS } from '../../engine/ai';
import { useDesignerStore } from '../../store/designerStore';

export function AIAssistant() {
  const showAI = useDesignerStore((s) => s.showAI);
  const messages = useDesignerStore((s) => s.aiMessages);
  const loading = useDesignerStore((s) => s.aiLoading);
  const askAI = useDesignerStore((s) => s.askAI);
  const clearAI = useDesignerStore((s) => s.clearAI);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!showAI) return null;

  const submit = async () => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setText('');
    await askAI(prompt);
  };

  return (
    <aside className="ai-panel">
      <div className="panel__head">
        <h3>
          <Sparkles size={14} style={{ marginRight: 6, display: 'inline' }} />
          AI 助手
        </h3>
        <button type="button" className="btn btn--icon" style={{ color: '#d7fff4' }} onClick={clearAI} title="清空对话">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="ai-messages">
        {messages.map((m) => (
          <div key={m.id} className={`ai-msg ai-msg--${m.role}`}>
            {m.content}
            {m.mode && (
              <div className="ai-msg__meta">{m.mode === 'refine' ? '局部细化' : '整页生成'}</div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {loading && <div className="ai-loading">正在理解并生成…</div>}
      <div className="ai-quick">
        <div className="ai-quick__label">生成</div>
        {AI_QUICK_PROMPTS.slice(0, 4).map((p) => (
          <button key={p} type="button" className="ai-chip" onClick={() => askAI(p)} disabled={loading}>
            {p}
          </button>
        ))}
        <div className="ai-quick__label">细化</div>
        {AI_REFINE_PROMPTS.map((p) => (
          <button key={p} type="button" className="ai-chip ai-chip--soft" onClick={() => askAI(p)} disabled={loading}>
            {p}
          </button>
        ))}
      </div>
      <div className="ai-composer">
        <input
          className="ai-input"
          placeholder="生成整页，或说「增加手机号字段」细化"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
        />
        <button type="button" className="btn btn--accent" onClick={() => void submit()} disabled={loading}>
          生成
        </button>
      </div>
    </aside>
  );
}
