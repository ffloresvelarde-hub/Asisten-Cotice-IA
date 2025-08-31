// --- INICIO DEL SCRIPT DE DIAGNÓSTICO ---
try {
  // FIX: Cast window to any to access non-standard 'process' property injected by Netlify.
  const key = (window as any).process?.env?.API_KEY;
  if (!key) {
    alert("DIAGNÓSTICO (Paso 1 de 2): La API Key NO fue encontrada. Esto significa que el script de 'Snippet Injection' de Netlify no está funcionando. Por favor, revisa CUIDADOSAMENTE la configuración en 'Build & deploy' > 'Post processing'.");
  } else if (!key.startsWith('AIza')) {
    // FIX: Corrected typo in alert message.
    alert("DIAGNÓSTICO (Paso 2 de 2): La API Key FUE ENCONTRADA, pero parece tener un formato incorrecto (no empieza con 'AIza'). Por favor, asegúrate de haber copiado y pegado la clave COMPLETA y correcta en las 'Environment variables' de Netlify.");
  }
} catch (e) {
  // Esto es un seguro, es poco probable que se ejecute.
  alert("DIAGNÓSTICO: Ocurrió un error inesperado al verificar la API Key. Revisa la consola del navegador.");
}
// --- FIN DEL SCRIPT DE DIAGNÓSTICO ---

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);