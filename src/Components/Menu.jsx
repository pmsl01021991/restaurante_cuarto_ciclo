import '../Styles/Menu.css';
import Container from './Container';
import { useState, useEffect } from 'react';

// Firestore
import { collection, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";   // <-- este es tu Firestore REAL
import { comprimirImagen } from "../utils/imagenUtils";

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categoria, setCategoria] = useState("comidas");
  const [mensaje, setMensaje] = useState('');
  const [mostrarToast, setMostrarToast] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  //  Obtener platos desde Firestore
  useEffect(() => {
    const obtenerPlatos = async () => {
      try {
        const platosRef = collection(db, "platos");
        const snapshot = await getDocs(platosRef);

        const listaPlatos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setMenuItems(listaPlatos);
      } catch (error) {
        console.error('Error al obtener platos de Firestore:', error);
      }
    };

    obtenerPlatos();
  }, []);

  //  Función para elegir un plato
  const handleElegirPlato = async (plato) => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
      alert("Debes iniciar sesión primero");
      return;
    }

    // Tomar un identificador válido del usuario
    const usuarioID = user.name || user.username || user.email || user.usuario;

    if (!usuarioID) {
      alert("Error: el usuario no tiene un identificador válido");
      return;
    }

    const platoConUsuario = {
      nombre: plato.nombre,
      precio: plato.precio,
      categoria: plato.categoria,
      imagen: plato.imagenBase64 || plato.imagen,
      usuario: usuarioID,
      fecha: new Date()
    };

    try {
      const platosSelRef = collection(db, "platosSeleccionados");
      await addDoc(platosSelRef, platoConUsuario);

      // Guardar localmente
      const platosLocal = JSON.parse(localStorage.getItem('platosSeleccionados')) || [];
      platosLocal.push(platoConUsuario);
      localStorage.setItem('platosSeleccionados', JSON.stringify(platosLocal));

      setMensaje(`🍽️ ${plato.nombre} agregado a tu reservación`);
      setMostrarToast(true);
      setTimeout(() => setMostrarToast(false), 3000);

    } catch (error) {
      console.error('Error guardando plato en Firestore:', error);
      alert('No se pudo guardar el plato. Intenta de nuevo.');
    }
  };

  const editarImagen = async (plato) => {

    const input = document.createElement("input");

    input.type = "file";
    input.accept = "image/*";

    input.onchange = async (evento) => {

      const archivo = evento.target.files?.[0];

      if (!archivo) return;

      try {

        const base64 = await comprimirImagen(
          archivo
        );

        await updateDoc(
          doc(db, "platos", plato.id),
          {
            imagenBase64: base64
          }
        );

        setMenuItems((actuales) =>
          actuales.map((item) =>
            item.id === plato.id
              ? { ...item, imagenBase64: base64 }
              : item
          )
        );

        setMensaje(
          `🖼️ Imagen de ${plato.nombre} actualizada`
        );

        setMostrarToast(true);

        setTimeout(
          () => setMostrarToast(false),
          3000
        );

      } catch (error) {

        console.error(
          "Error actualizando imagen:",
          error
        );

        alert(
          "No se pudo actualizar la imagen."
        );

      }
    };

    input.click();
  };


  return (
    <section id="menu" className="menu-section">
      <Container>
        <h2 className="menu-title">Nuestro Menú</h2>
        <p className='menu-subtitle'>
          Descubre nuestros platos más populares, preparados con ingredientes frescos y técnicas tradicionales
        </p>

        <div className="menu-categorias">

          <button
            className={categoria === "comidas" ? "categoria-activa" : ""}
            onClick={() => setCategoria("comidas")}
          >
            🍔 Comidas
          </button>

          <button
            className={categoria === "bebidas" ? "categoria-activa" : ""}
            onClick={() => setCategoria("bebidas")}
          >
            🥤 Bebidas
          </button>

          <button
            className={categoria === "postres" ? "categoria-activa" : ""}
            onClick={() => setCategoria("postres")}
          >
            🍰 Postres
          </button>

        </div>

        <ul className="menu-list">
          {menuItems
            .filter(
              item => item.categoria?.toLowerCase().trim() === categoria
            )
            .map((item, index) => (
            <li key={index} className="menu-item">
              <img
                src={item.imagenBase64 || item.imagen}
                alt={item.nombre}
                className="menu-image"
              />
              <h3>{item.nombre}</h3>
              <p>{item.descripcion}</p>
              <span>{item.precio}</span>

              {user?.rol === "admin" && (
                <button
                  className="edit-image-button"
                  onClick={() => editarImagen(item)}
                >
                  🖼️ Editar imagen
                </button>
              )}

              <button
                className="add-button"
                onClick={() => handleElegirPlato(item)}
              >
                Agregar a reservación
              </button>
            </li>
          ))}
        </ul>
      </Container>

      {mostrarToast && (
        <div className="plato-toast">
          {mensaje}
          <button onClick={() => setMostrarToast(false)}>✖</button>
        </div>
      )}
    </section>
  );
};

export default Menu;
