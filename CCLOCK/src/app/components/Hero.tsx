import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tight mb-8">
              We design <br />
              <span className="text-gray-400 italic">digital</span> <br />
              experiences.
            </h1>
            <p className="text-xl text-gray-600 max-w-md mb-10 leading-relaxed">
              Award-winning agency focused on branding, UI/UX, and web development for high-growth startups and global brands.
            </p>
            <div className="flex items-center gap-6">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-xl font-medium text-lg hover:bg-blue-700 transition-colors">
                View Work
              </button>
              <button className="text-lg font-medium border-b-2 border-black pb-1">
                Our Story
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative h-[600px] rounded-3xl overflow-hidden shadow-2xl"
          >
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1705909773171-4ba952b9c0af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBtaW5pbWFsJTIwaW50ZXJpb3IlMjBkZXNpZ258ZW58MXx8fHwxNzcwOTE0OTM3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Modern office"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
