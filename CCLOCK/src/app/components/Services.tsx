import React from 'react';
import { motion } from 'motion/react';
import { Layout, Palette, Code, Smartphone } from 'lucide-react';

const services = [
  {
    icon: <Palette className="w-8 h-8" />,
    title: "Branding",
    desc: "Building cohesive visual identities that tell your story and resonate with your audience."
  },
  {
    icon: <Layout className="w-8 h-8" />,
    title: "UI/UX Design",
    desc: "User-centric interfaces that are beautiful to look at and intuitive to use."
  },
  {
    icon: <Code className="w-8 h-8" />,
    title: "Development",
    desc: "Scalable, high-performance web applications built with the latest technologies."
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "Mobile Apps",
    desc: "Native and cross-platform mobile experiences that engage users on the go."
  }
];

export const Services = () => {
  return (
    <section id="services" className="py-24 bg-gray-50 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Expertise</h2>
          <div className="w-20 h-1.5 bg-blue-600 rounded-full"></div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <div className="text-blue-600 mb-6">{s.icon}</div>
              <h3 className="text-xl font-bold mb-4">{s.title}</h3>
              <p className="text-gray-500 leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
