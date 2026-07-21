# Login com Google

O botão é renderizado pelo Google Identity Services. O ID token vai diretamente a `signInWithIdToken({ provider: "google" })` e nunca para logs ou `localStorage`. O fallback usa `signInWithOAuth`, callback SSR e PKCE. A flag `whatsapp_manager_google_login` permanece desligada até homologação.
