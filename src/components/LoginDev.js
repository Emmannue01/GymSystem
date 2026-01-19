import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, query, collection, where, getDocs, writeBatch, setDoc, Timestamp } from 'firebase/firestore';
import { cloudinaryConfig } from '../firebase';
import { FaDumbbell, FaUsers, FaTrophy, FaLock, FaSpinner, FaUserShield, FaBook, FaDoorOpen, FaUserTie } from 'react-icons/fa';

const styles = {
  bgGym: {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3")',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(process.env.REACT_APP_ENV === 'development');
  const [selectedRole, setSelectedRole] = useState('admin');
  const navigate = useNavigate();

  // Usuarios de prueba para desarrollo
  const demoUsers = {
    admin: {
      uid: 'demo-admin-001',
      email: 'admin@gymsystem.local',
      name: 'Admin',
      lastname: 'Usuario',
      rol: 'admin'
    },
    entrenador: {
      uid: 'demo-trainer-001',
      email: 'entrenador@gymsystem.local',
      name: 'Entrenador',
      lastname: 'Certificado',
      rol: 'entrenador'
    },
    recepcion: {
      uid: 'demo-reception-001',
      email: 'recepcion@gymsystem.local',
      name: 'Recepcionista',
      lastname: 'Sistema',
      rol: 'recepcion'
    },
    usuario: {
      uid: 'demo-user-001',
      email: 'usuario@gymsystem.local',
      name: 'Usuario',
      lastname: 'Miembro',
      rol: 'cliente'
    }
  };

  const roleIcons = {
    admin: <FaUserShield className="text-3xl mb-2" />,
    entrenador: <FaBook className="text-3xl mb-2" />,
    recepcion: <FaDoorOpen className="text-3xl mb-2" />,
    usuario: <FaUserTie className="text-3xl mb-2" />
  };

  const roleLabels = {
    admin: 'Administrador',
    entrenador: 'Entrenador',
    recepcion: 'Recepción',
    usuario: 'Usuario/Miembro'
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoading(true);
        try {
          let userData;
          const userDocRef = doc(db, 'usuarios', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            userData = userDoc.data();
          }

          if (userData) {
            const userRole = userData.rol || 'cliente';
            switch (userRole) {
              case 'admin': navigate('/Dashboard'); break;
              case 'recepcion': navigate('/recepcion'); break;
              case 'entrenador': navigate('/entrenadores'); break;
              default: navigate('/usuarios'); break;
            }
          }
        } catch (error) {
          console.error('Error al verificar usuario:', error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoUser = demoUsers[selectedRole];

      // Crear/actualizar usuario en Firestore
      const userDocRef = doc(db, 'usuarios', demoUser.uid);
      const userData = {
        uid: demoUser.uid,
        Nombre: demoUser.name,
        Apellido: demoUser.lastname,
        Email: demoUser.email,
        rol: demoUser.rol,
        Tipo: 'Desarrollo',
        Creado: Timestamp.now(),
        SuscripcionHasta: Timestamp.fromDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
        Telefono: '+1 (555) 000-0000',
        Genero: 'Otro',
        fotoURL: '',
        isDemoUser: true
      };

      await setDoc(userDocRef, userData, { merge: true });

      // Redirigir según el rol
      switch (selectedRole) {
        case 'admin': 
          navigate('/Dashboard'); 
          break;
        case 'recepcion': 
          navigate('/recepcion'); 
          break;
        case 'entrenador': 
          navigate('/entrenadores'); 
          break;
        case 'usuario':
          navigate('/usuarios'); 
          break;
        default: 
          navigate('/usuarios'); 
          break;
      }
    } catch (error) {
      console.error('Error al iniciar sesión de demo:', error);
      alert('Error al iniciar sesión: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (showDemoMode && process.env.REACT_APP_ENV === 'development') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">
              GYM <span className="text-blue-500">PRO</span> <span className="text-red-500 text-2xl">[DEV]</span>
            </h1>
            <p className="text-gray-400 text-lg">Modo de Demostración - Selecciona un rol para probar</p>
            <div className="mt-4 inline-block bg-yellow-500/20 border border-yellow-500 rounded-lg px-4 py-2">
              <p className="text-yellow-300 text-sm">⚠️ Modo Desarrollo - Usuarios de Prueba</p>
            </div>
          </div>

          {/* Role Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(roleLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className={`p-6 rounded-lg transition-all duration-300 flex flex-col items-center justify-center ${
                  selectedRole === key
                    ? 'bg-blue-600 ring-2 ring-blue-400 text-white scale-105'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                }`}
              >
                <div className={selectedRole === key ? 'text-white' : 'text-gray-300'}>
                  {roleIcons[key]}
                </div>
                <span className="font-semibold text-center text-sm">{label}</span>
                <span className="text-xs mt-2 opacity-75">{demoUsers[key].email}</span>
              </button>
            ))}
          </div>

          {/* Info Box */}
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-3">📋 Rol Seleccionado: <span className="text-blue-400">{roleLabels[selectedRole]}</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
              <div>
                <p className="text-gray-400">Email:</p>
                <p className="font-mono text-blue-300">{demoUsers[selectedRole].email}</p>
              </div>
              <div>
                <p className="text-gray-400">Rol:</p>
                <p className="font-mono text-green-300">{demoUsers[selectedRole].rol}</p>
              </div>
            </div>
          </div>

          {/* Login Button */}
          <div className="text-center">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full md:w-96 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-3" /> Iniciando sesión...
                </>
              ) : (
                <>
                  <FaLock className="mr-3" /> Entrar como {roleLabels[selectedRole]}
                </>
              )}
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>🔒 Modo de Demostración - Los datos son locales y se reinician</p>
            <p className="mt-2">⚡ Versión de Desarrollo - Rama: development</p>
          </div>
        </div>

        <style>
          {`
            .btn-hover:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
          `}
        </style>
      </div>
    );
  }

  // Original login UI
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="w-full md:w-1/2 flex items-center justify-center p-10 text-white" style={styles.bgGym}>
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">GYM <span className="text-blue-500">PRO</span></h1>
          <p className="text-lg mb-6">Transforma tu cuerpo, fortalece tu mente</p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white bg-opacity-20 p-4 rounded-lg flex flex-col items-center justify-center">
              <FaDumbbell className="text-2xl mb-2" />
              <p>+50 Máquinas</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg flex flex-col items-center justify-center">
              <FaUsers className="text-2xl mb-2" />
              <p>+100 Miembros</p>
            </div>
            <div className="bg-white bg-opacity-20 p-4 rounded-lg flex flex-col items-center justify-center">
              <FaTrophy className="text-2xl mb-2" />
              <p>Entrenadores Certificados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-red-500 p-3 rounded-full">
                <FaLock className="text-white text-2xl" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">Bienvenido</h2>
            <p className="text-center text-gray-600 mb-8">Accede con tu cuenta de Google para continuar</p>

            <div className="mt-8">
              <p className="text-center text-gray-600 text-sm">
                Modo de producción - Requiere autenticación con Google
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
