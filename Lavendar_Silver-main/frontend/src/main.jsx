import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import LazyGoogleOAuthProvider from './components/LazyGoogleOAuthProvider.jsx';
import './utils/axiosConfig';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LazyGoogleOAuthProvider clientId={clientId}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LazyGoogleOAuthProvider>
  </React.StrictMode>
);
