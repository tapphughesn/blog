import { useState } from 'react';

function newTarget() {
  return Math.floor(Math.random() * 101);
}

type Hint = 'too-low' | 'too-high' | 'correct';

interface Guess {
  value: number;
  hint: Hint;
}

function GuessingGame() {
  const [target, setTarget] = useState(newTarget);
  const [input, setInput] = useState('');
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [validationError, setValidationError] = useState('');

  function reset() {
    setTarget(newTarget());
    setInput('');
    setGuesses([]);
    setValidationError('');
  }

  function submit() {
    const n = Number(input);
    if (!input.trim() || !Number.isInteger(n) || n < 0 || n > 100) {
      setValidationError('Please enter a whole number between 0 and 100.');
      return;
    }
    setValidationError('');
    const hint: Hint = n < target ? 'too-low' : n > target ? 'too-high' : 'correct';
    setGuesses(prev => [...prev, { value: n, hint }]);
    setInput('');
  }

  const won = guesses.at(-1)?.hint === 'correct';

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 320, padding: '1rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#374151' }}>
        Guess the hidden number between <strong>0</strong> and <strong>100</strong>.
      </div>

      {!won && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <input
            type="number"
            min={0}
            max={100}
            value={input}
            onChange={e => { setInput(e.target.value); setValidationError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Your guess"
            style={{ flex: 1, padding: '0.4rem 0.5rem', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '1rem' }}
          />
          <button
            onClick={submit}
            style={{ padding: '0.4rem 0.9rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '1rem' }}
          >
            Guess
          </button>
        </div>
      )}

      {validationError && (
        <div style={{ color: 'red', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{validationError}</div>
      )}

      {guesses.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {guesses.map((g, i) => (
            <li key={i} style={{ fontSize: '0.875rem', color: g.hint === 'correct' ? '#16a34a' : '#374151' }}>
              <strong>{g.value}</strong> —{' '}
              {g.hint === 'too-low' ? '⬆ Too low' : g.hint === 'too-high' ? '⬇ Too high' : '🎉 Correct!'}
            </li>
          ))}
        </ul>
      )}

      {won && (
        <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#16a34a' }}>
          You got it in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
        </div>
      )}

      <button
        onClick={reset}
        style={{ fontSize: '0.8rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
      >
        New game
      </button>
    </div>
  );
}

export default function comp02() {
  return (
    <div className="blog-post-interactive-component">
      <GuessingGame />
    </div>
  );
}
