import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'product', count = 6 }) => {
  const ProductSkeleton = () => (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden shadow-lg border border-gray-100/50">
      {/* Image Skeleton */}
      <div className="relative h-64 bg-gradient-to-br from-gray-100 to-gray-200">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="h-6 bg-gray-200 rounded-xl mb-3 w-3/4">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-xl"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>
        <div className="h-4 bg-gray-200 rounded-lg mb-2 w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-lg"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
          />
        </div>
        <div className="h-4 bg-gray-200 rounded-lg mb-4 w-5/6">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-lg"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.4,
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded-xl w-24">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-xl"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.6,
              }}
            />
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-32">
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-xl"
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.8,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const CategorySkeleton = () => (
    <div className="flex gap-4">
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="h-12 bg-gray-200 rounded-2xl w-32"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-2xl"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      ))}
    </div>
  );

  if (type === 'category') {
    return <CategorySkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {[...Array(count)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <ProductSkeleton />
        </motion.div>
      ))}
    </div>
  );
};

export default SkeletonLoader;


