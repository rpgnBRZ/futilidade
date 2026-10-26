// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyDJS4AI52x-Vx2aTY5HYpf1K4PXW2rUPTM",
  authDomain: "futilidade.firebaseapp.com",
  projectId: "futilidade",
  storageBucket: "futilidade.firebasestorage.app",
  messagingSenderId: "447590614014",
  appId: "1:447590614014:web:c1d88a898f9a081db8b6af",
  measurementId: "G-N5PKCXV6D5"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Variáveis globais usadas pelo app.js
window.auth = firebase.auth();
window.db = firebase.firestore();

// Habilita persistência de sessão (mantém o usuário logado ao recarregar)
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
