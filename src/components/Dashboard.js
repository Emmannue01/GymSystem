import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {collection,getDocs,query,orderBy,limit,Timestamp,doc,getDoc,where,updateDoc,deleteDoc,setDoc, addDoc} from 'firebase/firestore';
import {ref,getDatabase,remove,onValue} from 'firebase/database';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { cloudinaryConfig } from '../firebase';
import * as XLSX from 'xlsx';
import { FaDumbbell, FaUsers, FaTachometerAlt, FaIdCard, FaCalendarCheck, FaChartBar, FaBars, FaTimes, FaHeadset, FaPlus, FaEdit, FaTrash, FaExclamationCircle, FaWallet,FaChevronLeft, FaChevronRight } from 'react-icons/fa';


ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [stats, setStats] = useState({
        totalAccounts: 0,
        activeMemberships: 0,
        expiringSoon: 0,
        monthlyRevenue: 0
    });
    const [membershipData, setMembershipData] = useState({
        labels: ['Básica', 'Estándar', 'Premium', 'VIP'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
            borderWidth: 0
        }]
    });
    const [recentMembers, setRecentMembers] = useState([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [membersPerPage] = useState(10);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [showAsistenciasModal, setShowAsistenciasModal] = useState(false);
    const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showReportesModal, setShowReportesModal] = useState(false);
    const [showMembresiasModal, setShowMembresiasModal] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();
    const [asistencias, setAsistencias] = useState([]);
    const [memberFormData, setMemberFormData] = useState({
        uid: '',
        rol: 'cliente',
        Genero: 'Masculino',
        Nombre: '',
        Apellido: '',
        Email: '',
        Telefono: '',
        Tipo: '',
        fotoFile: null,
        fechaInicio: new Date().toISOString().split('T')[0],
    });

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES');
    };

    const cargarAsistenciasRealtimeRTDB = useCallback(() => {
        const dbRTDB = getDatabase();
        const lecturasRef = ref(dbRTDB, 'lecturas');
        
        const unsubscribe = onValue(lecturasRef, async (snapshot) => {
            try {
                let uidToName = {};
                const usuariosSnap = await getDocs(collection(db, 'usuarios'));
                usuariosSnap.forEach(doc => {
                    const d = doc.data();
                    const nombreCompleto = (d.Nombre ? d.Nombre : '') + (d.Apellido ? ' ' + d.Apellido : '');
                    uidToName[doc.id] = nombreCompleto.trim() || doc.id;
                    if (d.uid) {
                        uidToName[d.uid] = nombreCompleto.trim() || d.uid;
                    }
                });

                const data = snapshot.val();
                if (!data) {
                    setAsistencias([]);
                    return;
                }

                const registros = Object.values(data);
                const porUid = {};
                registros.forEach(reg => {
                    const uid = reg.uid || reg.id;
                    if (!uid) return;
                    if (!porUid[uid]) porUid[uid] = [];
                    porUid[uid].push(reg);
                });

                const asistenciasProcesadas = [];
                Object.entries(porUid).forEach(([uid, lista]) => {
                    lista.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    const nombre = uidToName[uid] || uid;
                    
                    for (let i = 0; i < lista.length; i += 2) {
                        const entrada = lista[i];
                        const salida = lista[i + 1];
                        
                        asistenciasProcesadas.push({
                            uid: uid,
                            nombre: nombre,
                            entrada: entrada ? formatDate(new Date(entrada.timestamp)) : '-',
                            salida: salida ? formatDate(new Date(salida.timestamp)) : '-'
                        });
                    }
                });
                asistenciasProcesadas.sort((a, b) => new Date(b.entrada) - new Date(a.entrada));
                setAsistencias(asistenciasProcesadas);

            } catch (error) {
                console.error('Error al procesar asistencias:', error);
                setAsistencias([]);
            }
        });

        return unsubscribe;
    }, [formatDate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showProfileMenu && !event.target.closest('#profile-menu-container')) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileMenu]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists() && userDoc.data().rol === 'admin') {
                    setUserData({
                        name: user.displayName || user.email.split('@')[0],
                        photoURL: user.photoURL,
                        email: user.email
                    });
                    await loadDashboardData();
                } else {
                    navigate('/');
                }
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        let unsubscribe;
        if (showAsistenciasModal) {
            unsubscribe = cargarAsistenciasRealtimeRTDB();
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [showAsistenciasModal, cargarAsistenciasRealtimeRTDB]);

    const loadDashboardData = async () => {
        try {
            const costosSubscripcion = {};
            const subsSnap = await getDocs(collection(db, 'subscripciones'));
            subsSnap.forEach(doc => {
                costosSubscripcion[doc.data().nombre] = doc.data().costo || 0;
            });

            const allSnapshot = await getDocs(collection(db, "usuarios"));
            const recentQuery = query(collection(db, "usuarios"), orderBy("Creado", "desc"), limit(5));
            const recentSnap = await getDocs(recentQuery);
            let membresiasActivas = 0;
            let membresiasPorVencer = 0;
            const hoy = new Date();
            const ochoDiasDespues = new Date();
            ochoDiasDespues.setDate(hoy.getDate() + 8);

            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
            const pagosQuery = query(
                collection(db, "pagos"),
                where("Fecha", ">=", Timestamp.fromDate(inicioMes)),
                where("Fecha", "<=", Timestamp.fromDate(finMes))
            );
            const pagosSnap = await getDocs(pagosQuery);
            let ingresosMensuales = 0;
            pagosSnap.forEach(doc => {
                ingresosMensuales += doc.data().Monto || 0;
            });

            const conteoTipos = { Basica: 0, Estandar: 0, Premium: 0, VIP: 0 };
            
            allSnapshot.forEach(doc => {
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

                let tipo = (data.Tipo || "Basica").toLowerCase();
                if (tipo.includes("básica") || tipo.includes("basica")) tipo = "Basica";
                else if (tipo.includes("estándar") || tipo.includes("estandar")) tipo = "Estandar";
                else if (tipo.includes("premium")) tipo = "Premium";
                else if (tipo.includes("vip")) tipo = "VIP";
                
                if (conteoTipos.hasOwnProperty(tipo)) {
                    conteoTipos[tipo]++;
                }
            });

            setStats({
                totalAccounts: allSnapshot.size,
                activeMemberships: membresiasActivas,
                expiringSoon: membresiasPorVencer,
                monthlyRevenue: ingresosMensuales
            });

            setMembershipData(prev => ({
                ...prev,
                datasets: [{
                    ...prev.datasets[0],
                    data: [
                        conteoTipos.Basica,
                        conteoTipos.Estandar,
                        conteoTipos.Premium,
                        conteoTipos.VIP
                    ]
                }]
            }));

            const recentMembersData = [];
            recentSnap.forEach(doc => {
                const data = doc.data();
                recentMembersData.push({
                    id: doc.id,
                    ...data,
                    fechaFin: data.SuscripcionHasta?.toDate(),
                    fechaInicio: data.Creado?.toDate()
                });
            });
            setRecentMembers(recentMembersData);

            const allMembersData = [];
            allSnapshot.forEach(doc => {
                const data = doc.data();
                allMembersData.push({
                    id: doc.id,
                    ...data,
                    fechaFin: data.SuscripcionHasta?.toDate(),
                    fechaInicio: data.Creado?.toDate()
                });
            });
            setAllMembers(allMembersData);
            setFilteredMembers(allMembersData);

        } catch (error) {
            console.error("Error loading Dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const uploadImageToCloudinary = async (file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', cloudinaryConfig.uploadPreset);
        formData.append('folder', 'perfiles_usuarios');

        try {
            const response = await fetch(cloudinaryConfig.uploadUrl, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data.secure_url || null;
        } catch (error) {
            console.error("Error subiendo imagen a Cloudinary:", error);
            return null;
        }
    };

    const actualizarEstadoActivoEnRTDB = async (uid, fechaFin) => {
        try {
            const { getDatabase, ref, set } = await import('firebase/database');
            const dbRTDB = getDatabase();
            const hoy = new Date();
            const fechaExpiracion = fechaFin instanceof Date ? fechaFin : 
                (fechaFin && typeof fechaFin.toDate === 'function' ? fechaFin.toDate() : new Date(fechaFin));
            const estaActivo = fechaExpiracion >= hoy;
            
            await set(ref(dbRTDB, 'activos/' + uid), {
                activa: estaActivo,
                fechaExpiracion: fechaExpiracion.toISOString()
            });
        } catch (error) {
            console.error("Error al actualizar estado en RTDB para UID " + uid, error);
        }
    };

    const handleAddMember = async (memberData) => {
        if (!editingMember) {
            const q = query(collection(db, "usuarios"), where("uid", "==", memberData.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                alert("Error: El UID ya está en uso por otro miembro.");
                return;
            }
        }

        try {
            let fotoURL = editingMember ? editingMember.fotoURL : '';
            if (memberData.fotoFile) {
                fotoURL = await uploadImageToCloudinary(memberData.fotoFile);
            }

            const fechaInicio = new Date(memberData.fechaInicio);
            const fechaFin = new Date(memberData.fechaInicio);
            
            switch(memberData.Tipo) {
                case 'Estandar': fechaFin.setMonth(fechaFin.getMonth() + 3); break;
                case 'Premium': fechaFin.setMonth(fechaFin.getMonth() + 6); break;
                case 'VIP': fechaFin.setMonth(fechaFin.getMonth() + 12); break;
                case 'Empleado': fechaFin.setMonth(fechaFin.getMonth() + 60); break;
                case 'Basica':
                default: fechaFin.setMonth(fechaFin.getMonth() + 1); break;
            }

            const costosSubscripcion = {};
            const subsSnap = await getDocs(collection(db, 'subscripciones'));
            subsSnap.forEach(doc => {
                const d = doc.data();
                costosSubscripcion[d.nombre] = d.costo || 0;
            });
            const costoMembresia = costosSubscripcion[memberData.Tipo] || 0;

            const memberPayload = {
                ...memberData,
                SuscripcionHasta: Timestamp.fromDate(fechaFin),
                fotoURL: fotoURL || '',
            };

            // Eliminar el archivo de la carga útil para no guardarlo en Firestore
            delete memberPayload.fotoFile;

            let shouldRegisterPayment = false;
            if (editingMember) {
                const antiguaFechaFin = editingMember.SuscripcionHasta
                    ? (editingMember.SuscripcionHasta instanceof Date ? editingMember.SuscripcionHasta : (editingMember.SuscripcionHasta.toDate ? editingMember.SuscripcionHasta.toDate() : new Date(editingMember.SuscripcionHasta)))
                    : (editingMember.fechaFin || new Date(0));

                const nuevaFechaFin = fechaFin;

                if (nuevaFechaFin > antiguaFechaFin) {
                    shouldRegisterPayment = true;
                }

                const tipoAnterior = editingMember.Tipo || '';
                if (memberData.Tipo && tipoAnterior.toLowerCase() !== memberData.Tipo.toLowerCase()) {
                    shouldRegisterPayment = true;
                }

                const memberRef = doc(db, "usuarios", editingMember.id);
                await updateDoc(memberRef, memberPayload);
                alert("Miembro actualizado exitosamente.");
            } else {
                // Agregar nuevo miembro (UID manual como id de documento)
                memberPayload.Creado = Timestamp.fromDate(fechaInicio);
                const memberRef = doc(db, "usuarios", memberData.uid);
                await setDoc(memberRef, memberPayload);
                alert("Miembro agregado exitosamente.");

                if (costoMembresia > 0) shouldRegisterPayment = true;
            }

            if (shouldRegisterPayment && costoMembresia > 0) {
                try {
                    await addDoc(collection(db, "pagos"), {
                        uid: memberData.uid,
                        Nombre: `${memberData.Nombre || ''} ${memberData.Apellido || ''}`.trim(),
                        Monto: costoMembresia,
                        Fecha: Timestamp.now(),
                        Concepto: editingMember ? `Renovación/Actualización - ${memberData.Tipo}` : `Nueva Membresía - ${memberData.Tipo}`
                    });
                } catch (errPago) {
                    console.error("Error al registrar pago:", errPago);
                }
            }

            await actualizarEstadoActivoEnRTDB(memberData.uid, fechaFin);
            await loadDashboardData(); // refrescar stats (incluye ingreso mensual)
            setShowAddMemberModal(false);
            setEditingMember(null);
        } catch (error) {
            console.error("Error al añadir miembro:", error);
            alert("Error al añadir miembro. Intente nuevamente.");
        }
    };

    const handleEditMember = (member) => {
        setMemberFormData({
            uid: member.uid || member.id,
            rol: member.rol || 'cliente',
            Genero: member.Genero || 'Masculino',
            Nombre: member.Nombre || '',
            Apellido: member.Apellido || '',
            Email: member.Email || '',
            Telefono: member.Telefono || '',
            Tipo: member.Tipo || '',
            fechaInicio: member.fechaInicio ? new Date(member.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            fotoURL: member.fotoURL || '',
        });
        setEditingMember(member);
        setShowAddMemberModal(true);
    };

    const handleDeleteMember = async (memberId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este miembro?')) {
            try {
                const memberRef = doc(db, "usuarios", memberId);
                const memberDoc = await getDoc(memberRef);
                const memberData = memberDoc.data();

                if (memberData?.uid) {
                    const dbRTDB = getDatabase();
                    await remove(ref(dbRTDB, 'activos/' + memberData.uid));
                }

                // Eliminar registros asociados en otras colecciones
                const progressRef = doc(db, "progresos", memberId);
                const metricsRef = doc(db, "metricas", memberId);
                await deleteDoc(progressRef);
                await deleteDoc(metricsRef);

                await deleteDoc(memberRef);
                await loadDashboardData();
                setFilteredMembers(prev => prev.filter(m => m.id !== memberId));
                alert('Miembro eliminado exitosamente');
            } catch (error) {
                console.error("Error al eliminar miembro:", error);
                alert("Error al eliminar el miembro");
            }
        }
    };

    const exportToExcel = async (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte");
        XLSX.writeFile(wb, filename);
    };

    const generateMembershipReport = async () => {
        const snapshot = await getDocs(collection(db, "usuarios"));
        const data = snapshot.docs.map(doc => {
            const userData = doc.data();
            return {
                UID: userData.uid || doc.id,
                Nombre: userData.Nombre,
                Email: userData.Email,
                Tipo: userData.Tipo,
                "Fecha Inicio": formatDate(userData.Creado?.toDate()),
                "Fecha Fin": formatDate(userData.SuscripcionHasta?.toDate())
            };
        });
        exportToExcel(data, "Reporte_Membresias.xlsx");
    };

    const generateReport = async (type) => {
        try {
            let data = [];
            switch(type) {
                case 'usuarios':
                    break;
                case 'asistencias':
                    break;
                case 'membresias':
                    break;
                case 'ingresos':
                    break;
            }
            await exportToExcel(data, `Reporte_${type}.xlsx`);
        } catch (error) {
            console.error(`Error generando reporte de ${type}:`, error);
            alert('Error al generar el reporte');
        }
    };

    const renderMembersModal = () => (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 ${showMembersModal ? '' : 'hidden'}`}>
            <div className="relative top-4 mx-auto p-5 border w-11/12 md:w-5/6 lg:w-4/5 shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-xl font-semibold">Gestión de Miembros</h3>
                    <button onClick={() => setShowMembersModal(false)} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>
                <div className="mt-4">
                    <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
                        <div className="relative w-full md:w-1/3">
                            <input 
                                type="text" 
                                placeholder="Buscar miembros..." 
                                className="w-full pl-10 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <select 
                                className="text-sm border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => handleFilterChange(e.target.value)}
                            >
                                <option value="">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="expirado">Expirados</option>
                                <option value="porvencer">Por vencer</option>
                            </select>
                            <select 
                                className="text-sm border rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => handleTypeChange(e.target.value)}
                            >
                                <option value="">Todos los tipos</option>
                                <option value="Basica">Básica</option>
                                <option value="Estandar">Estándar</option>
                                <option value="Premium">Premium</option>
                                <option value="VIP">VIP</option>
                            </select>
                            <button 
                                onClick={() => setShowAddMemberModal(true)}
                                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
                            >
                                <FaPlus className="mr-2" />
                                Nuevo Miembro
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membresía</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Fin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredMembers.map(member => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img 
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={member.fotoURL || `https://i.pravatar.cc/40?u=${member.id}`}
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {member.Nombre} {member.Apellido}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{member.Email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{member.Telefono}</div>
                                            <div className="text-sm text-gray-500">{member.Email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{member.Tipo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(member.fechaFin)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                member.fechaFin >= new Date() 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                                {member.fechaFin >= new Date() ? 'Activo' : 'Expirado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => handleEditMember(member)} className="text-yellow-600 hover:text-yellow-900 mr-3">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDeleteMember(member.id)} className="text-red-600 hover:text-red-900">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Mostrando <span className="font-medium">{((currentPage - 1) * membersPerPage) + 1}</span> a <span className="font-medium">
                                {Math.min(currentPage * membersPerPage, filteredMembers.length)}
                            </span> de <span className="font-medium">{filteredMembers.length}</span> miembros
                        </div>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                                <FaChevronLeft />
                            </button>
                            {Array.from({ length: Math.ceil(filteredMembers.length / membersPerPage) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1 rounded-md ${
                                        currentPage === i + 1
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= Math.ceil(filteredMembers.length / membersPerPage)}
                                className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAddMemberModal = () => (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 ${showAddMemberModal ? '' : 'hidden'}`}>
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white mb-10">
                <div className="flex justify-between items-center pb-4 border-b">
                    <h3 className="text-xl font-semibold">{editingMember ? 'Editar' : 'Agregar Nuevo'} Miembro</h3>
                    <button onClick={() => { setShowAddMemberModal(false); setEditingMember(null); }} className="text-gray-500 hover:text-gray-700">
                        <FaTimes />
                    </button>
                </div>
                <div className="mt-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const memberData = Object.fromEntries(formData.entries());
                        memberData.fotoFile = memberFormData.fotoFile;
                        handleAddMember(memberData);
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="uid" className="block text-sm font-medium text-gray-700 mb-1">UID (manual)</label>
                                <input id="uid" name="uid" value={memberFormData.uid} onChange={(e) => setMemberFormData({...memberFormData, uid: e.target.value})} readOnly={!!editingMember} className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${editingMember ? 'bg-gray-100' : ''}`} placeholder="UID único" />
                            </div>
                            <div>
                                <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select id="rol" name="rol" value={memberFormData.rol} onChange={(e) => setMemberFormData({...memberFormData, rol: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="cliente">Cliente</option>
                                    <option value="recepcion">Recepción</option>
                                    <option value="admin">Administrador</option>
                                    <option value="entrenador">Entrenador</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="Genero" className="block text-sm font-medium text-gray-700 mb-1">Género</label>
                                <select id="Genero" name="Genero" value={memberFormData.Genero} onChange={(e) => setMemberFormData({...memberFormData, Genero: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="otro">No especificado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="Nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                <input type="text" id="Nombre" name="Nombre" value={memberFormData.Nombre} onChange={(e) => setMemberFormData({...memberFormData, Nombre: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="Apellido" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                <input type="text" id="Apellido" name="Apellido" value={memberFormData.Apellido} onChange={(e) => setMemberFormData({...memberFormData, Apellido: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="Email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <input type="email" id="Email" name="Email" value={memberFormData.Email} onChange={(e) => setMemberFormData({...memberFormData, Email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div>
                                <label htmlFor="Telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <input type="tel" id="Telefono" name="Telefono" value={memberFormData.Telefono} onChange={(e) => setMemberFormData({...memberFormData, Telefono: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>
                            <div>
                                <label htmlFor="Tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Membresía</label>
                                <select id="Tipo" name="Tipo" value={memberFormData.Tipo} onChange={(e) => setMemberFormData({...memberFormData, Tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="">Seleccione una opción</option>
                                    <option value="Basica">Básica (1 mes)</option>
                                    <option value="Estandar">Estándar (3 meses)</option>
                                    <option value="Premium">Premium (6 meses)</option>
                                    <option value="VIP">VIP (12 meses)</option>
                                    <option value="Empleado">Empleado</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="fechaInicio" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                                <input type="date" id="fechaInicio" name="fechaInicio" value={memberFormData.fechaInicio} onChange={(e) => setMemberFormData({...memberFormData, fechaInicio: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="fotoFile" className="block text-sm font-medium text-gray-700 mb-1">Foto de Perfil</label>
                                <div className="mt-1 flex items-center">
                                    {memberFormData.fotoURL && !memberFormData.fotoFile && (
                                        <img src={memberFormData.fotoURL} alt="Perfil actual" className="w-12 h-12 rounded-full object-cover mr-4"/>
                                    )}
                                    <input type="file" id="fotoFile" name="fotoFile" accept="image/*" onChange={(e) => setMemberFormData({...memberFormData, fotoFile: e.target.files[0]})} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                                </div>
                                {memberFormData.fotoFile && (
                                    <p className="text-xs text-gray-500 mt-1">Nuevo archivo: {memberFormData.fotoFile.name}</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-8 flex justify-end">
                            <button type="button" onClick={() => { setShowAddMemberModal(false); setEditingMember(null); }} className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Cancelar
                            </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {editingMember ? 'Guardar Cambios' : 'Guardar Miembro'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    const renderAsistenciasModal = () => (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showAsistenciasModal ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl relative">
                <button onClick={() => setShowAsistenciasModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Cerrar">
                    <FaTimes />
                </button>
                <h3 className="text-xl font-semibold mb-4">Control de Asistencias</h3>
                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entrada</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salida</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {asistencias.length > 0 ? (
                                asistencias.map((asistencia, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">{asistencia.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{asistencia.uid}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{asistencia.entrada}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{asistencia.salida}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                        Cargando asistencias o no hay registros...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderReportesModal = () => (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showReportesModal ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl relative">
                <button onClick={() => setShowReportesModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <FaTimes />
                </button>
                <h3 className="text-xl font-semibold mb-4">Reportes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => generateMembershipReport()}
                        className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                        <FaUsers className="text-blue-500 text-2xl mb-2" />
                        <h4 className="font-medium">Reporte de Miembros</h4>
                    </button>
                    <button
                        onClick={() => generateReport('asistencias')}
                        className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <FaCalendarCheck className="text-green-500 text-2xl mb-2" />
                        <h4 className="font-medium">Reporte de Asistencias</h4>
                    </button>
                </div>
            </div>
        </div>
    );

    const renderMembresiasModal = () => (
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 ${showMembresiasModal ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg relative fade-in">
                <button onClick={() => setShowMembresiasModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                    <FaTimes />
                </button>
                <h3 className="text-xl font-semibold mb-4">Gestión de Membresías</h3>
                <form id="formCostosMembresias" className="space-y-4">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Básica (1 mes)</label>
                        <input type="number" min="0" step="1" name="Basica" defaultValue="200"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Estándar (3 meses)</label>
                        <input type="number" min="0" step="1" name="Estandar" defaultValue="500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Premium (6 meses)</label>
                        <input type="number" min="0" step="1" name="Premium" defaultValue="900"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo VIP (12 meses)</label>
                        <input type="number" min="0" step="1" name="VIP" defaultValue="1500"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowMembresiasModal(false)}
                            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Cancelar
                        </button>
                        <button type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    // Agregar funciones para el manejo de búsqueda y filtros
    const handleSearch = (searchTerm) => {
        const term = searchTerm.toLowerCase();
        const filtered = allMembers.filter(member => 
            member.Nombre?.toLowerCase().includes(term) ||
            member.Apellido?.toLowerCase().includes(term) ||
            member.Email?.toLowerCase().includes(term)
        );
        setFilteredMembers(filtered);
        setCurrentPage(1);
    };

    const handleFilterChange = (filterValue) => {
        const hoy = new Date();
        let filtered = [...allMembers];
        
        switch(filterValue) {
            case 'activo':
                filtered = filtered.filter(member => 
                    member.SuscripcionHasta >= hoy
                );
                break;
            case 'expirado':
                filtered = filtered.filter(member => 
                    member.SuscripcionHasta < hoy
                );
                break;
            case 'porvencer':
                const ochoDias = new Date();
                ochoDias.setDate(hoy.getDate() + 8);
                filtered = filtered.filter(member => 
                    member.SuscripcionHasta >= hoy && 
                    member.SuscripcionHasta <= ochoDias
                );
                break;
            default:
                break;
        }
        setFilteredMembers(filtered);
        setCurrentPage(1);
    };

    const handleTypeChange = (typeValue) => {
        if (!typeValue) {
            setFilteredMembers(allMembers);
        } else {
            const filtered = allMembers.filter(member => 
                member.Tipo?.toLowerCase() === typeValue.toLowerCase()
            );
            setFilteredMembers(filtered);
        }
        setCurrentPage(1);
    };


    const renderMemberDetailsModal = () => {
        if (!selectedMember) return null;
        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md relative fade-in">
                    <button onClick={() => setShowMemberDetailsModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
                        <FaTimes />
                    </button>
                    <div className="text-center">
                        <img src={selectedMember.fotoURL || `https://i.pravatar.cc/100?u=${selectedMember.id}`} alt="Avatar" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-indigo-200 object-cover"/>
                        <h3 className="text-2xl font-bold text-gray-800">{selectedMember.Nombre} {selectedMember.Apellido}</h3>
                        <p className="text-gray-500">{selectedMember.Email}</p>
                        <div className="mt-6 text-left space-y-3">
                            <p><strong className="font-medium text-gray-700">Tipo de Membresía:</strong> <span className="text-indigo-600 font-semibold">{selectedMember.Tipo}</span></p>
                            <p><strong className="font-medium text-gray-700">Miembro desde:</strong> {formatDate(selectedMember.fechaInicio)}</p>
                            <p><strong className="font-medium text-gray-700">Vencimiento:</strong> {formatDate(selectedMember.fechaFin)}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const navItemStyles = `
        .nav-item {
            display: flex;
            align-items: center;
            width: 100%;
            padding: 0.75rem 1rem;
            border-radius: 0.375rem;
            color: #A5B4FC;
            transition: background-color 0.2s, color 0.2s;
        }
        .nav-item:hover {
            background-color: #4338CA;
            color: white;
        }
    `;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {showSidebar && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
                    onClick={() => setShowSidebar(false)}
                ></div>
            )}

            <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-indigo-900 transform ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
                <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-800">
                    <div className="flex items-center">
                        <FaDumbbell className="text-2xl text-yellow-400 mr-2" />
                        <span className="text-xl font-bold text-white">GYM PRO</span>
                    </div>
                    <button onClick={() => setShowSidebar(false)} className="md:hidden text-indigo-300 hover:text-white">
                        <FaTimes className="text-xl" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <nav className="space-y-2">
                        <style>{navItemStyles}</style>
                        <button className="nav-item" data-action="miembros" onClick={() => setShowMembersModal(true)}>
                            <FaUsers className="mr-3" />
                            <span>Gestión de Miembros</span>
                        </button>
                        <button className="nav-item" data-action="membresias" onClick={() => setShowMembresiasModal(true)}>
                            <FaIdCard className="mr-3" />
                            <span>Membresías</span>
                        </button>
                        <button className="nav-item" data-action="asistencias" onClick={() => setShowAsistenciasModal(true)}>
                            <FaCalendarCheck className="mr-3" />
                            <span>Asistencias</span>
                        </button>
                        <button className="nav-item" data-action="reportes" onClick={() => setShowReportesModal(true)}>
                            <FaChartBar className="mr-3" />
                            <span>Reportes</span>
                        </button>
                    </nav>
                </div>

                <div className="px-4 py-4 bg-indigo-800 mx-4 rounded-lg mt-2 mb-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-white">Soporte</p>
                            <p className="text-xs text-gray-300">745-102-0543</p>
                        </div>
                        <FaHeadset className="text-xl text-white" />
                       
                    </div>
                </div>
            </div>

            <div className="md:pl-64 flex flex-col min-h-screen">
                <header className="bg-white shadow">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center">
                            <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden text-gray-500">
                                <FaBars className="text-xl" />
                            </button>
                            <h1 className="ml-4 text-xl font-semibold text-gray-800">Panel de Control</h1>
                        </div>
                        <div className="flex items-center">
                            <div id="profile-menu-container" className="relative">
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center space-x-2">
                                    <img src={userData?.photoURL || "https://via.placeholder.com/32"} 
                                         alt="Profile" 
                                         className="h-8 w-8 rounded-full"/>
                                    <span className="hidden md:block text-gray-700">{userData?.name}</span>
                                </button>
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Cerrar sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatsCard 
                            icon={<FaUsers />} 
                            title="Total Miembros" 
                            value={stats.totalAccounts}
                            color="blue"
                        />
                        <StatsCard 
                            icon={<FaIdCard />} 
                            title="Membresías Activas" 
                            value={stats.activeMemberships}
                            color="green"
                        />
                        <StatsCard 
                            icon={<FaExclamationCircle />} 
                            title="Por Vencer" 
                            value={stats.expiringSoon}
                            color="yellow"
                        />
                        <StatsCard 
                            icon={<FaWallet />} 
                            title="Ingresos Mensuales" 
                            value={`$${stats.monthlyRevenue.toLocaleString()}`}
                            color="purple"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Distribución de Membresías</h3>
                            <div className="h-64">
                                <Doughnut data={membershipData} options={chartOptions} />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
                            <div className="space-y-4">
                                {recentMembers.map((member, index) => (
                                    <div key={index} className="flex items-center">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        <div>
                                            <p className="text-sm font-medium">{member.Nombre} {member.Apellido}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(member.fechaInicio).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-semibold">Últimos Miembros</h3>
                            
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {recentMembers.map(member => (
                                        <tr key={member.id} onClick={() => { setSelectedMember(member); setShowMemberDetailsModal(true); }} className="hover:bg-gray-50 cursor-pointer">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img 
                                                        className="h-10 w-10 rounded-full object-cover"
                                                        src={member.fotoURL || `https://i.pravatar.cc/40?u=${member.id}`}
                                                        alt=""
                                                    />
                                                        </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{member.Nombre} {member.Apellido}</div>
                                                        <div className="text-sm text-gray-500">{member.Email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                Se unió {formatDate(member.fechaInicio)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {renderMembersModal()}
            {renderAddMemberModal()}
            {renderAsistenciasModal()}
            {renderReportesModal()}
            {renderMembresiasModal()}
            {showMemberDetailsModal && renderMemberDetailsModal()}
        </div>
    );
};

const StatsCard = ({ icon, title, value, color }) => {
    const colors = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        yellow: "bg-yellow-100 text-yellow-600",
        purple: "bg-purple-100 text-purple-600"
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
            <div className={`p-3 rounded-full ${colors[color]} mr-4 text-xl`}>{icon}</div>
            <div>
                <p className="text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold">{value}</h3>
            </div>
        </div>
    );
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'right',
        }
    },
    cutout: '70%'
};

export default Dashboard;