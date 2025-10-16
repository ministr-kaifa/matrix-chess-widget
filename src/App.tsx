import { useState } from 'react';
import ChessGameManager from './components/ChessGameManager';
import Header from './components/Header';
import TokenPrompt from './components/TokenPrompt';
import { WidgetParamsProvider } from './context/WidgetParametersContext';
import { clearToken, getToken } from './utils/tokenStorage';

export default function App() {
  const [token, setToken] = useState<string | null>(getToken());
  
  function handleLogout() {
    clearToken();
    setToken(null);
  }
  
  if (!token) {
    return <TokenPrompt onTokenSet={() => setToken(getToken())} />;
  }
  
  return (
    <WidgetParamsProvider>
      <div>
        <Header onLogout={() => handleLogout()}/>
        <ChessGameManager apiToken={token}/>
      </div>
    </WidgetParamsProvider>
  );
}
