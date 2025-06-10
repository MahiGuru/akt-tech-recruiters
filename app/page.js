'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Briefcase, 
  Users, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Search,
  MapPin,
  Building
} from 'lucide-react'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-2">
              {/* <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-white" />
              </div> */}
              <span className="text-2xl font-bold text-gray-900">
                <Image src={"/logo.svg"} alt="At Bench Logo" width={'300'} height={'120'}/>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link href="/jobs" className="text-gray-600 hover:text-gray-900 transition-colors">
                Browse Jobs
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors">
                Contact
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
            >
              Find Your Dream
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent block">
                Career Today
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto"
            >
              Connect with top employers and discover opportunities that match your skills, 
              passion, and career goals in our modern recruiting platform.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/jobs" className="btn-primary text-lg px-8 py-4">
                <Search className="w-5 h-5" />
                Browse Jobs
              </Link>
              <Link href="/auth/register?role=employer" className="btn-secondary text-lg px-8 py-4">
                <Building className="w-5 h-5" />
                Post a Job
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose At Bench?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make hiring and job searching simple, efficient, and effective for everyone.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Smart Matching",
                description: "Our AI-powered system matches candidates with the perfect opportunities based on skills, experience, and preferences."
              },
              {
                icon: CheckCircle,
                title: "Easy Application",
                description: "Apply to multiple jobs with one click. Upload your resume once and apply to hundreds of positions instantly."
              },
              {
                icon: Star,
                title: "Quality Employers",
                description: "Connect with verified employers and top companies looking for talented professionals like you."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 gradient-bg rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Take the Next Step?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join thousands of professionals who have found their dream jobs through At Bench.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2">
              Get Started for Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">At Bench</span>
              </div>
              <p className="text-gray-400">
                Connecting talent with opportunity in the modern world.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/jobs" className="hover:text-white transition-colors">Browse Jobs</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">Create Profile</Link></li>
                <li><Link href="/applications" className="hover:text-white transition-colors">My Applications</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/post-job" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link href="/candidates" className="hover:text-white transition-colors">Find Candidates</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 At Bench. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
