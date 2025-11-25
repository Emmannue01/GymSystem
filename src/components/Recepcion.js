import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, UserPlus, RefreshCw, X, ChevronDown, LogOut, QrCode } from 'lucide-react';
import QRScannerModal from './QRScannerModal';
import QRCodeModal from './QRCodeModal';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  orderBy, 
  where,
  limit, 
  getDocs, 
  addDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  ref, 
  query as queryRTDB, 
  orderByChild, 
  limitToLast, 
  get, set 
} from 'firebase/database';

import { db, auth, rtdb as dbRTDB } from '../firebase';

const RecepcionDashboard = () => {
  const [stats, setStats] = useState({
    miembrosActivos: 0,
    tendencia: 0,
    proximasRenovaciones: 0,
    cuentasTotales: 0
  });
  const [nuevosMiembros, setNuevosMiembros] = useState([]);
  const [ultimosAccesos, setUltimosAccesos] = useState([]);
  const [proximasRenovaciones, setProximasRenovaciones] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nuevoMiembro, setNuevoMiembro] = useState({
    uid: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    genero: 'Masculino',
    tipoMembresia: 'Básica',
    fechaInicio: new Date().toISOString().split('T')[0]
  });
  const [renovacion, setRenovacion] = useState({
    userId: '',
    nombreCompleto: '',
    tipoMembresia: 'Básica'
  });

  const [showMyQR, setShowMyQR] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [usuario, setUsuario] = useState({
    nombre: 'Usuario',
    avatar: 'https://i.pravatar.cc/32',
    email: '',
    uid: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "usuarios", user.uid);
        const userDoc = await getDoc(userDocRef);

        let userData = null;
        if (userDoc.exists()) {
          userData = userDoc.data();
        } else {
          const q = query(collection(db, "usuarios"), where("Email", "==", user.email.toLowerCase()));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            userData = querySnapshot.docs[0].data();
          }
        }

        if (userData && (userData.rol === 'recepcion' || userData.rol === 'admin' || userData.rol === 'administrador')) {
          setUsuario({
            nombre: user.displayName || user.email.split('@')[0],
            avatar: user.photoURL || 'https://i.pravatar.cc/32',
            email: user.email,
            uid: user.uid
          });
          await cargarTodosDatos();
        } else {
          console.log("Acceso denegado. Usuario sin rol de recepción.");
          window.location.href = '/';
        }
      } else {
        console.log("Usuario no autenticado");
        window.location.href = '/';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // cargarTodosDatos se define dentro y no necesita ser dependencia

  const cargarTodosDatos = async () => {
    await cargarUsuarios();
    await cargarNuevosMiembros();
    await cargarAsistenciasRealtime();
    await cargarProximasRenovaciones();
  };

  const cargarUsuarios = async () => {
    try {
      const allSnapshot = await getDocs(collection(db, "usuarios"));
      const cuentasTotales = allSnapshot.size;
      let membresiasActivas = 0;
      let membresiasPorVencer = 0;
      
      const hoy = new Date();
      const ochoDiasDespues = new Date();
      ochoDiasDespues.setDate(hoy.getDate() + 8);
      
      allSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.SuscripcionHasta) {
          const fechaFin = data.SuscripcionHasta.toDate();
          if (fechaFin >= hoy) {
            membresiasActivas++;
            if (fechaFin <= ochoDiasDespues) {
              membresiasPorVencer++;
            }
          }
        }
      });

      const tendencia = cuentasTotales > 0 ? Math.round((membresiasActivas / cuentasTotales) * 100) : 0;

      setStats({
        miembrosActivos: membresiasActivas,
        tendencia,
        proximasRenovaciones: membresiasPorVencer,
        cuentasTotales
      });
    } catch (error) {}
  };

  const cargarNuevosMiembros = async () => {
    try {
      const q = query(collection(db, "usuarios"), orderBy("Creado", "desc"), limit(3));
      const querySnapshot = await getDocs(q);

      const miembros = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const nombre = `${data.Nombre || ''} ${data.Apellido || ''}`.trim();
        
        const fechaCreacion = data.Creado ? data.Creado.toDate() : new Date();
        const hoy = new Date();
        const ayer = new Date(hoy.getTime() - (24 * 60 * 60 * 1000));
        
        let textoFecha = `Registrado el ${fechaCreacion.toLocaleDateString('es-ES')}`;
        if (fechaCreacion.toDateString() === hoy.toDateString()) textoFecha = 'Registrado hoy';
        else if (fechaCreacion.toDateString() === ayer.toDateString()) textoFecha = 'Registrado ayer';

        const esNuevo = fechaCreacion.toDateString() === hoy.toDateString();

        miembros.push({
          id: doc.id,
          nombre,
          avatar: data.fotoURL || `https://i.pravatar.cc/40?u=${doc.id}`,
          fecha: textoFecha,
          nuevo: esNuevo
        });
      });

      setNuevosMiembros(miembros);
    } catch (error) {}
  };

  const cargarAsistenciasRealtime = async () => {
    try {
      const uidToName = {};
      const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
      
      usuariosSnapshot.forEach(doc => {
        const data = doc.data();
        const nombreCompleto = `${data.Nombre || ''} ${data.Apellido || ''}`.trim();
        if (data.uid) uidToName[data.uid] = nombreCompleto || data.uid;
        uidToName[doc.id] = nombreCompleto || doc.id;
      });

      const lecturasRef = ref(dbRTDB, 'lecturas');
      const q = queryRTDB(lecturasRef, orderByChild('timestamp'), limitToLast(100));
      const snapshot = await get(q);
      
      if (!snapshot.exists()) {
        setUltimosAccesos([]);
        return;
      }

      const registros = [];
      snapshot.forEach(childSnapshot => {
        registros.push({
          key: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      registros.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB - dateA;
      });

      const registrosAgrupados = {};
      registros.forEach(reg => {
        if (!registrosAgrupados[reg.uid]) {
          registrosAgrupados[reg.uid] = [];
        }
        registrosAgrupados[reg.uid].push(reg);
      });

      const accesos = [];
      Object.entries(registrosAgrupados).forEach(([uid, lecturas]) => {
        const nombre = uidToName[uid] || uid;
        
        for (let i = 0; i < lecturas.length; i++) {
          const entrada = lecturas[i];
          const salida = (i + 1 < lecturas.length) ? lecturas[i + 1] : null;
          
          accesos.push({
            uid,
            nombre,
            entrada: formatearHoraAsistencia(entrada.timestamp),
            salida: salida ? formatearHoraAsistencia(salida.timestamp) : '-'
          });
          
          if (salida) i++;
        }
      });
      setUltimosAccesos(accesos);
    } catch (error) {}
  };

  const formatearHoraAsistencia = (timestamp) => {
    if (!timestamp) return 'OFF-00:00:00';
    
    if (typeof timestamp === 'string' && timestamp.startsWith('OFF-')) {
      return timestamp;
    }
    
    try {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(timestamp)) {
        return timestamp;
      }
      
      const date = new Date(timestamp);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/,/g, '');
    } catch (e) {
      return 'Formato inválido';
    }
  };

  const cargarProximasRenovaciones = async () => {
    try {
      const hoy = new Date();
      const diezDiasDespues = new Date();
      diezDiasDespues.setDate(hoy.getDate() + 10);
      
      const q = query(
        collection(db, "usuarios"),
        where("SuscripcionHasta", ">=", Timestamp.fromDate(hoy)),
        where("SuscripcionHasta", "<=", Timestamp.fromDate(diezDiasDespues)),
        orderBy("SuscripcionHasta", "asc")
      );
      
      const querySnapshot = await getDocs(q);
      const renovaciones = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const fechaFin = data.SuscripcionHasta.toDate();
        const diasRestantes = Math.ceil((fechaFin - hoy) / (1000 * 60 * 60 * 24));
        
        let estado = '';
        let claseEstado = '';
        if (diasRestantes <= 3) {
          estado = 'Por vencer';
          claseEstado = 'bg-red-100 text-red-800';
        } else if (diasRestantes <= 7) {
          estado = 'Próximo a vencer';
          claseEstado = 'bg-yellow-100 text-yellow-800';
        } else {
          estado = 'Vigente';
          claseEstado = 'bg-green-100 text-green-800';
        }
        
        renovaciones.push({
          id: doc.id,
          nombre: `${data.Nombre || ''} ${data.Apellido || ''}`.trim(),
          uid: data.uid || 'Sin ID',
          avatar: data.fotoURL || `https://i.pravatar.cc/40?u=${doc.id}`,
          membresia: data.Tipo || 'Sin tipo',
          vence: fechaFin.toLocaleDateString('es-ES'),
          dias: diasRestantes,
          estado,
          claseEstado
        });
      });
      
      setProximasRenovaciones(renovaciones);
    } catch (error) {}
  };

  const actualizarEstadoActivoEnRTDB = async (uid, fechaFin) => {
    try {
      const memberRef = ref(dbRTDB, `activos/${uid}`);
      await set(memberRef, {
        activo: true,
        suscripcionHasta: fechaFin.getTime()
      });
    } catch (error) {
      throw error;
    }
  };

  const guardarNuevoMiembro = async (e) => {
    e.preventDefault();
    
    const { uid, nombre, apellido, email, telefono, tipoMembresia, genero, fechaInicio } = nuevoMiembro;
    
    if (!nombre || !email || !fechaInicio || !uid) {
      alert('Por favor complete los campos obligatorios: Nombre, Email, Fecha de Inicio y UID');
      return;
    }

    try {
      const fechaFin = new Date(fechaInicio);
      let tipo = "Basica";
      
      if (tipoMembresia.includes('Estándar') || tipoMembresia.includes('Estandar')) {
        tipo = "Estandar";
        fechaFin.setMonth(fechaFin.getMonth() + 3);
      } else if (tipoMembresia.includes('Premium')) {
        tipo = "Premium";
        fechaFin.setMonth(fechaFin.getMonth() + 6);
      } else if (tipoMembresia.includes('VIP')) {
        tipo = "VIP";
        fechaFin.setMonth(fechaFin.getMonth() + 12);
      } else {
        tipo = "Basica";
        fechaFin.setMonth(fechaFin.getMonth() + 1);
      }

      await addDoc(collection(db, "usuarios"), {
        Nombre: nombre,
        Apellido: apellido,
        Email: email.toLowerCase(),
        Telefono: telefono,
        Tipo: tipo,
        Genero: genero,
        Creado: Timestamp.fromDate(new Date()),
        SuscripcionHasta: Timestamp.fromDate(fechaFin),
        rol: "cliente",
        uid: uid
      });

      await actualizarEstadoActivoEnRTDB(uid, fechaFin);

      alert('Miembro guardado exitosamente');
      setShowAddModal(false);
      
      setNuevoMiembro({
        uid: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        genero: 'Masculino',
        tipoMembresia: 'Básica',
        fechaInicio: new Date().toISOString().split('T')[0]
      });
      
      await cargarTodosDatos();
    } catch (err) {
      alert('Error al guardar el miembro: ' + err.message);
    }
  };

  const prepararRenovacion = (userId, nombreCompleto) => {
    setRenovacion({
      userId,
      nombreCompleto,
      tipoMembresia: 'Básica'
    });
    setShowRenewModal(true);
  };

  const renovarMembresia = async (e) => {
    e.preventDefault();
    
    const { userId, tipoMembresia } = renovacion;

    if (!userId || !tipoMembresia) {
      alert('Error: No se ha seleccionado un miembro o tipo de membresía.');
      return;
    }

    try {
      const costosSubscripcion = {};
      const subsSnap = await getDocs(collection(db, 'subscripciones'));
      subsSnap.forEach(doc => {
        const nombre = doc.data().nombre;
        if (nombre.toLowerCase().includes('básica') || nombre.toLowerCase().includes('basica')) 
          costosSubscripcion['Básica'] = doc.data().costo || 0;
        if (nombre.toLowerCase().includes('estándar') || nombre.toLowerCase().includes('estandar')) 
          costosSubscripcion['Estándar'] = doc.data().costo || 0;
        if (nombre.toLowerCase().includes('premium')) 
          costosSubscripcion['Premium'] = doc.data().costo || 0;
        if (nombre.toLowerCase().includes('vip')) 
          costosSubscripcion['VIP'] = doc.data().costo || 0;
      });

      const userRef = doc(db, "usuarios", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('Miembro no encontrado');
      }
      
      const userData = userDoc.data();
      const fechaFin = new Date();
      let tipoNormalizado = "Basica";
      if (tipoMembresia === 'Estándar') {
        tipoNormalizado = "Estandar";
        fechaFin.setMonth(fechaFin.getMonth() + 3);
      } else if (tipoMembresia === 'Premium') {
        tipoNormalizado = "Premium";
        fechaFin.setMonth(fechaFin.getMonth() + 6);
      } else if (tipoMembresia === 'VIP') {
        tipoNormalizado = "VIP";
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      } else {
        tipoNormalizado = "Basica";
        fechaFin.setMonth(fechaFin.getMonth() + 1);
      }
      
      const costoMembresia = costosSubscripcion[tipoMembresia] || 0;
      await addDoc(collection(db, "pagos"), {
        uid: userData.uid || userId,
        Nombre: `${userData.Nombre || ''} ${userData.Apellido || ''}`.trim(),
        Monto: costoMembresia,
        Fecha: Timestamp.now(),
        Concepto: `Renovación - Membresía ${tipoMembresia}`
      });

      await updateDoc(userRef, {
        Tipo: tipoNormalizado,
        SuscripcionHasta: Timestamp.fromDate(fechaFin)
      });
      
      if (userData.uid) {
        await actualizarEstadoActivoEnRTDB(userData.uid, fechaFin);
      }
      
      alert('Membresía renovada exitosamente');
      setShowRenewModal(false);
      setRenovacion({ userId: '', nombreCompleto: '', tipoMembresia: 'Básica' });
      
      await cargarTodosDatos();
    } catch (error) {
      alert('Error al renovar membresía: ' + error.message);
    }
  };

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === 'nuevo') {
      setNuevoMiembro(prev => ({ ...prev, [name]: value }));
    } else if (formType === 'renovar') {
      setRenovacion(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleScan = async (uid) => {
    setShowQRScanner(false);
    if (!uid) {
        alert('Código QR no válido.');
        return;
    }

    try {
        const activoRef = ref(dbRTDB, `activos/${uid}/activa`);
        const activoSnap = await get(activoRef);

        if (!activoSnap.exists() || activoSnap.val() !== true) {
            alert('La membresía de este usuario no está activa. No se puede registrar la asistencia.');
            return;
        }

        const timestamp = new Date().toISOString();
        const newReadingRef = ref(dbRTDB, `lecturas/${uid}_${Date.now()}`);

        await set(newReadingRef, {
            uid: uid,
            timestamp: timestamp
        });

        const userDoc = await getDoc(doc(db, "usuarios", uid));
        const userName = userDoc.exists() ? `${userDoc.data().Nombre} ${userDoc.data().Apellido}` : uid;

        alert(`Asistencia registrada para ${userName}. ¡Bienvenido/a!`);
        await cargarAsistenciasRealtime();
    } catch (error) {
        alert('Error al registrar la asistencia: ' + error.message);
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {}
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Recepción</h1>
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src={usuario.avatar}
                alt="User"
                className="h-8 w-8 rounded-full"
              />
              <span className="hidden md:block">{usuario.nombre}</span>
              <ChevronDown className="h-4 w-4 hidden md:block" />
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={cerrarSesion}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Miembros Activos</h3>
              <p className="text-2xl font-bold">{stats.miembrosActivos}</p>
              <p className="text-green-500 text-xs">↑ {stats.tendencia}% total</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-gray-500 text-sm">Próximas Renovaciones</h3>
              <p className="text-2xl font-bold">{stats.proximasRenovaciones}</p>
              <p className="text-xs text-yellow-600">En los próximos 8 días</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Acciones Rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Nuevo Miembro
            </button>
            <button
              onClick={() => setShowRenewModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Renovar Membresía
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Escanear QR Asistencia
            </button>
            <button
              onClick={() => setShowMyQR(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg flex items-center justify-center transition-all"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Código QR
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Nuevos Miembros</h2>
            <div className="space-y-4">
              {nuevosMiembros.length === 0 ? (
                <p className="text-center text-gray-500">No hay miembros nuevos</p>
              ) : (
                nuevosMiembros.map(miembro => (
                  <div key={miembro.id} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-all">
                    <img src={miembro.avatar} alt="Member" className="w-10 h-10 rounded-full" />
                    <div className="ml-3">
                      <h4 className="font-medium">{miembro.nombre}</h4>
                      <p className="text-sm text-gray-500">{miembro.fecha}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`${miembro.nuevo ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'} text-xs px-2 py-1 rounded`}>
                        {miembro.nuevo ? 'Nuevo' : 'Activo'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Últimos Accesos</h2>
            <div className="space-y-2">
              {ultimosAccesos.length === 0 ? (
                <p className="text-center text-gray-500">No hay registros de acceso</p>
              ) : (
                <>
                  {ultimosAccesos.slice(0, verTodos ? ultimosAccesos.length : 3).map((acceso, idx) => (
                    <div key={idx} className="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-all border-b border-gray-100">
                      <div className="w-1/4 font-mono text-sm truncate">{acceso.uid}</div>
                      <div className="w-1/4 text-sm truncate">{acceso.nombre}</div>
                      <div className="w-1/4 text-xs">{acceso.entrada}</div>
                      <div className="w-1/4 text-xs">{acceso.salida}</div>
                    </div>
                  ))}
                  {ultimosAccesos.length > 3 && !verTodos && (
                    <div className="text-center mt-3">
                      <button
                        onClick={() => setVerTodos(true)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        Ver todos ({ultimosAccesos.length})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Próximas Renovaciones</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {proximasRenovaciones.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No hay renovaciones próximas</td>
                    </tr>
                  ) : (
                    proximasRenovaciones.map(renovacion => (
                      <tr key={renovacion.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img src={renovacion.avatar} alt="Member" className="w-8 h-8 rounded-full" />
                            <div className="ml-3">
                              <div className="font-medium">{renovacion.nombre}</div>
                              <div className="text-sm text-gray-500">{renovacion.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{renovacion.membresia}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">{renovacion.vence}</div>
                          <div className={`text-xs ${renovacion.dias <= 3 ? 'text-red-600' : 'text-yellow-600'}`}>
                            En {renovacion.dias} días
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${renovacion.claseEstado}`}>
                            {renovacion.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => prepararRenovacion(renovacion.id, renovacion.nombre)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Renovar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Registrar Nuevo Miembro</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">UID de la Tarjeta*</label>
                <input
                  type="text"
                  name="uid"
                  value={nuevoMiembro.uid}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  placeholder="UID de la tarjeta"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre*</label>
                <input
                  type="text"
                  name="nombre"
                  value={nuevoMiembro.nombre}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  placeholder="Nombre del miembro"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={nuevoMiembro.apellido}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  placeholder="Apellido del miembro"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  type="email"
                  name="email"
                  value={nuevoMiembro.email}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  placeholder="Email del miembro"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={nuevoMiembro.telefono}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  placeholder="Teléfono del miembro"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Género</label>
                <select
                  name="genero"
                  value={nuevoMiembro.genero}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                >
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Membresía*</label>
                <select
                  name="tipoMembresia"
                  value={nuevoMiembro.tipoMembresia}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                >
                  <option value="Básica">Básica (1 mes)</option>
                  <option value="Estándar">Estándar (3 meses)</option>
                  <option value="Premium">Premium (6 meses)</option>
                  <option value="VIP">VIP (1 año)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de Inicio*</label>
                <input
                  type="date"
                  name="fechaInicio"
                  value={nuevoMiembro.fechaInicio}
                  onChange={(e) => handleInputChange(e, 'nuevo')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardarNuevoMiembro}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                >
                  Guardar Miembro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRenewModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Renovar Membresía</h3>
              <button onClick={() => setShowRenewModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Miembro a Renovar</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">{renovacion.nombreCompleto || 'Seleccione un miembro'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Nueva Membresía*</label>
                <select
                  name="tipoMembresia"
                  value={renovacion.tipoMembresia}
                  onChange={(e) => handleInputChange(e, 'renovar')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                >
                  <option value="Básica">Básica (1 mes)</option>
                  <option value="Estándar">Estándar (3 meses)</option>
                  <option value="Premium">Premium (6 meses)</option>
                  <option value="VIP">VIP (1 año)</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={renovarMembresia}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                >
                  Renovar y Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />

      {usuario.uid && (
        <QRCodeModal
          isOpen={showMyQR}
          onClose={() => setShowMyQR(false)}
          value={usuario.uid}
          studentName={usuario.nombre} />
      )}
    </div>
  );
};

export default RecepcionDashboard;