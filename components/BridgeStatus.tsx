import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface BridgeStep {
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
}

interface BridgeStatusProps {
  steps: BridgeStep[];
  currentStep: number;
}

const BridgeStatus: React.FC<BridgeStatusProps> = ({ steps, currentStep }) => {
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-900 rounded-lg p-6 mt-4">
      <div className="space-y-4">
        {steps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start space-x-4"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              {step.status === 'completed' ? (
                <FaCheckCircle className="w-6 h-6 text-green-500" />
              ) : step.status === 'processing' ? (
                <FaSpinner className="w-6 h-6 text-purple-500 animate-spin" />
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-medium ${
                currentStep >= index ? 'text-white' : 'text-gray-400'
              }`}>
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default BridgeStatus; 