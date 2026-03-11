import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, VehicleCategory } from '../types';
import { FOUR_WHEELER_BRANDS, TWO_WHEELER_BRANDS, CHARGER_TYPES } from '../constants';

interface Props {
  onComplete: (vehicle: Vehicle) => void;
}

const NumericInput: React.FC<{
  label: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
}> = ({ label, value, onChange, step = 1, min = 0, max = 9999, unit }) => {
  const handleIncrement = () => {
    const newVal = Math.min(max, value + step);
    onChange(Number(newVal.toFixed(1)));
  };

  const handleDecrement = () => {
    const newVal = Math.max(min, value - step);
    onChange(Number(newVal.toFixed(1)));
  };

  return (
    <div className="flex flex-col">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1">{label}</label>
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl overflow-hidden focus-within:border-emerald-500/50 transition-all h-[54px]">
        <button
          type="button"
          onClick={handleDecrement}
          className="px-4 h-full hover:bg-white/5 text-emerald-500 font-bold transition-colors"
        >
          −
        </button>
        <div className="flex-1 flex items-center justify-center gap-1 h-full">
          <input
            type="number"
            className="w-full text-center bg-transparent border-none outline-none font-bold text-slate-100 p-0 [appearance:textfield]"
            value={value}
            onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) onChange(Number(v.toFixed(1)));
            }}
          />
          {unit && <span className="text-slate-500 text-[10px] font-bold pr-2 uppercase">{unit}</span>}
        </div>
        <button
          type="button"
          onClick={handleIncrement}
          className="px-4 h-full hover:bg-white/5 text-emerald-500 font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
};

const VehicleForm: React.FC<Props> = ({ onComplete }) => {
  const [category, setCategory] = useState<VehicleCategory>(VehicleCategory.FOUR_WHEELER);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<Vehicle>({
    category: VehicleCategory.FOUR_WHEELER,
    make: '',
    model: '',
    year: new Date().getFullYear().toString(),
    currentRange: 300,
    homeChargerRating: 7.4,
    chargerType: '',
    batteryCapacity: 60,
    efficiency: 150,
    usableSOCMin: 10,
    usableSOCMax: 90
  });

  const availableBrands = category === VehicleCategory.FOUR_WHEELER 
    ? FOUR_WHEELER_BRANDS 
    : (category === VehicleCategory.TWO_WHEELER ? TWO_WHEELER_BRANDS : []);

  const selectedBrandInfo = availableBrands.find(b => b.name === formData.make);
  const availableModels = selectedBrandInfo?.models || [];

  useEffect(() => {
    setFormData(prev => ({ ...prev, category, make: '', model: '' }));
    setIsBrandDropdownOpen(false);
  }, [category]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category === VehicleCategory.THREE_WHEELER) return;

    // GENERATE SERIALIZED DATA LIST IN THE REQUESTED FORMAT
    // Format: TypeofVehicle_BrandName_Model_Year_CurrentRange_ChargerRating_Chargertype_Battery_Efficiency_SOCMin_SOCMax
    const serializedVehicleData = `${formData.category}_${formData.make}_${formData.model}_${formData.year}_${formData.currentRange}_${formData.homeChargerRating}_${formData.chargerType}_${formData.batteryCapacity}_${formData.efficiency}_${formData.usableSOCMin}_${formData.usableSOCMax}`;
    
    // Log for independent editing access as requested
    console.log("VEHICLE_INITIALIZATION_STRING:", serializedVehicleData);
    
    // Proceed with app completion
    onComplete(formData);
  };

  return (
    <div className="max-w-2xl w-full glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl animate-fade-in">
      <div className="bg-slate-900/50 p-10 text-center border-b border-white/5">
        <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Register Your EV</h2>
        <p className="text-slate-400 text-xs mt-1 font-medium tracking-wide">Enter vehicle Information to initialize tracking</p>
      </div>

      <div className="px-8 pt-8 flex gap-3">
        {Object.values(VehicleCategory).map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`flex-1 py-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 ${
              category === cat 
                ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-500 shadow-lg shadow-emerald-500/5' 
                : 'border-white/5 text-slate-500 hover:border-white/10 bg-white/5'
            }`}
          >
            <span className="text-2xl">
              {cat === VehicleCategory.FOUR_WHEELER ? '🚗' : cat === VehicleCategory.TWO_WHEELER ? '🛵' : '🛺'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest">{cat}</span>
          </button>
        ))}
      </div>

      {category === VehicleCategory.THREE_WHEELER ? (
        <div className="p-20 text-center animate-fade-in">
          <div className="text-6xl mb-6 grayscale opacity-50">🚧</div>
          <h3 className="text-xl font-bold text-slate-200 tracking-tight">System Under Construction</h3>
          <p className="text-slate-500 mt-2 text-sm max-w-xs mx-auto leading-relaxed">
            Integration for 3-wheeler fleets is currently being calibrated. Please check back soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 animate-slide-up">
          <div className="relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Brand Name</label>
            <button
              type="button"
              onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500/50 transition-all outline-none h-[54px]"
            >
              <div className="flex items-center gap-3">
                {selectedBrandInfo ? (
                  <>
                    <img src={selectedBrandInfo.logo} className="w-5 h-5 object-contain" alt="" />
                    <span className="font-bold text-slate-200 text-sm">{selectedBrandInfo.name}</span>
                  </>
                ) : (
                  <span className="text-slate-500 font-bold text-sm">Select Brand</span>
                )}
              </div>
              <svg className={`w-4 h-4 text-slate-600 transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {isBrandDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
                <div className="max-h-60 overflow-y-auto brand-scroll">
                  {availableBrands.map(b => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setFormData({...formData, make: b.name, model: ''});
                        setIsBrandDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-4 px-5 py-4 hover:bg-emerald-600/10 transition-colors text-left border-b border-white/5 last:border-0"
                    >
                      <img src={b.logo} className="w-6 h-6 object-contain" alt="" />
                      <span className={`font-bold text-sm ${formData.make === b.name ? 'text-emerald-500' : 'text-slate-300'}`}>
                        {b.name}
                      </span>
                      {formData.make === b.name && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Model</label>
            <select
              className="w-full px-3.5 rounded-xl border border-slate-800 bg-slate-900 focus:border-emerald-500/50 outline-none font-bold text-slate-200 text-sm appearance-none cursor-pointer transition-all disabled:opacity-50 h-[54px]"
              value={formData.model}
              onChange={(e) => setFormData({...formData, model: e.target.value})}
              required
              disabled={!formData.make}
            >
              <option value="">Select Model</option>
              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <NumericInput 
            label="Year" 
            value={parseInt(formData.year)} 
            onChange={(val) => setFormData({...formData, year: val.toString()})}
            min={2010}
            max={2026}
          />

          <NumericInput 
            label="Current Range" 
            value={formData.currentRange} 
            onChange={(val) => setFormData({...formData, currentRange: val})}
            unit="km"
            min={10}
          />

          <NumericInput 
            label="Home Charger" 
            value={formData.homeChargerRating} 
            onChange={(val) => setFormData({...formData, homeChargerRating: val})}
            step={0.1}
            unit="kWh"
            min={1}
          />

          <NumericInput 
            label="Battery Capacity" 
            value={formData.batteryCapacity || 0} 
            onChange={(val) => setFormData({...formData, batteryCapacity: val})}
            unit="kWh"
            min={1}
          />

          <NumericInput 
            label="Efficiency" 
            value={formData.efficiency || 0} 
            onChange={(val) => setFormData({...formData, efficiency: val})}
            unit="Wh/km"
            min={1}
          />

          <NumericInput 
            label="Min SOC" 
            value={formData.usableSOCMin || 0} 
            onChange={(val) => setFormData({...formData, usableSOCMin: val})}
            unit="%"
            min={0}
            max={100}
          />

          <NumericInput 
            label="Max SOC" 
            value={formData.usableSOCMax || 0} 
            onChange={(val) => setFormData({...formData, usableSOCMax: val})}
            unit="%"
            min={0}
            max={100}
          />

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Charger Type</label>
            <select
              className="w-full px-3.5 rounded-xl border border-slate-800 bg-slate-900 focus:border-emerald-500/50 outline-none font-bold text-slate-200 text-sm appearance-none cursor-pointer h-[54px] transition-all"
              value={formData.chargerType}
              onChange={(e) => setFormData({...formData, chargerType: e.target.value})}
              required
            >
              <option value="">Select Type</option>
              {CHARGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/10 active:scale-[0.98]"
            >
              Initialize Dashboard
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default VehicleForm;