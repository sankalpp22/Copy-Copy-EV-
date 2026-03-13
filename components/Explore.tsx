import React, { useState, useEffect, useCallback } from 'react';
import Markdown from 'react-markdown';

const Explore: React.FC = () => {
  const [location, setLocation] = useState('Detecting location...');
  const [chargers, setChargers] = useState<string>('Scan the area to find high-performance charging infrastructure.');
  const [isLoading, setIsLoading] = useState(false);

  const fetchChargers = useCallback(async (loc?: string) => {
    const targetLoc = loc || location;
    setIsLoading(true);
    setChargers('Scanning infrastructure grid...');
    try {
      const response = await fetch('api/chargers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: targetLoc })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch chargers');
      }
      
      const data = await response.json();
      setChargers(data.chargers);
    } catch (error: any) {
      console.error("Error fetching chargers:", error);
      setChargers(`Unable to locate charging nodes: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [location]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const locString = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          setLocation(locString);
          fetchChargers(locString);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocation("New York, NY"); // Fallback
          fetchChargers("New York, NY");
        }
      );
    } else {
      setLocation("New York, NY");
      fetchChargers("New York, NY");
    }
  }, [fetchChargers]);

  return (
    <div className="p-10 max-w-6xl mx-auto space-y-10 animate-fade-in">
      <header>
        <h2 className="text-4xl font-black text-white tracking-tight">Network Explorer</h2>
        <p className="text-slate-500 mt-2 font-medium">Locate high-performance charging infrastructure</p>
      </header>

      <div className="glass-card p-2 rounded-2xl border border-white/5 flex items-center shadow-2xl">
        <div className="px-5 text-emerald-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <input 
          type="text" 
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Sector or Zip Code..."
          className="flex-1 bg-transparent px-2 py-4 outline-none text-slate-100 font-bold"
        />
        <button 
          onClick={() => fetchChargers()}
          disabled={isLoading}
          className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Scanning...' : 'Scan Area'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-slate-900 rounded-[2.5rem] h-[550px] relative overflow-hidden border border-white/5 shadow-inner">
          <img 
            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?q=80&w=1200&auto=format&fit=crop" 
            alt="Map Grid" 
            className="w-full h-full object-cover opacity-20 grayscale scale-110"
          />
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="glass-card p-10 rounded-[2rem] text-center max-w-sm border-white/10 backdrop-blur-3xl">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">📍</div>
              <h4 className="font-black text-white mb-2 tracking-tight">Active Navigation</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">
                Live grid synchronization is being prepared for your current coordinates.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 p-8 rounded-[2.5rem] shadow-xl h-full flex flex-col">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-3">
              <span className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 uppercase">⚡</span> Charging Nodes
            </h3>
            
            <div className="flex-1 overflow-y-auto brand-scroll pr-2">
              <div className="text-slate-100 text-sm font-medium leading-relaxed markdown-body">
                <Markdown>{chargers}</Markdown>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Quick Filters</p>
              <div className="flex flex-wrap gap-2">
                {['High Speed', 'Open Now', 'Public'].map(f => (
                  <span key={f} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-slate-400 cursor-pointer hover:border-emerald-500/30 hover:text-emerald-400 transition-all uppercase tracking-widest">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;