
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AppState, AppStep, NavSection, User, Vehicle, DailyStats } from './types';
import AuthForm from './components/AuthForm';
import VehicleForm from './components/VehicleForm';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Explore = lazy(() => import('./components/Explore'));
const Profile = lazy(() => import('./components/Profile'));

import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  VEHICLE: 'ev_manager_v2_vcl',
  STATS: 'ev_manager_v2_sts'
};

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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedVehicle = localStorage.getItem(STORAGE_KEYS.VEHICLE);
    const savedStats = localStorage.getItem(STORAGE_KEYS.STATS);
    
    return {
      step: AppStep.AUTH,
      user: null,
      vehicle: savedVehicle ? JSON.parse(savedVehicle) : null,
      currentSection: NavSection.HOME,
      dailyStats: savedStats ? JSON.parse(savedStats) : { date: getEffectiveDate(), range: 0, time: '00:00' }
    };
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Explorer',
          email: firebaseUser.email || '',
          mobile: '', 
          countryCode: '+91',
          photoUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email?.split('@')[0]}&background=10b981&color=fff`
        };

        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userDataFromFirestore = userDoc.data();
            const mergedUser: User = {
              ...userData,
              emergencyContact: userDataFromFirestore.emergencyContact,
              mobile: userDataFromFirestore.mobile || userData.mobile,
              countryCode: userDataFromFirestore.countryCode || userData.countryCode,
              name: userDataFromFirestore.name || userData.name
            };
            const effectiveDate = getEffectiveDate();
            const todayStats = userDataFromFirestore.dailyTelemetry?.[effectiveDate];
            
            setState(prev => ({
              ...prev,
              user: mergedUser,
              vehicle: userDataFromFirestore.vehicle || prev.vehicle,
              dailyStats: todayStats || { date: effectiveDate, range: 0, time: '00:00' },
              step: userDataFromFirestore.vehicle ? AppStep.DASHBOARD : AppStep.VEHICLE_REGISTRATION
            }));
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
        }

        setState(prev => ({
          ...prev,
          user: userData,
          step: prev.vehicle ? AppStep.DASHBOARD : AppStep.VEHICLE_REGISTRATION
        }));
      } else {
        setState(prev => ({ ...prev, user: null, vehicle: null, step: AppStep.AUTH }));
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (state.vehicle) localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(state.vehicle));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(state.dailyStats));
  }, [state.vehicle, state.dailyStats]);

  const handleAuthComplete = (user: User) => {
    setState(prev => ({ ...prev, user, step: prev.vehicle ? AppStep.DASHBOARD : AppStep.VEHICLE_REGISTRATION }));
  };

  const handleVehicleComplete = async (vehicle: Vehicle) => {
    if (state.user?.uid) {
      try {
        // Save vehicle data under users/{uid} with merge: true
        await setDoc(doc(db, 'users', state.user.uid), { vehicle }, { merge: true });
      } catch (error) {
        console.error("Error saving vehicle to Firestore:", error);
      }
    }
    setState(prev => ({ ...prev, vehicle, step: AppStep.DASHBOARD }));
  };

  const handleNavigate = (section: NavSection) => {
    setState(prev => ({ ...prev, currentSection: section }));
  };

  const handleUpdateDailyStats = async (newStats: Partial<DailyStats>) => {
    const updatedStats = { ...state.dailyStats, ...newStats };
    
    // Update local state first for immediate UI feedback
    setState(prev => ({ ...prev, dailyStats: updatedStats }));
    
    // Then save to Firestore
    if (state.user?.uid && updatedStats.date) {
      try {
        await setDoc(doc(db, 'users', state.user.uid), { 
          dailyTelemetry: {
            [updatedStats.date]: updatedStats
          }
        }, { merge: true });
      } catch (error) {
        console.error("Error saving activity log to Firestore:", error);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
    } catch (error) {
      console.error("Signout Failure:", error);
    }
  };

  const handleUpdateUser = async (updates: Partial<User>) => {
    if (!state.user?.uid) return;
    try {
      await setDoc(doc(db, 'users', state.user.uid), updates, { merge: true });
      setState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
        vehicle: updates.vehicle || prev.vehicle
      }));
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-emerald-500/20 rounded-full"></div>
          <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
        </div>
        <p className="text-emerald-500 font-black tracking-widest text-sm uppercase animate-pulse">Powering Systems...</p>
      </div>
    );
  }

  if (state.step === AppStep.AUTH) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.1),_transparent_70%)]"></div>
        <AuthForm onComplete={handleAuthComplete} />
      </div>
    );
  }

  if (state.step === AppStep.VEHICLE_REGISTRATION) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white tracking-tight">Vitals Required</h1>
          <p className="text-slate-500 mt-2 font-medium">Initialize your vehicle profile to begin tracking.</p>
        </header>
        <VehicleForm onComplete={handleVehicleComplete} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar 
        activeSection={state.currentSection} 
        onNavigate={handleNavigate} 
        userName={state.user?.name || 'Commander'} 
      />
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_100%_0%,_rgba(16,185,129,0.05),_transparent_40%)]">
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        }>
          {state.currentSection === NavSection.HOME && state.vehicle && state.user && (
            <Dashboard 
              user={state.user}
              vehicle={state.vehicle} 
              dailyStats={state.dailyStats} 
              onUpdateDailyStats={handleUpdateDailyStats} 
            />
          )}
          {state.currentSection === NavSection.EXPLORE && <Explore />}
          {state.currentSection === NavSection.PROFILE && state.user && state.vehicle && (
            <Profile user={state.user} vehicle={state.vehicle} onReset={handleLogout} onUpdateUser={handleUpdateUser} />
          )}
        </Suspense>
      </main>
    </div>
  );
};

export default App;
