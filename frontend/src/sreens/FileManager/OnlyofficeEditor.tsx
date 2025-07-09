// src/pages/OnlyofficeEditor.tsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { OnlyofficeApi, OnlyOfficeConfig } from '../../api/onlyoffice';

declare const DocsAPI: any;

export const OnlyofficeEditor: React.FC = () => {
  const [config, setConfig] = useState<OnlyOfficeConfig | null>(null);
  const qs = new URLSearchParams(useLocation().search);
  const fileKey = qs.get('fileKey')!;
  const fileId   = qs.get('fileId')!;

  useEffect(() => {
    OnlyofficeApi.getConfig(fileKey, fileId)
      .then(setConfig)
      .catch(console.error);
  }, [fileKey, fileId]);

  useEffect(() => {
    if (config) {
      // Динамически подключаем скрипт
      const script = document.createElement('script');
      script.src = `${process.env.REACT_APP_ONLYOFFICE_SERVER_URL}/web-apps/apps/api/documents/api.js`;
      script.onload = () => {
        new DocsAPI.DocEditor('placeholder', config);
      };
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [config]);

  if (!config) {
    return <div>Загрузка редактора…</div>;
  }

  return (
    <div
      id="placeholder"
      style={{ width: '100%', height: '100vh', background: '#fff' }}
    />
  );
};
