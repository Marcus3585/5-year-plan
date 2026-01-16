import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GDPState } from '../types';

interface CityViewProps {
  gdp: GDPState;
  year: number;
  isWinter: boolean;
  hasRocket: boolean;
  rocketLaunched: boolean;
}

const CityView: React.FC<CityViewProps> = ({ gdp, year, isWinter, hasRocket, rocketLaunched }) => {
  // Normalize values to item counts for visualization
  const factoryCount = Math.min(20, Math.floor(gdp.heavy / 60));
  const houseCount = Math.min(15, Math.floor(gdp.light / 50));
  // Reduce crop density if it's "Great Famine" years or low GDP
  const isFamine = year >= 1959 && year <= 1961;
  const cropDensity = isFamine ? 80 : Math.max(10, 50 - Math.floor(gdp.agri / 30));

  // Background color based on pollution (heavy industry)
  const pollution = Math.min(100, gdp.heavy / 10);
  const skyColor = `rgb(${Math.max(100, 135 - pollution)}, ${Math.max(100, 206 - pollution)}, ${Math.max(100, 235 - pollution / 2)})`;

  return (
    <div 
      className="relative w-full h-64 overflow-hidden border-4 border-[#d0c8b8] rounded-lg shadow-inner transition-colors duration-1000"
      style={{ backgroundColor: skyColor }}
    >
        {/* Clouds */}
        <motion.div 
            className="absolute top-4 left-0 text-white opacity-60"
            animate={{ x: ["-10%", "110%"] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        >
            ☁️
        </motion.div>
        <motion.div 
            className="absolute top-10 left-0 text-white opacity-40"
            animate={{ x: ["-10%", "110%"] }}
            transition={{ repeat: Infinity, duration: 35, ease: "linear", delay: 5 }}
        >
            ☁️
        </motion.div>

        {/* Rocket Launch Animation */}
        <AnimatePresence>
            {hasRocket && (
                <motion.div 
                    className="absolute right-10 bottom-16 z-10 flex flex-col items-center"
                    initial={{ y: 100 }}
                    animate={rocketLaunched ? { y: -500, opacity: 0 } : { y: 0, opacity: 1 }}
                    transition={rocketLaunched ? { duration: 4, ease: "easeIn" } : { duration: 1 }}
                >
                    <div className="text-4xl">🚀</div>
                    <div className="w-4 h-12 bg-gray-700 mt-[-5px]"></div>
                    {rocketLaunched && (
                         <motion.div 
                            className="mt-1 text-orange-500 font-bold"
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0] }}
                            transition={{ repeat: Infinity }}
                         >
                            🔥
                         </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>


        {/* Ground */}
        <div className={`absolute bottom-0 w-full h-[30%] ${isFamine ? 'bg-[#c4a484]' : 'bg-[#8B5A2B]'} transition-colors duration-1000`} />

        {/* Crops (Foreground) */}
        <div className="absolute bottom-2 w-full flex justify-around px-4 pointer-events-none z-20">
            {Array.from({ length: 15 }).map((_, i) => (
                 (i * 10) % cropDensity === 0 && (
                    <motion.div
                        key={`crop-${i}`}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`text-2xl origin-bottom ${isFamine ? 'grayscale opacity-60' : ''}`}
                    >
                        🌾
                    </motion.div>
                 )
            ))}
        </div>

        {/* Heavy Industry (Factories) */}
        <div className="absolute bottom-[20%] left-4 flex space-x-2 z-10 items-end">
            <AnimatePresence>
                {Array.from({ length: factoryCount }).map((_, i) => (
                    <motion.div
                        key={`factory-${i}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="relative flex flex-col items-center"
                    >
                        {/* Smoke Particles */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                            <motion.div
                                className="w-2 h-2 rounded-full bg-gray-400 opacity-70"
                                animate={{ y: -40, scale: 3, opacity: 0 }}
                                transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                            />
                        </div>
                        <div className="w-8 h-12 bg-stone-700 border border-stone-800 relative shadow-lg">
                            <div className="w-2 h-6 bg-stone-600 absolute right-1 -top-6"></div>
                            <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                                <div className="bg-yellow-100 opacity-20"></div>
                                <div className="bg-yellow-100 opacity-20"></div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Light Industry (Houses/Shops) */}
        <div className="absolute bottom-[15%] right-16 flex space-x-1 z-15 items-end">
             <AnimatePresence>
                {Array.from({ length: houseCount }).map((_, i) => (
                    <motion.div
                        key={`house-${i}`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-6 h-8 bg-amber-100 border border-amber-800 shadow-md relative"
                    >
                        <div className="absolute -top-3 left-0 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[12px] border-b-red-800"></div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Legend/Caption */}
        <div className="absolute bottom-1 right-2 text-xs text-white drop-shadow-md opacity-80 z-30">
            {isFamine ? "⚠️ 農業危機" : "國家面貌概覽"}
        </div>
    </div>
  );
};

export default CityView;