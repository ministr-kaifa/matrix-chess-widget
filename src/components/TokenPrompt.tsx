import { useState } from 'react';
import { setToken } from '../utils/tokenStorage';

export default function TokenPrompt({ onTokenSet }: { onTokenSet: () => void }) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setToken(value.trim());
    onTokenSet();
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-xl">Введите токен вашего аккаунта</h1>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="API Token"
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
          OK
        </button>
      </form>
    </div>
  );
}
