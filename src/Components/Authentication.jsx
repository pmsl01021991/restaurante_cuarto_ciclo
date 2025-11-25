import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useState } from 'react';
import '../Styles/Authentication.css';
import { ChefHat, User, X } from 'lucide-react';
import '../Styles/Login.css';

const Authentication = ({ onClose }) => {
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const [password1, setPassword1] = useState('');
   const [password2, setPassword2] = useState('');
   const [error, setError] = useState('');
   const [showRegister, setShowRegister] = useState(false);
   const [termsAccepted, setTermsAccepted] = useState(false);

   // VALIDAR EMAIL
   const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

   // VALIDAR PASSWORD
   const validarPassword = (pass) =>
      /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{6,}$/.test(pass);

   const mostrarToast = (mensaje, tipo = 'success') => {
      const toast = document.getElementById('toast');
      toast.textContent = mensaje;
      toast.className = `toast show ${tipo}`;
      setTimeout(() => (toast.className = 'toast'), 3000);
   };

   // LOGIN
   const handleLogin = async (e) => {
      e.preventDefault();

      if (!validarEmail(username)) {
         setError('Correo inválido.');
         return;
      }

      if (!validarPassword(password)) {
         setError('Contraseña inválida.');
         return;
      }

      try {
         const q = query(
            collection(db, "usuarios"),
            where("username", "==", username),
            where("password", "==", password)
         );

         const querySnapshot = await getDocs(q);

         if (querySnapshot.empty) {
            setError('Credenciales incorrectas.');
            return;
         }

         const usuario = querySnapshot.docs[0].data();

         const nombreLimpio = usuario.username
            .split('@')[0]
            .replace(/\d+/g, '')
            .replace(/\.+$/, '');

         const user = {
            name: nombreLimpio,
            rol: usuario.username === 'admin@gmail.com' ? 'admin' : 'cliente'
         };

         localStorage.setItem('user', JSON.stringify(user));
         window.dispatchEvent(new Event('userLoggedIn'));
         onClose();
         window.location.href = '/';

      } catch (error) {
         console.error("Error login:", error);
         setError('Error de conexión.');
      }
   };

   // REGISTER
   const handleRegister = async (e) => {
      e.preventDefault();

      if (!validarEmail(username)) {
         mostrarToast('Correo inválido.', 'error');
         return;
      }

      if (!validarPassword(password1)) {
         mostrarToast('Contraseña inválida.', 'error');
         return;
      }

      if (password1 !== password2) {
         mostrarToast('Las contraseñas no coinciden.', 'error');
         return;
      }

      try {
         const usuariosRef = collection(db, "usuarios");
         const q = query(usuariosRef, where("username", "==", username));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty) {
            mostrarToast('Este correo ya está registrado.', 'error');
            return;
         }

         await addDoc(usuariosRef, {
            username,
            password: password1,
            rol: "cliente"
         });

         mostrarToast('Usuario registrado correctamente.', 'success');
         setUsername('');
         setPassword1('');
         setPassword2('');
         setError('');
         setShowRegister(false);

      } catch (error) {
         console.error("Error register:", error);
         mostrarToast('Error al registrar usuario.', 'error');
      }
   };

   return (
      <article className="login-wrapper">
         {!showRegister ? (
            // LOGIN
            <div className='login-container'>
               <div className='login-close-button' onClick={onClose}>
                  <X size={20} />
               </div>

               <section className='login-header'>
                  <div className='login-icon-container'>
                     <ChefHat className='login-icon' />
                  </div>
                  <h2 className='login-title'>Iniciar Sesión</h2>
               </section>

               <section className='login-form'>
                  <label>Correo Electrónico</label>
                  <input
                     type="text"
                     placeholder="email@example.com"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                  />

                  <label>Contraseña</label>
                  <input
                     type="password"
                     placeholder="******"
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                  />

                  {error && <p className='error-message'>{error}</p>}
               </section>

               <section className='actions-section'>
                  <button onClick={handleLogin} className='btn-login'>
                     Iniciar Sesión
                  </button>
                  <button onClick={onClose} className='btn-close'>
                     Cancelar
                  </button>
               </section>

               <section className='switch-auth-section'>
                  <p>
                     ¿No tienes cuenta?
                     <a onClick={() => setShowRegister(true)} className='login-link'>
                        Regístrate aquí
                     </a>
                  </p>
               </section>
            </div>
         ) : (
            // REGISTER
            <div className='login-container'>
               <div className='login-close-button' onClick={onClose}>
                  <X size={20} />
               </div>

               <section className='login-header'>
                  <div className='register-icon-container'>
                     <User className='register-icon' />
                  </div>
                  <h2 className='login-title'>Crear Cuenta</h2>
               </section>

               <section className='login-form'>
                  <label>Correo Electrónico</label>
                  <input
                     type="text"
                     placeholder="email@example.com"
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                  />

                  <label>Contraseña</label>
                  <input
                     type="password"
                     placeholder="******"
                     value={password1}
                     onChange={(e) => setPassword1(e.target.value)}
                  />

                  <label>Confirmar Contraseña</label>
                  <input
                     type="password"
                     placeholder="******"
                     value={password2}
                     onChange={(e) => setPassword2(e.target.value)}
                  />
               </section>

               <section className='terms-section'>
                  <input type="checkbox" onChange={() => setTermsAccepted(!termsAccepted)} />
                  <p>Acepto los términos y condiciones</p>
               </section>

               <section className='actions-section'>
                  <button
                     onClick={handleRegister}
                     className='btn-register'
                     disabled={!termsAccepted}
                  >
                     Crear Cuenta
                  </button>
                  <button onClick={onClose} className='btn-close'>
                     Cancelar
                  </button>
               </section>

               <section className='switch-auth-section'>
                  <p>
                     ¿Ya tienes cuenta?
                     <a onClick={() => setShowRegister(false)} className='login-link'>
                        Inicia sesión
                     </a>
                  </p>
               </section>
            </div>
         )}

         <div id="toast" className="toast"></div>
      </article>
   );
};

export default Authentication;
