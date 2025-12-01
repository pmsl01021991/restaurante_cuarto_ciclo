import '../Styles/Reservaciones.css';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Container from '../Components/Container';
import '../Styles/Comensales.css';
import '../Styles/NumeroCliente.css';
import '../Styles/MesasReservaciones.css';


import { 
  collection, getDocs, addDoc, deleteDoc,
  query, where, doc 
} from "firebase/firestore";
import { db } from "../firebase"; 

function getUserIdentifier(user) {
  if (!user) return null;
  return (
    user.email ||
    user.username ||
    user.name ||
    user.rol ||
    "usuario_sin_id"
  );
}

const mesasDisponibles = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  nombre: `Mesa ${i + 1}`
}));

const horasDisponibles = [
  '12:00','13:00','14:00','15:00','16:00',
  '17:00','18:00','19:00','20:00','21:00','22:00'
];

const Reservaciones = () => {
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [numero, setNumero] = useState('');
  const [comensales, setComensales] = useState('');
  const [mostrarPaso, setMostrarPaso] = useState('mesas');
  const [userName, setUserName] = useState('');
  const [platoSeleccionado, setPlatoSeleccionado] = useState(null);
  const [platosSeleccionados, setPlatosSeleccionados] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMensaje, setToastMensaje] = useState('');
  const [cantidadMesasVisibles, setCantidadMesasVisibles] = useState(8);
  const [reservasHechas, setReservasHechas] = useState([]);
  const [estadoMesas, setEstadoMesas] = useState({});

  const botones = (prevStep, nextStep, habilitado) => (
    <div className="modal-buttons">
      <button onClick={() => setMostrarPaso(prevStep)}>Atrás</button>
      <button 
        disabled={!habilitado}
        onClick={() => setMostrarPaso(nextStep)}
      >
        Siguiente
      </button>
    </div>
  );

  // -------------------------
  // 🔥 Cargar datos desde Firestore
  // -------------------------
  useEffect(() => {
    const cargarDatos = async () => {
      // Usuario logueado
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(getUserIdentifier(user));

        // 🔥 Platos seleccionados del usuario
        const usuarioID = getUserIdentifier(user);
        const q = query(
          collection(db, "platosSeleccionados"),
          where("usuario", "==", usuarioID)
        );

        const snapPlatos = await getDocs(q);
        const platos = snapPlatos.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPlatosSeleccionados(platos);
        setPlatoSeleccionado(platos.length > 0 ? platos[0] : null);
      }

      // 🔥 Traer todas las reservas
      const reservasSnap = await getDocs(collection(db, "reservas"));
      const lista = reservasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setReservasHechas(lista);
      actualizarEstadoMesas(lista);
    };

    cargarDatos();
  }, []);


  // -------------------------
  // 🔥 Actualiza estado cuando cambia fecha/hora
  // -------------------------
  useEffect(() => {
    actualizarEstadoMesas(reservasHechas);
  }, [fechaSeleccionada, horaSeleccionada, reservasHechas]);


  // -------------------------
  //  Ver mesas ocupadas
  // -------------------------
  const actualizarEstadoMesas = (
    reservas,
    fecha = fechaSeleccionada,
    hora = horaSeleccionada
  ) => {
    const nuevoEstado = {};
    const fechaStr = fecha ? fecha.toISOString().split('T')[0] : null;

    mesasDisponibles.forEach(m => {
      const reservasMesa = reservas.filter(r => r.mesa === m.nombre);

      const reservada = reservasMesa.some(r =>
        (!fechaStr || r.fecha === fechaStr) &&
        (!hora || r.hora === hora)
      );

      nuevoEstado[`mesa${m.id}`] = reservada ? 'reservado' : 'disponible';
    });

    setEstadoMesas(nuevoEstado);
  };


  // -------------------------
  //  Confirmar reserva → Firestore
  // -------------------------
  const confirmarReserva = async () => {
    if (!numero.trim()) return alert("Ingresa tu número");

    const fechaStr = fechaSeleccionada?.toISOString().split("T")[0];

    //  Verificar conflicto
    const conflicto = reservasHechas.some(
      (r) =>
        r.mesa === mesaSeleccionada.nombre &&
        r.fecha === fechaStr &&
        r.hora === horaSeleccionada
    );

    if (conflicto) {
      mostrarToast("⚠️ Esta mesa ya está reservada en ese horario.");
      return;
    }

    // 🔥 Crear registro
    const nuevaReserva = {
      cliente: getUserIdentifier(JSON.parse(localStorage.getItem("user"))),
      plato: platosSeleccionados.map(p => p.nombre).join(", "),
      mesa: mesaSeleccionada.nombre,
      fecha: fechaStr,
      hora: horaSeleccionada,
      numero,
      comensales
    };

    // 🔥 Guardar en Firestore
    const docRef = await addDoc(collection(db, "reservas"), nuevaReserva);

    // Actualizar estado local
    const nuevas = [...reservasHechas, { id: docRef.id, ...nuevaReserva }];
    setReservasHechas(nuevas);
    actualizarEstadoMesas(nuevas);
    mostrarToast("✅ Reservación confirmada.");

    //  Borrar platos seleccionados en Firestore
    for (const p of platosSeleccionados) {
      await deleteDoc(doc(db, "platosSeleccionados", p.id));
    }

    setPlatosSeleccionados([]);
    setPlatoSeleccionado(null);

    // Limpiar pasos
    setMostrarPaso("mesas");
    setNumero("");
    setMesaSeleccionada(null);
    setHoraSeleccionada("");
    setFechaSeleccionada(null);
    setComensales("");
  };


  const mostrarToast = (mensaje) => {
    setToastMensaje(mensaje);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };



  return (
    <>
      <section className="reservation-section" style={{ paddingBottom: '120px' }}>
            <Container>
              <h2 className="menu-title">Reserva tu mesa</h2>
              <p className="section-text">Selecciona una mesa disponible para continuar con tu reservación.</p>

              {mostrarPaso === 'mesas' && (
                <>
                  <ul className="mesa-list">
                    {mesasDisponibles.slice(0, cantidadMesasVisibles).map(mesa => {
                      const estado = estadoMesas[`mesa${mesa.id}`];
                      const reservaMesa = reservasHechas.find(r => r.mesa === mesa.nombre);

                      return (
                        <li
                          key={mesa.id}
                          className={`mesa-item ${estado}`}
                          onClick={() => {
                            if (!platoSeleccionado && platosSeleccionados.length === 0) {
                              mostrarToast('⚠️ Selecciona tu plato antes de hacer una reservación.');
                              return;
                            }
                            setMesaSeleccionada(mesa);
                            setMostrarPaso('fecha');
                          }}

                        >
                          <h3>{mesa.nombre}</h3>
                          <p className={`estado-label ${estado}`}>
                            {reservasHechas.some(r => r.mesa === mesa.nombre)
                              ? 'Disponible en algunos horarios'
                              : 'Disponible en todos los horarios'}
                          </p>
                          {estado === 'reservado' && (
                            <div className="info-reservas">
                              {reservasHechas
                                .filter(r => r.mesa === mesa.nombre)
                                .slice(0, 2)  
                                .map((r, index) => (
                                  <div key={index} className="reserva-info-item">
                                    <strong>{r.cliente === userName ? 'Tú' : r.cliente}</strong>
                                    <span>{r.fecha} - {r.hora}</span>
                                  </div>
                              ))}

                              {reservasHechas.filter(r => r.mesa === mesa.nombre).length > 2 && (
                                <div className="reserva-info-item">
                                  +{reservasHechas.filter(r => r.mesa === mesa.nombre).length - 2} más
                                </div>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {cantidadMesasVisibles < mesasDisponibles.length && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button
                        onClick={() => setCantidadMesasVisibles(prev => prev + 8)}
                        className="mostrar-mas-btn"
                      >
                        Mostrar más mesas
                      </button>
                    </div>
                  )}
                </>
              )}

              {mostrarPaso === 'fecha' && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Selecciona una fecha</h3>
                    <DatePicker
                      selected={fechaSeleccionada}
                      onChange={(fecha) => setFechaSeleccionada(fecha)}
                      minDate={new Date()}
                      inline
                    />
                    {botones('mesas', 'hora', !!fechaSeleccionada)}
                  </div>
                </div>
              )}

              {mostrarPaso === 'hora' && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Selecciona una hora</h3>
                    <select onChange={(e) => setHoraSeleccionada(e.target.value)} defaultValue="">
                      <option disabled value="">Seleccionar hora</option>
                      {horasDisponibles.map(hora => (
                        <option key={hora} value={hora}>{hora}</option>
                      ))}
                    </select>
                    {botones('fecha', 'numero', !!horaSeleccionada)}
                  </div>
                </div>
              )}

              {mostrarPaso === 'numero' && ( 
                <div className="modal-overlay">
                  <div className="modal-content numero-modal">
                    <h3>Ingresa tu número de celular</h3>
                    <input
                      type="tel"
                      maxLength={9}
                      value={numero}
                      onChange={(e) => {
                        const valor = e.target.value;
                        // Solo números
                        if (/^\d*$/.test(valor)) {
                          setNumero(valor);
                        }
                      }}
                      placeholder="Número de celular"
                      required
                      className="numero-input"
                    />

                    {/* Mensaje de error si el número no cumple */}
                    {numero.length > 0 && (numero.length < 9 || !numero.startsWith('9')) && (
                      <p className="error-mensaje">
                        Completa el número de 9 dígitos empezando por "9"
                      </p>
                    )}

                    {/* Botones: solo permite avanzar si cumple las condiciones */}
                    {botones('hora', 'comensales', numero.length === 9 && numero.startsWith('9'))}
                  </div>
                </div>
              )}




              {mostrarPaso === 'comensales' && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>¿Cuántos comensales asistirán?</h3>
                    
                    <select
                      className="comensales-select"
                      value={comensales}
                      onChange={(e) => setComensales(e.target.value)}
                      required
                      aria-label="Seleccionar número de comensales"
                    >
                      <option value="" disabled>Seleccionar número de personas</option>
                      {Array.from({ length: 8 }, (_, i) => {
                        const numero = i + 1;
                        return (
                          <option key={numero} value={numero}>
                            {numero} {numero === 1 ? 'persona' : 'personas'}
                          </option>
                        );
                      })}
                    </select>

                    {botones('numero', 'confirmar', !!comensales)}
                  </div>
                </div>
              )}



              {mostrarPaso === 'confirmar' && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3>Resumen de Reservación</h3>
                    <p><strong>Nombre:</strong> {userName}</p>
                    <p><strong>Plato seleccionado:</strong> {platoSeleccionado?.nombre || 'Ninguno'}</p>
                    <p><strong>Platos adicionales:</strong> {
                      platosSeleccionados.length > 1
                        ? platosSeleccionados
                              .slice(1) // excluye el primer plato
                              .map(p => p.nombre)
                              .join(', ')
                        : 'Ninguno'
                    }</p>
                    <p><strong>Mesa:</strong> {mesaSeleccionada?.nombre}</p>
                    <p><strong>Fecha:</strong> {fechaSeleccionada?.toLocaleDateString()}</p>
                    <p><strong>Hora:</strong> {horaSeleccionada}</p>
                    <p><strong>Número:</strong> {numero}</p>
                    <p><strong>Comensales:</strong> {comensales}</p>
                    <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                      <button onClick={() => setMostrarPaso('numero')}>Volver</button>
                      <button onClick={confirmarReserva}>Confirmar</button>
                    </div>
                  </div>
                </div>
              )}
            </Container>
          </section>

          {toastVisible && (
            <div className="toast-reserva show">
              {toastMensaje}
            </div>
          )}
        </>
      );
};

export default Reservaciones;
