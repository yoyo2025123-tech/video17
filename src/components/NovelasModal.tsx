import React from 'react';
import { X } from 'lucide-react';

interface NovelasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NovelasModal: React.FC<NovelasModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Novelas</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="text-gray-600">
          <p>Novelas content will be displayed here.</p>
        </div>
      </div>
    </div>
  );
};

export default NovelasModal;