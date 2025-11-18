import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Usuarios from './components/Usuarios';
import Entrenadores from './components/Entrenadores';
import Recepcion from './components/Recepcion';
import './App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children, allowedRoles, userRole }) => {
  if (!auth.currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    switch (userRole) {
      case 'admin': return <Navigate to="/Dashboard" replace />;
      case 'recepcion': return <Navigate to="/recepcion" replace />;
      case 'entrenador': return <Navigate to="/entrenadores" replace />;
      default: return <Navigate to="/usuarios" replace />;
    }
  }

  return children;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
     
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          const role = userDoc.data()?.rol || 'cliente';
          setUserRole(role);
        } catch (error) {
          setUserRole('cliente'); 
        }
        setUser(user);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate 
                to={
                  userRole === 'admin' ? '/Dashboard' :
                  userRole === 'recepcion' ? '/recepcion' :
                  userRole === 'entrenador' ? '/entrenadores' :
                  '/usuarios'
                } 
                replace 
              />
            ) : (
              <Login />
            )
          } 
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']} userRole={userRole}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recepcion"
          element={
            <ProtectedRoute allowedRoles={['recepcion']} userRole={userRole}>
              {<Recepcion /> }
            </ProtectedRoute>
          }
        />

        <Route
          path="/entrenadores"
          element={
            <ProtectedRoute allowedRoles={['entrenador']} userRole={userRole}>
              <Entrenadores />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute allowedRoles={['cliente']} userRole={userRole}>
              {<Usuarios />}
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;