import React from 'react';
import { motion } from 'framer-motion';

const BranchCard = ({ branch, theme, onSelect, isSelected, index }) => {
  const handleDirections = (e) => {
    e.stopPropagation();
    if (branch.address) {
      const encodedAddress = encodeURIComponent(branch.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => onSelect(branch.id)}
      className={`
        relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden 
        shadow-lg hover:shadow-2xl transition-all duration-500 
        border-2 cursor-pointer
        ${isSelected 
          ? 'border-opacity-100 shadow-xl' 
          : 'border-gray-100/50 hover:border-gray-200'
        }
      `}
      style={isSelected ? {
        borderColor: theme?.primary || '#ff2d2d',
        boxShadow: theme?.primary 
          ? `0 20px 60px ${theme.primary}20, 0 0 0 1px ${theme.primary}30` 
          : '0 20px 60px rgba(255, 45, 45, 0.2)',
      } : {}}
    >
      {/* Map Preview */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {/* Simple Map Representation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        
        {/* Location Pin */}
        <div className="absolute bottom-4 right-4">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: theme?.primary || '#ff2d2d',
            }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>

        {/* Selected Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-full p-2 shadow-lg"
          >
            <svg 
              className="w-5 h-5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ color: theme?.primary || '#ff2d2d' }}
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 
          className="text-xl font-bold mb-2"
          style={{ color: theme?.text || '#1a1a1a' }}
        >
          {branch.name}
        </h3>
        
        {branch.address && (
          <p 
            className="text-sm mb-4 line-clamp-2"
            style={{ color: theme?.textSecondary || '#6b7280' }}
          >
            {branch.address}
          </p>
        )}

        {/* Status & Actions */}
        <div className="flex items-center justify-between">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${
                branch.isActive ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span 
              className="text-xs font-semibold"
              style={{ color: theme?.textSecondary || '#6b7280' }}
            >
              {branch.isActive ? 'نشط' : 'غير نشط'}
            </span>
          </div>

          {/* Directions Button */}
          {branch.address && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDirections}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md flex items-center gap-2"
              style={{
                backgroundColor: theme?.primary ? `${theme.primary}15` : 'rgba(255, 45, 45, 0.15)',
                color: theme?.primary || '#ff2d2d',
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>اتجاهات</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BranchCard;


