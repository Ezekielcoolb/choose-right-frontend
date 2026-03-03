import React from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, 
  Building2, 
  Briefcase, 
  UserCircle, 
  ArrowRight,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";

export default function LandingPage() {
  const portals = [
    {
      title: "Admin Portal",
      description: "Complete system oversight, branch management, and reporting.",
      icon: <ShieldCheck className="h-8 w-8" />,
      link: "/admin/login",
      color: "bg-slate-900",
      hoverColor: "hover:bg-slate-800",
    },
    {
      title: "Branch Manager",
      description: "Manage branch operations, CSOs, and local savings growth.",
      icon: <Building2 className="h-8 w-8" />,
      link: "/manager/login",
      color: "bg-blue-600",
      hoverColor: "hover:bg-blue-700",
    },
    {
      title: "Field Officer (CSO)",
      description: "Onboard customers, collection management, and field operations.",
      icon: <Briefcase className="h-8 w-8" />,
      link: "/cso/login",
      color: "bg-emerald-600",
      hoverColor: "hover:bg-emerald-700",
    },
    {
       title: "Customer Portal",
       description: "Monitor your savings, loan status, and financial growth.",
       icon: <UserCircle className="h-8 w-8" />,
       link: "/customer/login",
       color: "bg-indigo-600",
       hoverColor: "hover:bg-indigo-700",
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-slate-900 p-1.5 text-white">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 uppercase">HI CHOOSE RIGHT NIG ENT</span>
          </div>
          <div className="flex gap-4">
            <Link to="/customer/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Customer Login</Link>
            <Link to="/admin/login" className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-800">Admin</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pb-24 pt-20">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-400 blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Modern Financial <span className="text-blue-600">Growth</span> & Management
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            The all-in-one platform for cooperative savings, loan management, and field operations. 
            Empowering financial inclusion through efficient digital workflows.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button 
                onClick={() => document.getElementById('portals').scrollIntoView({ behavior: 'smooth' })}
                className="rounded-full bg-slate-900 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800"
            >
              Access Portal
            </button>
            <button className="rounded-full border border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition hover:bg-slate-50">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Stats/Features Preview */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-2xl bg-blue-100 p-3 text-blue-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Secure Banking</h3>
              <p className="mt-2 text-sm text-slate-500">Industry standard encryption and secure data handling for all transactions.</p>
            </div>
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Real-time Sync</h3>
              <p className="mt-2 text-sm text-slate-500">Instantly synchronize field collections with the main dashboard.</p>
            </div>
            <div className="flex flex-col items-center p-6 text-center">
              <div className="mb-4 rounded-2xl bg-indigo-100 p-3 text-indigo-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Scalable Architecture</h3>
              <p className="mt-2 text-sm text-slate-500">Designed to grow with your cooperative from one branch to hundreds.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Portal Selection */}
      <section id="portals" className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Choose Your Portal</h2>
            <p className="mt-4 text-lg text-slate-600">Select the appropriate access point to begin your session.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {portals.map((portal, index) => (
              <Link
                key={index}
                to={portal.link}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:border-slate-200 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`mb-6 inline-flex w-fit rounded-2xl ${portal.color} p-4 text-white shadow-lg shadow-${portal.color.split('-')[1]}-200 transition-transform group-hover:scale-110`}>
                  {portal.icon}
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-900">{portal.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {portal.description}
                </p>
                <div className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span>Sign in now</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="rounded-lg bg-slate-900 p-1 text-white scale-75">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 uppercase">HI CHOOSE RIGHT NIG ENT</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} HI CHOOSE RIGHT NIG ENT Financial Systems. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
