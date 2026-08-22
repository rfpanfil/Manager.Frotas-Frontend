import { useState, useEffect } from 'react';

export default function usePersistedTab(defaultTab, pageName) {
    const key = `abaAtiva_${pageName}`;
    const [abaAtiva, setAbaAtiva] = useState(() => sessionStorage.getItem(key) || defaultTab);
    useEffect(() => { if (abaAtiva) sessionStorage.setItem(key, abaAtiva); }, [abaAtiva, key]);
    return [abaAtiva, setAbaAtiva];
}
