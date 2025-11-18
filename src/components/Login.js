import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { GoogleAuthProvider,signInWithPopup,onAuthStateChanged } from 'firebase/auth';
import { doc,getDoc, query, collection, where,getDocs,writeBatch,setDoc,Timestamp } from 'firebase/firestore';
import { cloudinaryConfig } from '../firebase';
import { FaDumbbell, FaUsers, FaTrophy, FaLock, FaSpinner } from 'react-icons/fa';

const styles = {
  bgGym: {
    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3")',
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
};

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const uploadProfileImageToCloudinary = async (imageUrl) => {
        if (!imageUrl) return null;

        const formData = new FormData();
        formData.append('file', imageUrl);
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
            return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setLoading(true);
                try {
                    let userData;
                    let userDoc;

                    if (user.email) {
                        const userEmail = user.email.toLowerCase();
                        const q = query(collection(db, "usuarios"), where("Email", "==", userEmail));
                        const querySnapshot = await getDocs(q);

                        if (!querySnapshot.empty) {
                            const foundDoc = querySnapshot.docs[0];

                            if (foundDoc.id !== user.uid) {
                                const batch = writeBatch(db);
                                const oldData = foundDoc.data();
                                const newUserDocRef = doc(db, "usuarios", user.uid);

                                batch.set(newUserDocRef, { ...oldData, uid: user.uid, Email: userEmail });
                                batch.delete(foundDoc.ref);
                                await batch.commit();
                                
                                userDoc = await getDoc(newUserDocRef);
                            } else {
                                userDoc = foundDoc;
                            }
                            userData = userDoc.data();
                        }
                    }

                    if (!userData) {
                        const userDocRef = doc(db, "usuarios", user.uid);
                        userDoc = await getDoc(userDocRef);

                        if (userDoc.exists()) {
                            userData = userDoc.data();
                        }
                    }

                    if (!userData) {
                        const userEmail = user.email.toLowerCase();
                        const userDocRef = doc(db, "usuarios", user.uid);
                        const fechaInicio = new Date();
                        const fechaFin = new Date();
                        fechaFin.setMonth(fechaFin.getMonth());

                        const cloudinaryPhotoURL = await uploadProfileImageToCloudinary(user.photoURL);

                        const newUser = {
                            uid: '',
                            Nombre: user.displayName ? user.displayName.split(' ')[0] : 'Nuevo',
                            Apellido: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : 'Usuario',
                            Email: userEmail,
                            rol: 'cliente',
                            Tipo: 'Basica',
                            Creado: Timestamp.fromDate(fechaInicio),
                            SuscripcionHasta: Timestamp.fromDate(fechaFin),
                            Telefono: '',
                            Genero: 'Otro',
                            fotoURL: cloudinaryPhotoURL || user.photoURL || ''
                        };
                        
                        await setDoc(userDocRef, newUser);
                        userData = newUser;
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
                    alert("No se pudo verificar tu rol. Intenta de nuevo.");
                    setLoading(false);
                }
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const handleGoogleLogin = async () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            let friendlyMessage = 'Error al iniciar sesión con Google.';
            if (error.code === 'auth/popup-closed-by-user') {
                friendlyMessage = 'Ventana de inicio de sesión cerrada.';
            }
            alert(friendlyMessage);
        } finally {
            setLoading(false);
        }
    };

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
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="btn-hover w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                            >
                                {loading ? (
                                    <><FaSpinner className="animate-spin mr-2" /> Cargando...</>
                                ) : (
                                    <><img className="w-5 h-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google logo" />Ingresar con Google</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    .input-effect {
                        transition: all 0.3s ease;
                    }
                    .input-effect:focus {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }
                    .btn-hover:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    }
                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                        20%, 40%, 60%, 80% { transform: translateX(5px); }
                    }
                    .shake {
                        animation: shake 0.5s;
                    }
                `}
            </style>
        </div>
    );
};

export default Login;