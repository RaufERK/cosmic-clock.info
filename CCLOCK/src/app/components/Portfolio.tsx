import React from 'react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

const projects = [
  {
    title: "Minimal Identity",
    category: "Branding",
    img: "https://images.unsplash.com/photo-1760037028636-6f42428aeeee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYnJhbmQlMjBpZGVudGl0eSUyMGRlc2lnbnxlbnwxfHx8fDE3NzA4MTM0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    title: "Digital Workspace",
    category: "Web App",
    img: "https://images.unsplash.com/photo-1760008486655-920728c9ae67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRpZ2l0YWwlMjBhcnQlMjBjcmVhdGl2ZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NzA5MTQ5Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    title: "The Creative Lab",
    category: "Interior Design",
    img: "https://images.unsplash.com/photo-1758691736843-90f58dce465e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHRlYW0lMjBicmFpbnN0b3JtaW5nJTIwb2ZmaWNlfGVufDF8fHx8MTc3MDg3Njg4NHww&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

export const Portfolio = () => {
  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-4">Featured Work</h2>
            <p className="text-gray-500">A collection of our recent client success stories.</p>
          </div>
          <button className="hidden md:block text-sm font-bold tracking-widest uppercase text-blue-600">
            View all projects —
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {projects.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-6 bg-gray-100">
                <ImageWithFallback
                  src={p.img}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-medium border border-white/40 px-6 py-2 rounded-full backdrop-blur-sm">
                    View Project
                  </span>
                </div>
              </div>
              <p className="text-sm text-blue-600 font-medium mb-1 uppercase tracking-wider">{p.category}</p>
              <h3 className="text-2xl font-bold">{p.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
