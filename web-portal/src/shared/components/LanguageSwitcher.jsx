import { useTranslation } from 'react-i18next';
import { LOCALES } from '../../config/constants';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  return (
    <select
      style={{ border:'1px solid #ddd', borderRadius: 8, padding:'4px 8px' }}
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      {LOCALES.map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}
    </select>
  );
}
