import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaExchangeAlt, FaTimes } from 'react-icons/fa';
import BridgeStatus from './BridgeStatus';

interface BridgingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceChain: string;
  destinationChain: string;
  bridgeSteps: {
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'completed';
  }[];
  currentStep: number;
}

const BridgingModal: React.FC<BridgingModalProps> = ({
  isOpen,
  onClose,
  sourceChain,
  destinationChain,
  bridgeSteps,
  currentStep,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Bridge Progress</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <FaTimes className="text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Chain Information */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">From</p>
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  <span className="text-white">{sourceChain}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                <FaExchangeAlt className="text-purple-500 text-xl" />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">To</p>
                <div className="bg-gray-800 px-4 py-2 rounded-lg">
                  <span className="text-white">{destinationChain}</span>
                </div>
              </div>
            </div>

            {/* Bridge Status */}
            <BridgeStatus steps={bridgeSteps} currentStep={currentStep} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgingModal; 