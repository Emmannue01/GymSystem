import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';

const QRCodeModal = ({ isOpen, onClose, value, studentName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-semibold mb-2">Mi Código QR</h2>
        <p className="text-gray-600 mb-4">Muestra este código para registrar tu asistencia.</p>
        <div className="p-4 bg-gray-100 rounded-lg inline-block">
          <QRCodeSVG value={value} size={200} />
        </div>
        <p className="mt-4 font-bold text-lg text-gray-800">{studentName}</p>
      </div>
    </div>
  );
};

export default QRCodeModal;