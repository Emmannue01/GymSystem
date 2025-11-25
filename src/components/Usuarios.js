import React, { useState, useEffect, useCallback } from 'react';
import { User, Dumbbell, ChevronDown, LogOut, QrCode, ScanLine } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { db, auth } from '../firebase';
import QRCodeModal from './QRCodeModal';
import QRScannerModal from './QRScannerModal';

const Usuarios = () => {  
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [vistaActual, setVistaActual] = useState('semana');
  const [metaSemanal, setMetaSemanal] = useState(5);
  const [metaMensual, setMetaMensual] = useState(20);
  const [progreso, setProgreso] = useState(0);
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [peso, setPeso] = useState(null);
  const [altura, setAltura] = useState(null);
  const [imc, setImc] = useState(null);
  const circleCircumference = 251.2;
  const [showQR, setShowQR] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const dbRTDB = getDatabase();
  const inicializarProgreso = useCallback((uid) => {
    const lecturasRef = ref(dbRTDB, 'lecturas');
    
    onValue(lecturasRef, (snapshot) => {
      const allLecturasData = snapshot.val() || {};
      
      const ahora = new Date();
      let inicio, fin;

      if (vistaActual === 'semana') {
        const hoy = new Date(ahora);
        const diaDeLaSemana = hoy.getDay();
        const diaLunes = hoy.getDate() - diaDeLaSemana + (diaDeLaSemana === 0 ? -6 : 1);

        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), diaLunes, 0, 0, 0, 0);
        fin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6, 23, 59, 59, 999);
      } else {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
        fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      let progresoCalculado = 0;
      if (allLecturasData) {
        const registrosUsuario = Object.values(allLecturasData).filter(reg => {
          const esUsuarioCorrecto = reg.uid === uid || reg.id === uid;
          if (!esUsuarioCorrecto || !reg.timestamp) return false;

          const fechaRegistro = new Date(reg.timestamp);
          return !isNaN(fechaRegistro) && fechaRegistro >= inicio && fechaRegistro <= fin;
        });

        progresoCalculado = Math.floor(registrosUsuario.length / 2);
      }
      
      setProgreso(progresoCalculado);
    }, (error) => {
      setProgreso(0);
    });
  }, [dbRTDB, vistaActual]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "usuarios", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            const checkinUid = data.uid || currentUser.uid;
            const savedMetaSemanal = localStorage.getItem(`metaSemanal_${checkinUid}`);
            const savedMetaMensual = localStorage.getItem(`metaMensual_${checkinUid}`);
            
            if (savedMetaSemanal) setMetaSemanal(parseInt(savedMetaSemanal));
            if (savedMetaMensual) setMetaMensual(parseInt(savedMetaMensual));
            inicializarProgreso(checkinUid);
            inicializarMetricas(checkinUid);
          }
        } catch (error) {}
      } else {
        window.location.href = 'index.html';
      }
    });

    return () => unsubscribeAuth();
  }, [inicializarProgreso]);

  const inicializarMetricas = (uid) => {
    const trainerDocRef = doc(db, 'metricas', uid);
    
    const unsubscribe = onSnapshot(trainerDocRef, (snap) => {
      setMetricsLoading(false);
      
      if (snap.exists()) {
        const trainerMetrics = snap.data();
        const processedMetrics = {};
        const ignoreKey = (k) => /(fecha|ultima|last|timestamp|^peso$|^altura$|^imc$)/i.test(k);

        const inferUnit = (key) => {
          const k = (key || '').toLowerCase();
          if (k.includes('peso') || k.includes('kg') || k.includes('mass') || k.includes('masa')) return 'kg';
          if (k.includes('grasa') || k.includes('%')) return '%';
          if (k.includes('musculo') || k.includes('músculo') || k.includes('muscle')) return 'kg';
          if (k.includes('press') || k.includes('banca') || k.includes('sentad') || k.includes('sentadilla') || k.includes('rm')) return 'kg';
          if (k.includes('tiempo') || k.includes('5km') || k.match(/\bmin\b/)) return '';
          if (k.includes('imc')) return '';
          return '';
        };
        Object.keys(trainerMetrics).forEach(key => {
          if (ignoreKey(key)) return;

          const value = trainerMetrics[key];
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            Object.keys(value).forEach(subKey => {
              if (ignoreKey(subKey)) return;
              const composedKey = `${key}_${subKey}`;
              processedMetrics[composedKey] = {
                valor: value[subKey],
                unidad: inferUnit(subKey)
              };
            });
          } else {
            processedMetrics[key] = {
              valor: value,
              unidad: inferUnit(key)
            };
          }
        });

        setMetrics(processedMetrics);
        const pesoValue = trainerMetrics.peso !== undefined && trainerMetrics.peso !== null ? trainerMetrics.peso : null;
        const alturaValue = trainerMetrics.altura !== undefined && trainerMetrics.altura !== null ? trainerMetrics.altura : null;
        
        setPeso(pesoValue);
        setAltura(alturaValue);
      } else {
        setMetrics({});
        setPeso(null);
        setAltura(null);
      }
    }, (error) => {
      console.error('Error al suscribirse a métricas:', error);
      setMetricsLoading(false);
    });

    return unsubscribe;
  };
  useEffect(() => {
    if (peso && altura && altura > 0) {
      const bmiValue = peso / Math.pow(altura / 100, 2);
      setImc(bmiValue.toFixed(1));
    } else {
      setImc(null);
    }
  }, [peso, altura]);
  const ajustarMeta = (ajuste) => {
    if (vistaActual === 'semana') {
      const newMeta = Math.max(1, metaSemanal + ajuste);
      setMetaSemanal(newMeta);
      if (user) localStorage.setItem(`metaSemanal_${user.uid}`, newMeta);
    } else {
      const newMeta = Math.max(1, metaMensual + ajuste);
      setMetaMensual(newMeta);
      if (user) localStorage.setItem(`metaMensual_${user.uid}`, newMeta);
    }
  };
  const cambiarVista = (vista) => {
    setVistaActual(vista);
  };
  const meta = vistaActual === 'semana' ? metaSemanal : metaMensual;
  const porcentaje = meta > 0 ? Math.min(100, (progreso / meta) * 100) : 0;
  const offset = circleCircumference - (porcentaje / 100) * circleCircumference;
  const humanizeKey = (key) => {
    if (!key) return '';
    let s = key.replace(/_/g, ' ');
    s = s.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    s = s.replace(/([a-zA-Z])([0-9])/g, '$1 $2');
    s = s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return s;
  };
  const getBarPercentage = (valor, unidad) => {
    if (unidad === 'kg') {
      return Math.min(100, parseFloat(valor || 0) / 1.5);
    } else if (unidad === '%') {
      return Math.min(100, parseFloat(valor || 0) * 2);
    } else if (typeof valor === 'string' && valor.includes(':')) {
      return 50;
    }
    return Math.min(100, parseFloat(valor || 0));
  };

  const handleLogout = () => {
    signOut(auth).catch(error => {});
  };

  const handleScan = (data) => {
    setShowQRScanner(false);
    alert(`Código QR escaneado: ${data}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-indigo-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Dumbbell className="text-2xl text-yellow-400" size={28} />
            <h1 className="text-2xl font-bold">
              My<span className="text-yellow-400">Gym</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <img
                  className="h-10 w-10 rounded-full"
                  src={userData?.fotoURL || user?.photoURL || 'https://i.pravatar.cc/40'}
                  alt="User profile"
                />
                <span className="hidden md:inline">{user?.displayName || 'Usuario'}</span>
                <ChevronDown className="text-xs hidden md:inline" size={12} />
              </button>
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-100"
                  >
                    <LogOut size={16} className="mr-2" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {userData ? `¡Bienvenido de nuevo, ${userData.Nombre}!` : 'Cargando...'}
              </h2>
              <p className="mb-4">
                {userData?.SuscripcionHasta?.toDate
                  ? `Tu membresía está activa hasta el ${userData.SuscripcionHasta.toDate().toLocaleDateString('es-ES')}`
                  : 'Verificando estado de membresía...'}
              </p>
              
              <div className="flex space-x-2">
                <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                  Plan: {userData?.Tipo || '...'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => setShowQR(true)} className="bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-2 px-5 rounded-lg inline-flex items-center transition-colors shadow-md">
            <QrCode className="mr-2" />
            <span>Mi Código QR</span>
          </button>
          <button onClick={() => setShowQRScanner(true)} className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center transition-colors shadow-md">
            <ScanLine className="mr-2" />
            <span>Escanear QR</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Tu progreso</h3>
              <div className="flex bg-gray-200 rounded-full p-1 text-sm">
                <button
                  onClick={() => cambiarVista('semana')}
                  className={`px-3 py-1 rounded-full ${
                    vistaActual === 'semana'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => cambiarVista('mes')}
                  className={`px-3 py-1 rounded-full ${
                    vistaActual === 'mes'
                      ? 'bg-white text-indigo-600 shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Mes
                </button>
              </div>
            </div>

             
            
              <div className="flex flex-col items-center flex-grow justify-center">
                {/* Circular Progress */}
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                    <circle
                      className="text-yellow-400 transition-all duration-500"
                      strokeWidth="8"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={offset}
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%'
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{Math.round(porcentaje)}%</span>
                  </div>
                </div>

                <div className="w-full">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span>Objetivo:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => ajustarMeta(-1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="font-bold w-4 text-center">{meta}</span>
                      <span>visitas</span>
                      <button
                        onClick={() => ajustarMeta(1)}
                        className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{progreso}/{meta}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Tus métricas</h3>
              <span className="text-sm text-gray-500">
                {metricsLoading ? 'Cargando...' : 'Definido por entrenador'}
              </span>
            </div>
            {metricsLoading ? (
              <div className="flex items-center justify-center py-8 flex-grow">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="space-y-4 flex-grow">
                {Object.entries(metrics).map(([key, data]) => {
                  const barPercent = getBarPercentage(data.valor, data.unidad);
                  const displayValue =
                    typeof data.valor === 'string' && data.valor.includes(':')
                      ? data.valor
                      : `${data.valor} ${data.unidad}`;

                  return (
                    <div key={key} className="metric-row">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">
                          {humanizeKey(key)}
                          <small className="text-xs text-indigo-600 ml-2">✓</small>
                        </span>
                        <span className="font-medium">{displayValue}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${barPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <h4 className="font-semibold text-lg mb-2">Peso</h4>
            <div className="text-2xl font-bold">
              {peso !== null ? `${peso} kg` : '-- kg'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <h4 className="font-semibold text-lg mb-2">Altura</h4>
            <div className="text-2xl font-bold">
              {altura !== null ? `${altura} cm` : '-- cm'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <h4 className="font-semibold text-lg mb-2">IMC</h4>
            <div className="text-2xl font-bold">{imc || '--'}</div>
          </div>
        </div>
      </main>

      {user && userData && (
        <QRCodeModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          value={userData.uid || user.uid}
          studentName={`${userData.Nombre || ''} ${userData.Apellido || ''}`.trim()}
        />
      )}

      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleScan}
      />
    </div>
  );
};

export default Usuarios;