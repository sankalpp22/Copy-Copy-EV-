import React, { useState, useEffect, useRef } from 'react';
import { User, Vehicle, FileMetadata, VehicleCategory } from '../types';
import { storage, db } from '../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { FileText, Image as ImageIcon, Upload, Eye, X, Loader2, CheckCircle2 } from 'lucide-react';
import { FOUR_WHEELER_BRANDS, TWO_WHEELER_BRANDS, CHARGER_TYPES } from '../constants';

interface Props {
  user: User;
  vehicle: Vehicle;
  onReset: () => void;
  onUpdateUser: (updates: any) => Promise<void>;
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

const Profile: React.FC<Props> = ({ user, vehicle, onReset, onUpdateUser }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);
  const [emergencyInput, setEmergencyInput] = useState(user.emergencyContact || '');
  const [isSavingEmergency, setIsSavingEmergency] = useState(false);
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  
  // Vehicle Editing States
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editVehicleData, setEditVehicleData] = useState<Vehicle>(vehicle);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  
  const [currentLocation, setCurrentLocation] = useState('Detecting location...');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user.emergencyContact && !isEditingEmergency) {
      setEmergencyInput(user.emergencyContact);
    }
  }, [user.emergencyContact, isEditingEmergency]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          
          if (apiKey) {
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
              );
              const data = await response.json();
              if (data.results && data.results[0]) {
                setCurrentLocation(data.results[0].formatted_address);
              } else {
                setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
              }
            } catch (error) {
              console.error("Geocoding error:", error);
              setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
            }
          } else {
            setCurrentLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          setCurrentLocation("Location access denied");
        }
      );
    } else {
      setCurrentLocation("Geolocation not supported");
    }
  }, []);

  useEffect(() => {
    if (!user.uid) return;

    const filesQuery = query(
      collection(db, 'users', user.uid, 'files'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(filesQuery, (snapshot) => {
      const fetchedFiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FileMetadata[];
      setFiles(fetchedFiles);
    });

    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setIsBrandDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isEditingVehicle) {
      setEditVehicleData(vehicle);
    }
  }, [vehicle, isEditingVehicle]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.uid) return;

    // Validate file type and size
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert('Only PDF and JPEG/PNG files are allowed.');
      return;
    }

    if (file.size > maxSize) {
      alert('File size exceeds 5MB limit.');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/documents/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, 'users', user.uid, 'files'), {
        fileName: file.name,
        downloadURL,
        fileType: file.type,
        createdAt: Date.now()
      });

      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEmergency = async () => {
    const digitsOnly = emergencyInput.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      alert('Please enter a valid 10-digit phone number.');
      return;
    }
    setIsSavingEmergency(true);
    try {
      await onUpdateUser({ emergencyContact: digitsOnly });
    } finally {
      setIsSavingEmergency(false);
    }
  };

  const handleSaveVehicle = async () => {
    if (!editVehicleData.make || !editVehicleData.model || !editVehicleData.chargerType) {
      alert('Please fill in all vehicle details.');
      return;
    }

    setIsSavingVehicle(true);
    try {
      await onUpdateUser({ vehicle: editVehicleData });
      setIsEditingVehicle(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating vehicle:", error);
      alert("Failed to update vehicle profile.");
    } finally {
      setIsSavingVehicle(false);
    }
  };

  const availableBrands = editVehicleData.category === VehicleCategory.FOUR_WHEELER 
    ? FOUR_WHEELER_BRANDS 
    : (editVehicleData.category === VehicleCategory.TWO_WHEELER ? TWO_WHEELER_BRANDS : []);

  const selectedBrandInfo = availableBrands.find(b => b.name === editVehicleData.make);
  const availableModels = selectedBrandInfo?.models || [];

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 animate-fade-in pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">User Profile</h2>
          <p className="text-slate-500 mt-1 font-medium">Manage your identity and vehicle credentials</p>
        </div>
        <button 
          onClick={onReset}
          className="flex items-center gap-3 px-6 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 font-black text-xs uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
        >
          <span>Logout</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="glass-card p-10 rounded-[2.5rem] border-white/5 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/5 rounded-full -ml-20 -mt-20 blur-3xl"></div>
          
          <div className="relative z-10 flex items-center gap-8 mb-12">
            <div className="relative">
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className="w-28 h-28 rounded-[2rem] object-cover border-2 border-emerald-500/20 shadow-2xl p-1 bg-slate-900"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" /></svg>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">{user.name}</h3>
              <p className="text-slate-500 font-bold text-sm tracking-wide">{user.email}</p>
              <div className="mt-4 flex items-center gap-2">
                 <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-500/20">Verified Profile</span>
              </div>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="py-4 border-b border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Emergency Contact</span>
                {user.emergencyContact && !isEditingEmergency && (
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-100 text-sm">{user.emergencyContact}</span>
                    <button 
                      onClick={() => setIsEditingEmergency(true)}
                      className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              {(!user.emergencyContact || isEditingEmergency) && (
                <div className="flex gap-2">
                  <input 
                    type="tel" 
                    value={emergencyInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setEmergencyInput(val);
                    }}
                    placeholder="10-digit number"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all"
                  />
                  <div className="flex gap-1">
                    <button 
                      onClick={async () => {
                        await handleSaveEmergency();
                        setIsEditingEmergency(false);
                      }}
                      disabled={isSavingEmergency}
                      className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
                    >
                      {isSavingEmergency ? 'Saving...' : 'Save'}
                    </button>
                    {isEditingEmergency && (
                      <button 
                        onClick={() => {
                          setIsEditingEmergency(false);
                          setEmergencyInput(user.emergencyContact || '');
                        }}
                        className="px-4 py-2 bg-white/5 text-slate-400 text-[10px] font-black uppercase rounded-lg hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center py-4 border-b border-white/5">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Active Region</span>
              <span className="font-bold text-slate-100 text-sm">{currentLocation}</span>
            </div>
            <div className="flex justify-between items-center py-4">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Data Synchronization</span>
              <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">Real-Time</span>
            </div>
          </div>
        </section>

        <section className="bg-slate-900/50 p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between shadow-2xl group transition-all hover:border-emerald-500/20 relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-emerald-500/5 rounded-full -mr-30 -mb-30 blur-3xl"></div>
          
          <div className="flex justify-between items-start mb-12 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                {isEditingVehicle ? 'Edit Vehicle Profile' : 'Your Vehicle Details'}
              </h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                {isEditingVehicle ? 'Modify your EV specifications' : `Designation: ${vehicle.make.toUpperCase()}-NAV-01`}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>

          {showSuccess && (
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Updated Successfully</span>
            </div>
          )}

          <div className="space-y-6 relative z-10">
            {isEditingVehicle ? (
              <div className="grid grid-cols-1 gap-5 animate-slide-up">
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(VehicleCategory).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditVehicleData({...editVehicleData, category: cat, make: '', model: ''})}
                      className={`py-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${
                        editVehicleData.category === cat 
                          ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-500' 
                          : 'border-white/5 text-slate-500 bg-white/5'
                      }`}
                    >
                      <span className="text-lg">
                        {cat === VehicleCategory.FOUR_WHEELER ? '🚗' : cat === VehicleCategory.TWO_WHEELER ? '🛵' : '🛺'}
                      </span>
                      <span className="text-[8px] font-bold uppercase tracking-widest">{cat}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative" ref={brandDropdownRef}>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 block">Brand</label>
                    <button
                      type="button"
                      onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500/50 transition-all outline-none h-[48px]"
                    >
                      <div className="flex items-center gap-2">
                        {selectedBrandInfo ? (
                          <>
                            <img src={selectedBrandInfo.logo} className="w-4 h-4 object-contain" alt="" />
                            <span className="font-bold text-slate-200 text-xs">{selectedBrandInfo.name}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 font-bold text-xs">Select</span>
                        )}
                      </div>
                      <svg className={`w-3 h-3 text-slate-600 transition-transform ${isBrandDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {isBrandDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                        {availableBrands.map(b => (
                          <button
                            key={b.name}
                            type="button"
                            onClick={() => {
                              setEditVehicleData({...editVehicleData, make: b.name, model: ''});
                              setIsBrandDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-600/10 transition-colors text-left border-b border-white/5 last:border-0"
                          >
                            <img src={b.logo} className="w-5 h-5 object-contain" alt="" />
                            <span className={`font-bold text-xs ${editVehicleData.make === b.name ? 'text-emerald-500' : 'text-slate-300'}`}>
                              {b.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 block">Model</label>
                    <select
                      className="w-full px-3 rounded-xl border border-slate-800 bg-slate-900 focus:border-emerald-500/50 outline-none font-bold text-slate-200 text-xs appearance-none cursor-pointer h-[48px] transition-all disabled:opacity-50"
                      value={editVehicleData.model}
                      onChange={(e) => setEditVehicleData({...editVehicleData, model: e.target.value})}
                      disabled={!editVehicleData.make}
                    >
                      <option value="">Select</option>
                      {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumericInput 
                    label="Year" 
                    value={parseInt(editVehicleData.year)} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, year: val.toString()})}
                    min={2010}
                    max={2026}
                  />
                  <NumericInput 
                    label="Range (km)" 
                    value={editVehicleData.currentRange} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, currentRange: val})}
                    min={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumericInput 
                    label="Charger (kWh)" 
                    value={editVehicleData.homeChargerRating} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, homeChargerRating: val})}
                    step={0.1}
                    min={1}
                  />
                  <NumericInput 
                    label="Battery (kWh)" 
                    value={editVehicleData.batteryCapacity || 0} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, batteryCapacity: val})}
                    min={1}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumericInput 
                    label="Efficiency (Wh/km)" 
                    value={editVehicleData.efficiency || 0} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, efficiency: val})}
                    min={1}
                  />
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1 block">Charger Type</label>
                    <select
                      className="w-full px-3 rounded-xl border border-slate-800 bg-slate-900 focus:border-emerald-500/50 outline-none font-bold text-slate-200 text-xs appearance-none cursor-pointer h-[48px] transition-all"
                      value={editVehicleData.chargerType}
                      onChange={(e) => setEditVehicleData({...editVehicleData, chargerType: e.target.value})}
                    >
                      <option value="">Select</option>
                      {CHARGER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <NumericInput 
                    label="Min SOC (%)" 
                    value={editVehicleData.usableSOCMin || 0} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, usableSOCMin: val})}
                    min={0}
                    max={100}
                  />
                  <NumericInput 
                    label="Max SOC (%)" 
                    value={editVehicleData.usableSOCMax || 0} 
                    onChange={(val) => setEditVehicleData({...editVehicleData, usableSOCMax: val})}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Make / Model</p>
                    <p className="font-bold text-slate-100">{vehicle.make} {vehicle.model}</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Vintage</p>
                    <p className="font-bold text-slate-100">{vehicle.year}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Standard</p>
                    <p className="font-bold text-slate-100 text-xs">{vehicle.chargerType}</p>
                  </div>
                  <div className="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Reserve</p>
                    <p className="font-black text-emerald-400 text-lg">{vehicle.currentRange} <span className="text-[10px]">KM</span></p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-10 flex gap-3">
            <button 
              onClick={() => {
                if (isEditingVehicle) {
                  handleSaveVehicle();
                } else {
                  setIsEditingVehicle(true);
                }
              }}
              disabled={isSavingVehicle}
              className="flex-1 p-5 bg-emerald-600 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 cursor-pointer hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSavingVehicle ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">
                  {isEditingVehicle ? 'Update Vehicle Stats' : 'Edit Vehicle Stats'}
                </span>
              )}
            </button>
            {isEditingVehicle && (
              <button 
                onClick={() => setIsEditingVehicle(false)}
                className="px-6 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Document Library Section */}
      <section className="glass-card p-10 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Document Library</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">Securely store and access your vehicle documents</p>
          </div>
          
          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,image/jpeg,image/jpg,image/png"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/20"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
            </button>
          </div>
        </div>

        {files.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
            <div className="p-4 bg-white/5 rounded-full">
              <FileText className="w-10 h-10 text-slate-600" />
            </div>
            <div>
              <p className="text-slate-400 font-bold">No documents found</p>
              <p className="text-slate-600 text-xs uppercase tracking-widest mt-1">Upload PDF or JPEG files to begin</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div 
                key={file.id}
                className="group p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-emerald-500/30 transition-all relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    {file.fileType.includes('pdf') ? (
                      <FileText className="w-6 h-6" />
                    ) : (
                      <ImageIcon className="w-6 h-6" />
                    )}
                  </div>
                  <button 
                    onClick={() => setSelectedFile(file)}
                    className="p-2 text-slate-500 hover:text-emerald-500 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                
                <h4 className="text-white font-bold text-sm truncate pr-2" title={file.fileName}>
                  {file.fileName}
                </h4>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">
                  {new Date(file.createdAt).toLocaleDateString()}
                </p>
                
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* File Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                  {selectedFile.fileType.includes('pdf') ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                </div>
                <h3 className="text-white font-black text-sm uppercase tracking-widest truncate max-w-xs sm:max-w-md">
                  {selectedFile.fileName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-2 bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-950 overflow-auto p-4 flex items-center justify-center">
              {selectedFile.fileType.includes('pdf') ? (
                <iframe 
                  src={selectedFile.downloadURL} 
                  className="w-full h-full rounded-xl border-none"
                  title="PDF Viewer"
                />
              ) : (
                <img 
                  src={selectedFile.downloadURL} 
                  alt={selectedFile.fileName} 
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              )}
            </div>
            
            <div className="p-6 border-t border-white/5 bg-slate-900/50 flex justify-end">
              <a 
                href={selectedFile.downloadURL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Open in New Tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
