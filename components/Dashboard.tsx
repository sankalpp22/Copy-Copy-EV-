import React, { useEffect, useState, lazy, Suspense, useCallback } from 'react';
import { User, Vehicle, DailyStats } from '../types';
import Markdown from 'react-markdown';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { RefreshCw, Sparkles, Cloud, Sun, CloudRain } from 'lucide-react';

const VehicleChart = lazy(() => import('./VehicleChart'));

interface Props {
  user: User;
  vehicle: Vehicle;
  dailyStats: DailyStats;
  onUpdateDailyStats: (stats: Partial<DailyStats>) => void;
}

const StatCard: React.FC<{ label: string; value: string | number; unit: string; color?: string }> = ({ label, value, unit, color = "text-emerald-500" }) => (
  <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group border border-white/5 hover:border-emerald-500/30 transition-all">
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">{label}</p>
    <div className="flex items-baseline gap-2">
      <span className={`text-5xl font-black tracking-tighter ${color}`}>{value}</span>
      <span className="text-slate-400 font-bold text-sm uppercase">{unit}</span>
    </div>
  </div>
);

const getEffectiveDate = () => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(Date.now() + istOffset);
  const hour = istDate.getUTCHours();
  if (hour < 3) {
    const yesterday = new Date(istDate.getTime() - (24 * 60 * 60 * 1000));
    return yesterday.toISOString().split('T')[0];
  }
  return istDate.toISOString().split('T')[0];
};

const Dashboard: React.FC<Props> = ({ user, vehicle, dailyStats, onUpdateDailyStats }) => {
  const [insights, setInsights] = useState<string>('Analyzing encrypted vehicle vitals...');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [activityHistory, setActivityHistory] = useState<any[]>([]);
  const [todayRange, setTodayRange] = useState<number>(0);
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [localStats, setLocalStats] = useState<DailyStats>(dailyStats);

  const handleDateChange = async (date: string) => {
    setLocalStats(prev => ({ ...prev, date }));
    if (!user.uid) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const telemetry = data.dailyTelemetry || {};
        const dateStats = telemetry[date];
        if (dateStats) {
          setLocalStats({ date, range: dateStats.range || 0, time: dateStats.time || '00:00' });
        } else {
          setLocalStats({ date, range: 0, time: '00:00' });
        }
      }
    } catch (error) {
      console.error("Error fetching date stats:", error);
    }
  };

  const fetchWeather = useCallback(async () => {
    const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
    if (!apiKey) return;

    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
        );
        const data = await response.json();
        if (data.main) {
          setWeather({
            temp: Math.round(data.main.temp),
            condition: data.weather[0].main
          });
        }
      });
    } catch (error) {
      console.error("Weather fetch error:", error);
    }
  }, []);

  const fetchInsights = useCallback(async (force = false) => {
    if (!user.uid || (isInsightsLoading && !force)) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      const now = Date.now();
      const lastUpdate = userData?.lastInsightUpdate || 0;
      const cooldown = 24 * 60 * 60 * 1000; // 24 hours
      
      if (!force && userData?.cachedInsights && (now - lastUpdate < cooldown)) {
        setInsights(userData.cachedInsights);
        return;
      }

      setIsInsightsLoading(true);
      if (force) setInsights('Re-analyzing vehicle telemetry...');
      else setInsights('Generating fresh AI insights...');
      
      const response = await fetch('api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }
      
      const data = await response.json();
      const newInsights = data.insights;
      
      await setDoc(userDocRef, {
        cachedInsights: newInsights,
        lastInsightUpdate: now
      }, { merge: true });
      
      setInsights(newInsights);
    } catch (error: any) {
      console.error("Error handling insights:", error);
      setInsights(`Unable to load insights: ${error.message || 'Unknown error'}`);
    } finally {
      setIsInsightsLoading(false);
    }
  }, [user.uid, vehicle, isInsightsLoading]);

  useEffect(() => {
    fetchInsights();
    fetchWeather();
  }, [fetchInsights, fetchWeather]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user.uid) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const telemetry = data.dailyTelemetry ? { ...data.dailyTelemetry } : {};
          
          // Merge current local stats for immediate feedback
          if (dailyStats.date) {
            telemetry[dailyStats.date] = dailyStats;
          }
          
          const history = Object.entries(telemetry)
            .map(([date, stats]: [string, any]) => ({
              name: date,
              val: stats.range || 0
            }))
            .sort((a, b) => b.name.localeCompare(a.name)) // Sort by date descending
            .slice(0, 4) // Take last 4 days
            .reverse(); // Reverse for chart display (chronological)
          
          if (history.length > 0) {
            setActivityHistory(history);
          }
        }
      } catch (error) {
        console.error("Error fetching activity history:", error);
      }
    };
    fetchHistory();
  }, [user.uid, dailyStats]);

  // Fetch today's stats specifically for the summary cards
  useEffect(() => {
    const fetchTodayStats = async () => {
      if (!user.uid) return;
      const effectiveDate = getEffectiveDate();
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const telemetry = data.dailyTelemetry || {};
          const todayStats = telemetry[effectiveDate];
          if (todayStats) {
            setTodayRange(todayStats.range || 0);
          } else {
            // Fallback to last entry
            const dates = Object.keys(telemetry).sort((a, b) => b.localeCompare(a));
            if (dates.length > 0) {
              const lastEntry = telemetry[dates[0]];
              setTodayRange(lastEntry.range || 0);
            } else {
              setTodayRange(0);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching today stats:", error);
      }
    };
    fetchTodayStats();
  }, [user.uid]);

  // Sync todayRange if dailyStats is updated for today
  useEffect(() => {
    const effectiveDate = getEffectiveDate();
    if (dailyStats.date === effectiveDate) {
      setTodayRange(dailyStats.range);
    }
  }, [dailyStats.range, dailyStats.date]);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Smart Navigation</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/20">Current Session</span>
            <p className="text-slate-500 font-bold text-sm">{vehicle.year} {vehicle.make} • {vehicle.model}</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (!showLog) setLocalStats(dailyStats);
            setShowLog(!showLog);
          }}
          className="bg-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all border border-white/10 active:scale-95 shadow-xl"
        >
          {showLog ? '✕ Terminate Log' : '➕ Your EV activity'}
        </button>
      </header>

      {showLog && (
        <div className="glass-card p-10 rounded-[2.5rem] border-emerald-500/30 animate-zoom-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Date</label>
              <input 
                type="date" 
                value={localStats.date} 
                max={new Date().toISOString().split('T')[0]}
                onChange={e => handleDateChange(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white font-black text-xl [color-scheme:dark] outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Distance Covered Today (KM)</label>
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden focus-within:border-emerald-500 transition-all">
                <button 
                  onClick={() => setLocalStats(prev => ({ ...prev, range: Math.max(0, prev.range - 5) }))} 
                  className="px-6 py-4 hover:bg-slate-800 text-xl text-emerald-500 font-black"
                >
                  -
                </button>
                <input 
                  type="number" 
                  value={localStats.range} 
                  onChange={e => setLocalStats(prev => ({ ...prev, range: parseInt(e.target.value) || 0 }))} 
                  className="w-full text-center bg-transparent border-none outline-none font-black text-2xl text-white" 
                />
                <button 
                  onClick={() => setLocalStats(prev => ({ ...prev, range: prev.range + 5 }))} 
                  className="px-6 py-4 hover:bg-slate-800 text-xl text-emerald-500 font-black"
                >
                  +
                </button>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Time Spent</label>
              <input 
                type="time" 
                value={localStats.time} 
                onChange={e => setLocalStats(prev => ({ ...prev, time: e.target.value }))} 
                className="w-full bg-slate-900 border border-slate-800 p-4 rounded-2xl text-white font-black text-xl [color-scheme:dark] outline-none focus:border-emerald-500 transition-all" 
              />
            </div>
          </div>
          <button 
            onClick={() => {
              onUpdateDailyStats(localStats);
              setShowLog(false);
            }} 
            className="w-full mt-10 emerald-gradient text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl active:scale-[0.99]"
          >
            Add Data Log
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <StatCard label="Today's activity" value={todayRange} unit="km" />
        <StatCard label="Current SoC %" value={98} unit="%" color="text-white" />
        <StatCard label="EV Mileage" value={Math.max(0, vehicle.currentRange - todayRange)} unit="km" color="text-cyan-400" />
        {weather ? (
          <div className="glass-card p-8 rounded-[2.5rem] relative overflow-hidden group border border-white/5 hover:border-emerald-500/30 transition-all">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Local Weather</p>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter text-amber-400">{weather.temp}</span>
                <span className="text-slate-400 font-bold text-sm uppercase">°C</span>
              </div>
              <div className="flex flex-col items-center">
                {weather.condition.toLowerCase().includes('cloud') ? <Cloud className="w-8 h-8 text-slate-400" /> : 
                 weather.condition.toLowerCase().includes('rain') ? <CloudRain className="w-8 h-8 text-blue-400" /> :
                 <Sun className="w-8 h-8 text-amber-400" />}
                <span className="text-[10px] font-black text-slate-500 uppercase mt-1">{weather.condition}</span>
              </div>
            </div>
          </div>
        ) : (
          <StatCard label="System Status" value="Optimal" unit="OK" color="text-emerald-500" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 glass-card p-10 rounded-[2.5rem] h-[450px] relative border border-white/5">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Charge Depletion Analysis
          </h3>
          <div className="h-[280px]">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center bg-white/5 rounded-2xl animate-pulse">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Loading Analytics...</p>
              </div>
            }>
              <VehicleChart data={activityHistory} />
            </Suspense>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-white/5 p-12 rounded-[2.5rem] flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full -mr-40 -mt-40 blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-emerald-500 text-sm font-black flex items-center gap-2 uppercase tracking-widest">
                <span className="p-2 bg-emerald-500/10 rounded-xl"><Sparkles className="w-4 h-4" /></span> Intelligence Briefing
              </h3>
              <button 
                onClick={() => fetchInsights(true)}
                disabled={isInsightsLoading}
                className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-emerald-500 transition-colors uppercase tracking-widest disabled:opacity-50 group/refresh"
              >
                <RefreshCw className={`w-3 h-3 ${isInsightsLoading ? 'animate-spin' : 'group-hover/refresh:rotate-180 transition-transform duration-500'}`} />
                {isInsightsLoading ? 'Updating...' : 'Refresh'}
              </button>
            </div>
            <div className="bg-white/5 border border-white/5 p-8 rounded-3xl min-h-[220px] backdrop-blur-md">
              <div className="text-emerald-50/90 text-sm leading-loose font-medium opacity-90 markdown-body">
                <Markdown>{insights}</Markdown>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mt-10 text-center">System Optimized for {vehicle.make} OS</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;