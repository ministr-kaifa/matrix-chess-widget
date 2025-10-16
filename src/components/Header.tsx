import { useWidgetParams } from '../context/WidgetParametersContext';
import './Header.css';

type HeaderProps = {
  onLogout: () => void;
};

export default function Header({ onLogout }: HeaderProps) {
  const params = useWidgetParams();

  return (
    <header className="header">
      <button onClick={onLogout} className="logout-btn">
        <img src={params.avatarUrl} alt="avatar" className="avatar" />
        Очистить токен
      </button>
    </header>
  );
}
