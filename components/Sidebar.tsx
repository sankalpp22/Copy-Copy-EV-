import React from 'react';
import { NavSection } from '../types';

interface Props {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  userName: string;
}

const Sidebar: React.FC<Props> = ({ activeSection, onNavigate, userName }) => {
  const navItems = [
    { id: NavSection.HOME, label: 'Home', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { id: NavSection.EXPLORE, label: 'Explore', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
    { id: NavSection.PROFILE, label: 'Your Profile Information', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a7 7 0 0112 0v1" /></svg>
    )},
  ];

  return (
    <div className="w-64 md:w-72 bg-slate-900 border-r border-white/5 flex flex-col h-full shrink-0 shadow-2xl relative z-20">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight leading-none">Your EV</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Navigation</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-semibold text-sm text-left ${
                activeSection === item.id
                  ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-300 border border-transparent'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-white/10 shadow-inner">
            <img src={`https://ui-avatars.com/api/?name=${userName}&background=10b981&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-100 truncate">{userName}</p>
            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Premium Fleet</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;