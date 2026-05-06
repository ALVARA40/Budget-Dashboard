import { useState } from 'react';
import { Icon } from './Icon';

interface Category {
  id: string;
  name: string;
  kind: 'income' | 'need' | 'want' | 'savings';
  color: string;
}

interface Props {
  onClose: () => void;
  categories: Category[];
  onSave: (entry: {
    date: string;
    description: string;
    amount: number;
    categoryName: string;
    kind: string;
    method: string;
  }) => void;
}

type EntryType = 'expense' | 'income' | 'savings';

export function AddEntryModal({ onClose, categories, onSave }: Props) {
  const [type, setType]               = useState<EntryType>('expense');
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [category, setCategory]       = useState('');
  const [method, setMethod]           = useState('card');

  // Filter categories by selected tab
  const categoryOptions =
    type === 'income'  ? categories.filter(c => c.kind === 'income')  :
    type === 'savings' ? categories.filter(c => c.kind === 'savings') :
    categories.filter(c => c.kind === 'need' || c.kind === 'want');

  const kindFor = (name: string): string => {
    const cat = categories.find(c => c.name === name);
    return cat ? cat.kind : 'want';
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !category) return;
    const raw    = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    const signed = type === 'income' ? Math.abs(raw) : -Math.abs(raw);
    onSave({ date, description, amount: signed, categoryName: category, kind: kindFor(category), method });
    onClose();
  }

  // Group expense categories into Needs / Wants sections
  const needCats = categoryOptions.filter(c => c.kind === 'need');
  const wantCats = categoryOptions.filter(c => c.kind === 'want');

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Add entry</div>
          <button onClick={onClose} style={{ color: 'var(--ink-muted)', cursor: 'pointer' }}>
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Type tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {(['expense', 'income', 'savings'] as EntryType[]).map(t => (
            <button key={t} onClick={() => { setType(t); setCategory(''); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 999, border: '1px solid var(--line)',
              background: type === t ? 'var(--brand)' : 'var(--bg)',
              color: type === t ? '#fff' : 'var(--ink-soft)',
              fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DATE</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>DESCRIPTION</label>
            <input className="input" type="text" placeholder="e.g. Whole Foods Market" value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>AMOUNT (USD)</label>
            <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>CATEGORY</label>
            <select className="input" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select category…</option>
              {type === 'expense' ? (
                <>
                  {needCats.length > 0 && (
                    <optgroup label="── Needs">
                      {needCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                  {wantCats.length > 0 && (
                    <optgroup label="── Wants">
                      {wantCats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                </>
              ) : (
                categoryOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)
              )}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)', display: 'block', marginBottom: 6 }}>PAYMENT METHOD</label>
            <select className="input" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="card">Card</option>
              <option value="transfer">Transfer</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px 0', borderRadius: 10, border: '1px solid var(--line)',
              background: 'var(--bg)', color: 'var(--ink-soft)', fontWeight: 600, cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center', borderRadius: 10 }}>
              Save entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
