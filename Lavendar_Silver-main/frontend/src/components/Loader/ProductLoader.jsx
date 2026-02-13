import React from 'react';
import { motion } from 'framer-motion';
import './ProductLoader.css';

const ProductLoader = () => {
    return (
        <div className="product-loader">
            <motion.svg
                width="100"
                height="100"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Diamond Shape */}
                <motion.path
                    d="M50 10L90 50L50 90L10 50L50 10Z"
                    stroke="#B38B59"
                    strokeWidth="4"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{
                        pathLength: 1,
                        opacity: 1,
                        rotate: 360
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                {/* Inner Diamond */}
                <motion.path
                    d="M50 30L70 50L50 70L30 50L50 30Z"
                    fill="#B38B59"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                        scale: [0.8, 1, 0.8],
                        opacity: [0.3, 1, 0.3]
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                {/* Sparkles */}
                <motion.circle
                    cx="50"
                    cy="20"
                    r="2"
                    fill="#B38B59"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1, 0] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5
                    }}
                />
                <motion.circle
                    cx="80"
                    cy="50"
                    r="2"
                    fill="#B38B59"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1, 0] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        delay: 0.3
                    }}
                />
                <motion.circle
                    cx="50"
                    cy="80"
                    r="2"
                    fill="#B38B59"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1, 0] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        delay: 0.6
                    }}
                />
                <motion.circle
                    cx="20"
                    cy="50"
                    r="2"
                    fill="#B38B59"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1, 0] }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                        delay: 0.9
                    }}
                />
            </motion.svg>
            <motion.p
                className="loader-text"
                initial={{ opacity: 0 }}
                animate={{
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                Please wait...
            </motion.p>
        </div>
    );
};

export default ProductLoader;
