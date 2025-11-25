// Importa firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración (la que pegaste, está PERFECTA)
const firebaseConfig = {
  apiKey: "AIzaSyATaYQATVbrs4SVBemPk3JD9Ap-8clZVe4",
  authDomain: "restaurante-final-7ccf8.firebaseapp.com",
  projectId: "restaurante-final-7ccf8",
  storageBucket: "restaurante-final-7ccf8.firebasestorage.app",
  messagingSenderId: "528554960600",
  appId: "1:528554960600:web:679daaa366c019c907d9ad"
};

// Inicializar firebase
const app = initializeApp(firebaseConfig);

// Exportar Firestore para usarlo en cualquier componente
export const db = getFirestore(app);
