import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { FaDumbbell, FaUsers, FaTrophy, FaLock, FaSpinner, FaUserShield, FaBook, FaDoorOpen, FaUserTie } from 'react-icons/fa';

const styles = {
  bgGym: {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3")',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
};

const LoginDev = () => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('admin');
  const navigate = useNavigate();

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

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const demoUser = demoUsers[selectedRole];
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
      setLoading(false);
    }
  };

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
    </div>
  );
};

export default LoginDev;
