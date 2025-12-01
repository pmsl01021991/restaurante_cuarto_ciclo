import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../Styles/ReservacionesHechas.css';

import Container from '../Components/Container';
import EditarReservaModal from '../Components/EditarReservaModal';
import ReservasLista from './ReservasLista';

import { db } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

const localizer = momentLocalizer(moment);

const ReservacionesHechas = () => {
  const [eventos, setEventos] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [reservasDelDia, setReservasDelDia] = useState([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null);

  //  Cargar reservas desde Firestore
  const cargarReservas = async () => {
    const querySnapshot = await getDocs(collection(db, "reservas"));
    const reservas = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    const eventosConvertidos = reservas.map(reserva => {
      const fechaHora = moment(`${reserva.fecha} ${reserva.hora}`, 'YYYY-MM-DD HH:mm');
      return {
        id: reserva.id,
        title: `${reserva.mesa} - ${reserva.cliente}`,
        start: fechaHora.toDate(),
        end: fechaHora.clone().add(30, 'minutes').toDate(),
        reserva
      };
    });

    setEventos(eventosConvertidos);
    setReservasDelDia(reservas);
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  //  Cuando seleccionas un día en calendario
  const handleSelectSlot = ({ start }) => {
    const fecha = moment(start).format('YYYY-MM-DD');

    const reservasFiltradas = eventos
      .filter(evento => moment(evento.start).format('YYYY-MM-DD') === fecha)
      .map(evento => evento.reserva);

    setFechaSeleccionada(fecha);
    setReservasDelDia(reservasFiltradas);
  };

  return (
    <section className="reservation-section">
      <Container>
        <h2 className="menu-title">Reservaciones Hechas</h2>
        <p className="section-text">Consulta las reservaciones registradas por fecha.</p>

        <div className="reservation-content">

          {/* Calendario */}
          <div className="rh-calendar-container">
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              selectable
              views={['month']}
              popup
              onSelectSlot={handleSelectSlot}
              onSelectEvent={(event) => handleSelectSlot({ start: event.start })}
            />
          </div>

          {/* Lista de reservas */}
          <ReservasLista
            reservas={reservasDelDia}
            fechaSeleccionada={fechaSeleccionada}
            onSelectReserva={setReservaSeleccionada}
          />
        </div>
      </Container>

      {/* Modal para editar o eliminar */}
      <EditarReservaModal
        reserva={reservaSeleccionada}
        onClose={() => setReservaSeleccionada(null)}
        
        // 🔹 Actualizar reserva en Firestore
        onGuardar={async (reservaActualizada) => {
          await updateDoc(doc(db, "reservas", reservaSeleccionada.id), reservaActualizada);
          cargarReservas();
          setReservaSeleccionada(null);
        }}

        // 🔹 Eliminar reserva en Firestore
        onEliminar={async () => {
          await deleteDoc(doc(db, "reservas", reservaSeleccionada.id));
          cargarReservas();
          setReservaSeleccionada(null);
        }}
      />
    </section>
  );
};

export default ReservacionesHechas;
