import React, { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  addDoc,
  query,
  where
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { FaTimes } from 'react-icons/fa';

// Importar Firebase y constantes desde archivos separados
import { db, auth } from '../firebase';
import { cloudinaryConfig } from '../firebase';


const TrainerDashboard = () => {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [currentClient, setCurrentClient] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [activeTab, setActiveTab] = useState('client-tab');
  const [activeClientTab, setActiveClientTab] = useState('metrics-tab');
  const [showModal, setShowModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [metrics, setMetrics] = useState({
    peso: 0,
    altura: 0,
    grasa: 0,
    pressBanca: 0,
    sentadilla: 0,
    flexiones: 0,
    tiempo5km: '00:00',
    imc: 0
  });  
  const [beforeImage, setBeforeImage] = useState('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80');
  const [afterImage, setAfterImage] = useState('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=600&q=80');
  const [beforeFile, setBeforeFile] = useState(null);
  const [afterFile, setAfterFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiResult, setBmiResult] = useState(null);

  // Autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserRole(currentUser);
      } else {
        window.location.href = 'index.html';
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Cargar clientes
  useEffect(() => {
    if (user) {
      loadClients();
    }
  }, [user]);

  // Filtrar clientes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client => {
        const fullName = `${client.Nombre || ''} ${client.Apellido || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  const checkUserRole = async (currentUser) => {
    try {
      const userDocRef = doc(db, "usuarios", currentUser.uid);
      let userDoc = await getDoc(userDocRef);
      let userData = null;

      if (userDoc.exists()) {
        userData = userDoc.data();
      } else {
        const q = query(collection(db, "usuarios"), where("Email", "==", currentUser.email.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          userData = querySnapshot.docs[0].data();
        }
      }

      if (userData && !['entrenador', 'admin', 'administrador'].includes(userData.rol)) {
        window.location.href = 'index.html';
      }
    } catch (error) {
    }
  };

  const loadClients = async () => {
    try {
      const clientsCollection = collection(db, "usuarios");
      const clientsSnapshot = await getDocs(clientsCollection);
      const clientsData = clientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
    }
  };
  const viewClientDetails = async (clientId) => {
    if (!clientId) {
      alert("No se proporcionó un ID de cliente válido");
      return;
    }
    
    setCurrentClientId(clientId);
    
    try {
      const clientDoc = await getDoc(doc(db, "usuarios", clientId));
      
      if (!clientDoc.exists()) {
        alert("Cliente no encontrado");
        return;
      }
      
      const clientData = clientDoc.data();
      setCurrentClient(clientData);
      setNotes(clientData.Notas || '');
      
      await loadClientMetrics(clientId);
      await loadClientProgress(clientId);
      
      setShowModal(true);
      setActiveClientTab('metrics-tab');
    } catch (error) {
      alert("Error al cargar los detalles del cliente");
    }
  };

  const loadClientMetrics = async (clientId) => {
    try {
      const metricsDoc = await getDoc(doc(db, 'metricas', clientId));
      if (metricsDoc.exists()) {
        const metricsData = metricsDoc.data();
        setMetrics({
          peso: metricsData.peso || 0,
          altura: metricsData.altura || 0,
          grasa: metricsData.grasa || 0,
          pressBanca: metricsData.pressBanca || 0,
          sentadilla: metricsData.sentadilla || 0,
          flexiones: metricsData.flexiones || 0,
          tiempo5km: metricsData.tiempo5km || '00:00',
          imc: metricsData.imc || 0
        });
      }
    } catch (error) {
    }
  };

  const loadClientProgress = async (clientId) => {
    try {
      const progDoc = await getDoc(doc(db, 'progresos', clientId));
      if (progDoc.exists()) {
        const data = progDoc.data();
        if (data.beforeURL) setBeforeImage(data.beforeURL);
        if (data.afterURL) setAfterImage(data.afterURL);
      }
    } catch (error) {
    }
  };
  const uploadImage = async (file, clientId, type) => {
    if (!file || !clientId) throw new Error('Falta archivo o ID de cliente');
  
    const progDocRef = doc(db, 'progresos', clientId);
    const progSnap = await getDoc(progDocRef);
    const progData = progSnap.exists() ? progSnap.data() : {};
  
    if (type === 'before' && progData.beforeURL) {
      throw new Error('Ya existe una foto inicial. Si deseas reemplazarla, elimina primero la existente.');
    }
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', 'fotos_progreso');

    try {
      const response = await fetch(cloudinaryConfig.uploadUrl, {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error('Error al subir la imagen.');
      }
  
      const data = await response.json();
      const downloadURL = data.secure_url;
  
      const update = { fecha: serverTimestamp() };
      if (type === 'before' && !progData.beforeURL) update.beforeURL = downloadURL;
      if (type === 'after') update.afterURL = downloadURL;
      await setDoc(progDocRef, update, { merge: true });

      if (type === 'before' && !progData.beforeURL) setBeforeImage(downloadURL);
      if (type === 'after') setAfterImage(downloadURL);
      
      return downloadURL;
    } catch (err) {
      throw err;
    }
  };
  const handleBeforeUpload = async () => {
    if (!beforeFile || !currentClientId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await uploadImage(beforeFile, currentClientId, 'before');
      alert('Foto inicial subida correctamente');
      setBeforeFile(null);
    } catch (error) {
      alert('Error al subir foto inicial: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const handleAfterUpload = async () => {
    if (!afterFile || !currentClientId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      await uploadImage(afterFile, currentClientId, 'after');
      alert('Última foto subida correctamente');
      setAfterFile(null);
    } catch (error) {
      alert('Error al subir última foto: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const saveClientChanges = async () => {
    if (!currentClientId) {
      alert("No hay un cliente seleccionado");
      return;
    }
    
    try {
      if (metrics.peso <= 0 || metrics.altura <= 0) {
        alert("Por favor ingresa valores válidos para peso y altura");
        return;
      }
      const bmi = (metrics.peso / Math.pow(metrics.altura/100, 2)).toFixed(1);
      const clientData = {
        Notas: notes,
        ultimaActualizacion: serverTimestamp()
      };
      
      const metricsData = {
        ...metrics,
        imc: parseFloat(bmi),
        fechaActualizacion: serverTimestamp()
      };
      
      await updateDoc(doc(db, "usuarios", currentClientId), clientData);
      await setDoc(doc(db, 'metricas', currentClientId), metricsData, { merge: true });
      
      setMetrics(prev => ({ ...prev, imc: parseFloat(bmi) }));
      
      alert("Cambios guardados exitosamente!");
    } catch (error) {
      alert("Error al guardar cambios. Por favor verifica los datos.");
    }
  };
  const calculateBMI = () => {
    const weight = parseFloat(bmiWeight);
    const height = parseFloat(bmiHeight);
    
    if (!(weight > 0) || !(height > 0)) {
      setBmiResult({ error: 'Ingresa peso y altura válidos' });
      return;
    }
    
    const bmi = weight / Math.pow(height/100, 2);
    const bmiValue = bmi.toFixed(1);
    let classification = '';
    
    if (bmi < 18.5) classification = 'Bajo peso';
    else if (bmi < 25) classification = 'Peso normal';
    else if (bmi < 30) classification = 'Sobrepeso';
    else classification = 'Obesidad';
    
    setBmiResult({ value: bmiValue, classification });
  };
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      alert('No se pudo cerrar sesión. Intenta nuevamente.');
    }
  };
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No especificado';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className={`sidebar bg-indigo-800 text-white w-64 flex-shrink-0 fixed md:relative z-50 h-full transition-transform duration-300 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <button 
          className="md:hidden absolute right-4 top-4 text-white"
          onClick={() => setShowSidebar(false)}
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="p-4 flex items-center space-x-2 border-b border-indigo-700">
          <i className="fas fa-dumbbell text-2xl"></i>
          <h1 className="text-xl font-bold">FitCoach Pro</h1>
        </div>
        
        <nav className="p-4">
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Clientes</h2>
            <ul>
              <li className="mb-1">
                <button 
                  onClick={() => setActiveTab('client-tab')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-indigo-700 flex items-center space-x-2 ${activeTab === 'client-tab' ? 'bg-indigo-700' : ''}`}
                >
                  <i className="fas fa-users"></i>
                  <span>Mis Clientes</span>
                </button>
              </li>
            </ul>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-indigo-300 mb-2">Administración</h2>
            <ul>
              <li className="mb-1">
                <button 
                  onClick={() => setActiveTab('certifications-tab')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-indigo-700 flex items-center space-x-2 ${activeTab === 'certifications-tab' ? 'bg-indigo-700' : ''}`}
                >
                  <i className="fas fa-certificate"></i>
                  <span>Certificaciones</span>
                </button>
              </li>
              <li className="mb-1">
                <button 
                  onClick={() => setActiveTab('bmi-tab')}
                  className={`w-full text-left px-3 py-2 rounded hover:bg-indigo-700 flex items-center space-x-2 ${activeTab === 'bmi-tab' ? 'bg-indigo-700' : ''}`}
                >
                  <i className="fas fa-calculator"></i>
                  <span>Calculadora IMC</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
        
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-700">
            <div 
              className="relative flex items-center space-x-3 cursor-pointer"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <img 
                src={user.photoURL || 'https://randomuser.me/api/portraits/men/47.jpg'} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100"
              />
              <div className="flex-1">
                <p className="font-medium">{user.displayName || user.email}</p>
                <p className="text-xs text-indigo-300">Entrenador Certificado</p>
              </div>
              
              {showProfileMenu && (
                <div className="absolute bottom-14 right-0 w-44 bg-white text-indigo-800 rounded-md shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <button 
            className="md:hidden text-gray-600"
            onClick={() => setShowSidebar(true)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {activeTab === 'client-tab' && 'Mis Clientes'}
            {activeTab === 'certifications-tab' && 'Certificaciones'}
            {activeTab === 'bmi-tab' && 'Calculadora IMC'}
          </h2>
        </header>

        <main className="p-6">
          {activeTab === 'client-tab' && (
            <div>
              <div className="mb-6 flex justify-between items-center">
                <h3 className="text-lg font-medium">Lista de Clientes</h3>
                <div className="relative">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cliente..." 
                    className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                  <div key={client.id} className="bg-white rounded-lg shadow-md p-4 flex flex-col">
                    <div className="flex-1 flex items-start space-x-4 mb-4">
                      <img
                        src={client.fotoURL || `https://i.pravatar.cc/80?u=${client.id}`}
                        alt="Foto de perfil"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="flex-1">
                        <p className="text-md font-semibold text-gray-800">
                          {`${client.Nombre || ''} ${client.Apellido || ''}`.trim() || 'Sin nombre'}
                        </p>
                        <p className="text-sm text-gray-500">Género: {client.Genero || 'No especificado'}</p>
                        <p className="text-sm text-gray-500">Teléfono: {client.Telefono || 'No especificado'}</p>
                        <p className="text-sm text-gray-500">
                          Suscripción hasta: {formatDate(client.SuscripcionHasta)}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <button 
                        onClick={() => viewClientDetails(client.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bmi-tab' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium">Calculadora de IMC</h3>
                <p className="text-gray-500">Calcula el Índice de Masa Corporal de tus clientes.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h4 className="font-medium mb-4">Calculadora</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input 
                        type="number"
                        value={bmiWeight}
                        onChange={(e) => setBmiWeight(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        placeholder="Ej. 70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Altura (cm)</label>
                      <input 
                        type="number"
                        value={bmiHeight}
                        onChange={(e) => setBmiHeight(e.target.value)}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                        placeholder="Ej. 175"
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        onClick={calculateBMI}
                        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Calcular IMC
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border">
                  <h4 className="font-medium mb-4">Resultado</h4>
                  <div className="text-center py-8">
                    {!bmiResult ? (
                      <div className="text-gray-400">
                        <i className="fas fa-calculator text-4xl mb-2"></i>
                        <p>Ingresa los datos para calcular el IMC</p>
                      </div>
                    ) : bmiResult.error ? (
                      <div className="text-red-500">{bmiResult.error}</div>
                    ) : (
                      <div className="text-indigo-800">
                        <div className="text-3xl font-bold mb-1">{bmiResult.value}</div>
                        <div className="text-sm">{bmiResult.classification}</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <h5 className="font-medium mb-2">Clasificación del IMC</h5>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm flex-1">Menos de 18.5 - Bajo peso</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm flex-1">18.5 a 24.9 - Peso normal</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-sm flex-1">25.0 a 29.9 - Sobrepeso</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-sm flex-1">30.0 o más - Obesidad</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'certifications-tab' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium">Certificaciones</h3>
                <p className="text-gray-500">Sube tus certificaciones como entrenador y de entrenamiento médico.</p>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <p className="text-gray-600">Sección de certificaciones - Implementar según necesidades</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {showModal && currentClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto mx-2 sm:mx-0">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Detalles de {`${currentClient.Nombre || ''} ${currentClient.Apellido || ''}`.trim()}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes aria-label="Cerrar" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Client Info */}
              <div className="flex flex-col md:flex-row gap-6 mb-8">
                <div className="flex-shrink-0">
                  <img 
                    src={currentClient.fotoURL || 'https://randomuser.me/api/portraits/men/47.jpg'} 
                    alt="Client" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-bold mb-2">
                    {`${currentClient.Nombre || ''} ${currentClient.Apellido || ''}`.trim()}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Objetivo</p>
                      <p className="font-medium">{currentClient.Genero || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duración</p>
                      <p className="font-medium">{formatDate(currentClient.SuscripcionHasta)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="font-medium">{currentClient.Telefono || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Edad</p>
                      <p className="font-medium">{currentClient.Estado || 'Sin estado'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Notas</p>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                  <button 
                    onClick={() => setActiveClientTab('metrics-tab')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeClientTab === 'metrics-tab' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Métricas
                  </button>
                  <button 
                    onClick={() => setActiveClientTab('progress-tab')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeClientTab === 'progress-tab' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Progreso
                  </button>
                  <button 
                    onClick={() => setActiveClientTab('medical-tab')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeClientTab === 'medical-tab' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Historial Médico
                  </button>
                  <button 
                    onClick={() => setActiveClientTab('routine-tab')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${activeClientTab === 'routine-tab' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    Rutina
                  </button>
                </nav>
              </div>

              {activeClientTab === 'metrics-tab' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Medidas Corporales</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Peso</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.peso}
                              onChange={(e) => setMetrics({...metrics, peso: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="kg"
                            />
                            <span>kg</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Altura</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.altura}
                              onChange={(e) => setMetrics({...metrics, altura: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="cm"
                            />
                            <span>cm</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>IMC</span>
                          <span>{metrics.imc || '0.0'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>% Grasa</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.grasa}
                              onChange={(e) => setMetrics({...metrics, grasa: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="%"
                            />
                            <span>%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border">
                      <h5 className="font-medium mb-4">Rendimiento</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>RM Press Banca</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.pressBanca}
                              onChange={(e) => setMetrics({...metrics, pressBanca: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="kg"
                            />
                            <span>kg</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>RM Sentadilla</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.sentadilla}
                              onChange={(e) => setMetrics({...metrics, sentadilla: parseFloat(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="kg"
                            />
                            <span>kg</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>Flexiones máx.</span>
                          <div className="flex items-center">
                            <input 
                              type="number"
                              value={metrics.flexiones}
                              onChange={(e) => setMetrics({...metrics, flexiones: parseInt(e.target.value) || 0})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="rep."
                            />
                            <span>rep.</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>5km tiempo</span>
                          <div className="flex items-center">
                            <input 
                              type="text"
                              value={metrics.tiempo5km}
                              onChange={(e) => setMetrics({...metrics, tiempo5km: e.target.value})}
                              className="w-16 p-1 border rounded text-right mr-2" 
                              placeholder="mm:ss"
                            />
                            <span>min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={saveClientChanges}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
              )}

              {activeClientTab === 'progress-tab' && (
                <div>
                  <div className="mb-6">
                    <h5 className="font-medium mb-4">Fotos de Progreso</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                        <p className="text-sm text-gray-600 mb-2">Foto inicial (primera subida)</p>
                        <img 
                          src={beforeImage} 
                          alt="Before" 
                          className="w-full h-48 object-cover rounded"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                        <p className="text-sm text-gray-600 mb-2">Última foto subida</p>
                        <img 
                          src={afterImage} 
                          alt="After" 
                          className="w-full h-48 object-cover rounded"
                        />
                      </div>
                    </div>
                  </div>
                  {isUploading && (
                    <div className="text-sm text-gray-600 mt-2">
                      Cargando: <span>{uploadProgress}%</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subir foto inicial
                      </label>
                      <div className="flex items-center">
                        <input 
                          type="file"
                          onChange={(e) => setBeforeFile(e.target.files[0])}
                          className="hidden" 
                          id="before-upload" 
                          accept="image/*"
                        />
                        <button 
                          onClick={() => document.getElementById('before-upload').click()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-l-lg hover:bg-gray-200"
                        >
                          <i className="fas fa-upload mr-2"></i>Seleccionar
                        </button>
                        <span className="px-4 py-2 bg-gray-50 border-l border-gray-200 text-sm text-gray-500">
                          {beforeFile ? beforeFile.name : 'Ningún archivo seleccionado'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <button 
                          onClick={handleBeforeUpload}
                          disabled={!beforeFile || isUploading}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Subir foto inicial
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subir última foto
                      </label>
                      <div className="flex items-center">
                        <input 
                          type="file"
                          onChange={(e) => setAfterFile(e.target.files[0])}
                          className="hidden" 
                          id="after-upload" 
                          accept="image/*"
                        />
                        <button 
                          onClick={() => document.getElementById('after-upload').click()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-l-lg hover:bg-gray-200"
                        >
                          <i className="fas fa-upload mr-2"></i>Seleccionar
                        </button>
                        <span className="px-4 py-2 bg-gray-50 border-l border-gray-200 text-sm text-gray-500">
                          {afterFile ? afterFile.name : 'Ningún archivo seleccionado'}
                        </span>
                      </div>
                      <div className="mt-2">
                        <button 
                          onClick={handleAfterUpload}
                          disabled={!afterFile || isUploading}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Subir última foto
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeClientTab === 'medical-tab' && (
                <div>
                  <div className="bg-white p-4 rounded-lg border mb-6">
                    <h5 className="font-medium mb-4">Historial Médico</h5>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Condiciones médicas</p>
                        <p className="font-medium">Ninguna conocida</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Lesiones previas</p>
                        <p className="font-medium">Esguince de tobillo derecho (2020)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Alergias</p>
                        <p className="font-medium">Ninguna conocida</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Medicamentos</p>
                        <p className="font-medium">Ninguno actualmente</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Notas adicionales</p>
                        <p className="font-medium">
                          El cliente reporta molestias ocasionales en la rodilla izquierda durante ejercicios de impacto.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>
                      <i className="fas fa-info-circle mr-2"></i>
                      El historial médico solo puede ser editado por el cliente desde su perfil.
                    </p>
                  </div>
                </div>
              )}

              {activeClientTab === 'routine-tab' && (
                <div>
                  <div className="mb-6">
                    <h5 className="font-medium mb-4">Rutina Actual</h5>
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Objetivo de la rutina
                        </label>
                        <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option>Pérdida de peso</option>
                          <option>Ganancia muscular</option>
                          <option>Tonificación</option>
                          <option>Preparación física</option>
                          <option>Rehabilitación</option>
                        </select>
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frecuencia semanal
                        </label>
                        <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                          <option>2 días</option>
                          <option>3 días</option>
                          <option>4 días</option>
                          <option>5 días</option>
                          <option>6 días</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Detalles de la rutina
                        </label>
                        <textarea 
                          className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" 
                          rows="6"
                          defaultValue={`Lunes (Pierna):
- Sentadillas 4x12
- Peso muerto 3x10
- Prensa 3x12
- Elevación de talones 4x15

Miércoles (Espalda/Bíceps):
- Dominadas asistidas 3x8
- Remo con barra 4x10
- Curl de bíceps 3x12
- Jalón al pecho 3x12

Viernes (Pecho/Tríceps):
- Press banca 4x10
- Fondos 3x12
- Aperturas 3x12
- Extensión de tríceps 3x15

Notas: Descansar 60-90 segundos entre series. Mantener buena forma en todos los ejercicios.`}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Actualizar Rutina
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerDashboard;