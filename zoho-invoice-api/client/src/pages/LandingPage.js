import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../assets/logo.png';
import hero from '../assets/hero.jpg';

const testimonials = [
  {
    name: 'John Doe',
    quote: 'This is the best experience I have ever had! The team was amazing and I felt so safe and excited.',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Jane Smith',
    quote: 'Absolutely thrilling! I would recommend this to anyone looking for an adventure.',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Alex Johnson',
    quote: 'A must-do! The staff were professional and the memories will last a lifetime.',
    image: 'https://randomuser.me/api/portraits/men/65.jpg',
  },
  {
    name: 'Emily Brown',
    quote: 'Incredible! I conquered my fears and had so much fun. Thank you for the amazing experience!',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-montserrat overflow-x-hidden flex flex-col">
      {/* Navigation Bar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-white via-white/60 to-transparent transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4 md:px-8">
          <img src={logo} alt="Logo" className="h-12 md:h-16" />
          {/* No menu items in header */}
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative flex items-center justify-center min-h-screen w-screen bg-cover bg-center px-8 py-24" style={{ backgroundImage: `url(${hero})` }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50 z-0" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-3xl mx-auto px-4 py-20 text-center">
          <h1 className="text-white font-extrabold uppercase tracking-tight mb-8 drop-shadow-lg italic">
            <span className="block text-6xl md:text-8xl">EMPOWER</span>
            <span className="block text-[2.5rem] md:text-[3.5rem] lg:text-[4.4rem] -mt-6">YOUR FUTURE.</span>
          </h1>
          <div className="flex flex-row gap-6 mt-6 w-full justify-center">
            <RouterLink to="/student/login">
              <button
                className="bg-[rgb(255,84,22)] text-white font-bold italic px-10 py-4 text-xl shadow-lg hover:bg-[rgb(220,60,10)] transition-all duration-300 border-none rounded-[100px]"
              >
                Student Login
              </button>
            </RouterLink>
            <RouterLink to="/login">
              <button
                className="bg-[rgb(255,84,22)] text-white font-bold italic px-10 py-4 text-xl shadow-lg hover:bg-[rgb(220,60,10)] transition-all duration-300 border-none rounded-[100px]"
              >
                Admin Login
              </button>
            </RouterLink>
          </div>
        </div>
      </section>
    </div>
  );
} 