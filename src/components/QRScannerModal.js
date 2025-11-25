import React, { useState, useEffect } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { X, CameraOff } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScan }) => {
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  const handleError = (err) => {
    if (err?.name === 'NotAllowedError') {
      setError('Permiso para acceder a la cámara denegado. Por favor, habilita el acceso en la configuración de tu navegador.');
    } else {
      setError('Ocurrió un error al acceder a la cámara.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 z-10"
          
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-4">Escanear Código QR</h2>
        <div className="border rounded-lg overflow-hidden">
          <Scanner
            onScan={(result) => onScan(result[0].rawValue)}
            onError={(error) => console.log(error?.message)}
          />
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Apunta la cámara al código QR.
        </p>
        {error ? (
          <div className="text-center py-8 px-4 bg-red-50 rounded-lg border border-red-200">
            <h3 className="text-lg font-medium text-red-800">Error de Cámara</h3>
            <p className="text-sm text-red-600 mt-2">{error}</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScannerModal;