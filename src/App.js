import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Droplet,
  Coffee,
  Apple,
  AlertCircle,
  TrendingDown,
  Activity,
  Calendar,
  ChevronRight,
  X,
  Check,
  Pill,
  Target,
  Brain,
  Heart,
  Zap,
  Moon,
  Sun,
  ChevronDown,
  Info,
  Edit2,
  Save,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

// Add these new imports
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import AuthComponent from './AuthComponent';

// Initial state with your current day's data
const initialState = {
  user: {
    name: 'User',
    age: 31,
    height: 74, // inches
    weight: 230,
    targetWeight: 220,
    activityLevel: 1.55, // moderate activity
    conditions: {
      gout: {
        current: 10.2,
        target: 6.0,
        unit: 'mg/dL',
        lastUpdated: '2025-01-15',
      },
      kidney: {
        eGFR: { current: 69.3, target: 90, unit: 'mL/min' },
        creatinine: { current: 1.39, target: 1.2, unit: 'mg/dL' },
        lastUpdated: '2025-01-15',
      },
    },
    restrictions: {
      maxPurines: 250,
      minProtein: 105,
      maxProtein: 125,
      maxSodium: 2000,
      targetCalories: 2800,
      targetCarbs: 340,
      targetFat: 102,
      targetHydration: 115,
      minWater: 34,
      maxWater: 67,
      optimalCoffee: { min: 4, max: 6 },
    },
  },
  dailyLog: {
    date: new Date().toISOString().split('T')[0],
    foods: [
      {
        id: 1,
        time: '8:00 AM',
        name: 'Anthony & Sons Seven Grain Bread (2 slices)',
        calories: 240,
        protein: 6,
        carbs: 42,
        fat: 3,
        fiber: 4,
        sugar: 3,
        purines: 8,
        sodium: 320,
        category: 'breakfast',
      },
      {
        id: 2,
        time: '8:00 AM',
        name: 'Eggs sunny side up (3)',
        calories: 210,
        protein: 18,
        carbs: 3,
        fat: 15,
        fiber: 0,
        sugar: 0,
        purines: 12,
        sodium: 180,
        cholesterol: 558,
        category: 'breakfast',
      },
      {
        id: 3,
        time: '8:00 AM',
        name: "Mr Bing's Chili Crisp",
        calories: 93,
        protein: 0,
        carbs: 2,
        fat: 9,
        fiber: 0,
        sugar: 1,
        purines: 0,
        sodium: 300,
        category: 'breakfast',
      },
      {
        id: 4,
        time: '8:00 AM',
        name: 'Tart Cherry Gummies (2)',
        calories: 20,
        protein: 0,
        carbs: 4,
        fat: 0,
        fiber: 0,
        sugar: 4,
        purines: 0,
        sodium: 5,
        category: 'supplement',
        cherryExtract: 300,
      },
      {
        id: 5,
        time: '9:30 AM',
        name: 'Wawa Cold Brew Brown Sugar (32oz)',
        calories: 120,
        protein: 2,
        carbs: 30,
        fat: 0,
        fiber: 0,
        sugar: 30,
        purines: 0,
        sodium: 45,
        coffee: 4, // servings
        category: 'beverage',
      },
      {
        id: 6,
        time: '9:30 AM',
        name: 'Silk Unsweetened Almond Milk (1 tbsp)',
        calories: 5,
        protein: 0,
        carbs: 0,
        fat: 0.5,
        fiber: 0,
        sugar: 0,
        purines: 0,
        sodium: 10,
        category: 'beverage',
      },
      {
        id: 7,
        time: '12:30 PM',
        name: 'Banana (1 medium)',
        calories: 105,
        protein: 1,
        carbs: 27,
        fat: 0.4,
        fiber: 3,
        sugar: 14,
        purines: 18,
        sodium: 1,
        potassium: 422,
        category: 'snack',
      },
      {
        id: 8,
        time: '12:30 PM',
        name: 'Green Grapes (10)',
        calories: 34,
        protein: 0.4,
        carbs: 9,
        fat: 0.1,
        fiber: 0.5,
        sugar: 8,
        purines: 0,
        sodium: 1,
        category: 'snack',
      },
    ],
    hydration: [
      { id: 1, time: '11:00 AM', amount: 50, type: 'water' },
      { id: 2, time: '9:30 AM', amount: 32, type: 'coffee' },
    ],
    supplements: [
      {
        id: 1,
        name: 'Cherry Extract',
        taken: true,
        dose: '300mg',
        equivalent: '3000mg',
        time: '8:00 AM',
        category: 'gout',
      },
      {
        id: 2,
        name: 'Magnesium Glycinate',
        taken: false,
        dose: '400mg',
        time: 'bedtime',
        category: 'sleep',
      },
      {
        id: 3,
        name: 'Vitamin D3',
        taken: false,
        dose: '2000 IU',
        time: 'morning',
        category: 'general',
      },
      {
        id: 4,
        name: 'Turmeric',
        taken: false,
        dose: '500mg',
        time: 'morning',
        category: 'inflammation',
      },
      {
        id: 5,
        name: 'Multivitamin',
        taken: false,
        dose: '1 tablet',
        time: 'morning',
        category: 'general',
      },
    ],
    symptoms: {
      jointPain: null, // 1-10 scale
      energy: null, // 1-10 scale
      digestion: null, // 1-10 scale
      mood: null, // 1-10 scale
    },
    exercise: [],
    notes: '',
  },
  predictions: {
    goutFlareRisk: 'medium',
    weightLossTrajectory: '1.5 lbs/week',
    nextGoalDate: 'March 15, 2025',
    hydrationStatus: 'on-track',
  },
};

// Helper functions for calculations
const calculateBMR = (weight, height, age) => {
  const weightKg = weight * 0.453592;
  const heightCm = height * 2.54;
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
};

const calculateTDEE = (bmr, activityLevel) => Math.round(bmr * activityLevel);

const calculateDailyCalories = (tdee, deficitPerWeek = 1.5) => {
  const dailyDeficit = deficitPerWeek * 500;
  return Math.round(tdee - dailyDeficit);
};

const getPurineLevel = (purines) => {
  if (!purines)
    return { level: 'none', color: 'text-gray-400', bg: 'bg-gray-700/50' };
  if (purines < 50)
    return { level: 'low', color: 'text-green-400', bg: 'bg-green-500/20' };
  if (purines < 100)
    return {
      level: 'moderate',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
    };
  return { level: 'high', color: 'text-red-400', bg: 'bg-red-500/20' };
};

const getFlareRiskColor = (risk) => {
  const colors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  };
  return colors[risk] || 'text-gray-400';
};

// Common foods database for quick entry
const commonFoods = [
  {
    name: 'Chicken Breast (4oz)',
    calories: 185,
    protein: 35,
    carbs: 0,
    fat: 4,
    purines: 175,
    category: 'protein',
  },
  {
    name: 'Brown Rice (1 cup)',
    calories: 216,
    protein: 5,
    carbs: 45,
    fat: 2,
    purines: 25,
    category: 'grain',
  },
  {
    name: 'Broccoli (1 cup)',
    calories: 31,
    protein: 3,
    carbs: 6,
    fat: 0,
    purines: 70,
    category: 'vegetable',
  },
  {
    name: 'Greek Yogurt (1 cup)',
    calories: 150,
    protein: 20,
    carbs: 8,
    fat: 4,
    purines: 5,
    category: 'dairy',
  },
  {
    name: 'Apple (medium)',
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0,
    purines: 14,
    category: 'fruit',
  },
  {
    name: 'Almonds (1oz)',
    calories: 164,
    protein: 6,
    carbs: 6,
    fat: 14,
    purines: 37,
    category: 'nuts',
  },
  {
    name: 'Salmon (4oz)',
    calories: 236,
    protein: 35,
    carbs: 0,
    fat: 10,
    purines: 250,
    category: 'fish',
  },
  {
    name: 'Sweet Potato (medium)',
    calories: 103,
    protein: 2,
    carbs: 24,
    fat: 0,
    purines: 18,
    category: 'vegetable',
  },
];

// Main App Component
export default function HealthTracker() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [state, setState] = useState(initialState);
  const [showAddFood, setShowAddFood] = useState(false);
  const [showAddHydration, setShowAddHydration] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showSymptomTracker, setShowSymptomTracker] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

  // Add authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadUserData(user.uid);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load user data from Firebase
  const loadUserData = async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.state) {
          setState(data.state);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Save data to Firebase
  const saveToFirebase = async (newState) => {
    if (!user) return;

    setSaving(true);
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(
        docRef,
        {
          state: newState,
          lastUpdated: new Date().toISOString(),
          email: user.email,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save when state changes
  useEffect(() => {
    if (user && !loading) {
      const timeoutId = setTimeout(() => {
        saveToFirebase(state);
      }, 1000); // Save 1 second after changes stop

      return () => clearTimeout(timeoutId);
    }
  }, [state, user, loading]);

  // Sign out function
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setState(initialState);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate totals from foods
  const totals = useMemo(() => {
    const foodTotals = state.dailyLog.foods.reduce(
      (acc, food) => ({
        calories: acc.calories + (food.calories || 0),
        protein: acc.protein + (food.protein || 0),
        carbs: acc.carbs + (food.carbs || 0),
        fat: acc.fat + (food.fat || 0),
        fiber: acc.fiber + (food.fiber || 0),
        sugar: acc.sugar + (food.sugar || 0),
        purines: acc.purines + (food.purines || 0),
        sodium: acc.sodium + (food.sodium || 0),
        coffee: acc.coffee + (food.coffee || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        purines: 0,
        sodium: 0,
        coffee: 0,
      }
    );

    const hydrationTotal = state.dailyLog.hydration.reduce(
      (acc, h) => acc + h.amount,
      0
    );

    const waterOnly = state.dailyLog.hydration
      .filter((h) => h.type === 'water')
      .reduce((acc, h) => acc + h.amount, 0);

    const supplementsTaken = state.dailyLog.supplements.filter(
      (s) => s.taken
    ).length;
    const supplementsTotal = state.dailyLog.supplements.length;

    return {
      ...foodTotals,
      hydration: hydrationTotal,
      water: waterOnly,
      supplementsTaken,
      supplementsTotal,
    };
  }, [
    state.dailyLog.foods,
    state.dailyLog.hydration,
    state.dailyLog.supplements,
  ]);

  // Calculate percentages
  const percentages = useMemo(
    () => ({
      calories: Math.round(
        (totals.calories / state.user.restrictions.targetCalories) * 100
      ),
      protein: Math.round(
        (totals.protein / state.user.restrictions.maxProtein) * 100
      ),
      carbs: Math.round(
        (totals.carbs / state.user.restrictions.targetCarbs) * 100
      ),
      fat: Math.round((totals.fat / state.user.restrictions.targetFat) * 100),
      purines: Math.round(
        (totals.purines / state.user.restrictions.maxPurines) * 100
      ),
      hydration: Math.round(
        (totals.hydration / state.user.restrictions.targetHydration) * 100
      ),
      water: Math.round(
        (totals.water / state.user.restrictions.minWater) * 100
      ),
      sodium: Math.round(
        (totals.sodium / state.user.restrictions.maxSodium) * 100
      ),
    }),
    [totals, state.user.restrictions]
  );

  // Calculate dynamic recommendations
  const recommendations = useMemo(() => {
    const recs = [];

    if (percentages.purines > 80) {
      recs.push({
        type: 'warning',
        message: 'Purine intake high - consider low-purine foods for dinner',
      });
    }
    if (percentages.protein > 90) {
      recs.push({
        type: 'warning',
        message: 'Approaching protein limit (kidney protection)',
      });
    }
    if (percentages.hydration < 60 && new Date().getHours() > 14) {
      recs.push({
        type: 'info',
        message: 'Behind on hydration - aim for 20oz in next 2 hours',
      });
    }
    if (totals.coffee < state.user.restrictions.optimalCoffee.min) {
      recs.push({
        type: 'info',
        message: 'Coffee intake below optimal range for uric acid reduction',
      });
    }
    if (totals.water > state.user.restrictions.maxWater) {
      recs.push({
        type: 'warning',
        message: 'Plain water exceeds kidney-safe range',
      });
    }

    return recs;
  }, [percentages, totals, state.user.restrictions]);

  // Add food function
  const addFood = useCallback((food) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        foods: [
          ...prev.dailyLog.foods,
          {
            ...food,
            id: Date.now(),
            time: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
          },
        ],
      },
    }));
    setShowAddFood(false);
  }, []);

  // Add hydration function
  const addHydration = useCallback((amount, type = 'water') => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        hydration: [
          ...prev.dailyLog.hydration,
          {
            id: Date.now(),
            time: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
            amount: parseInt(amount),
            type,
          },
        ],
      },
    }));
    setShowAddHydration(false);
  }, []);

  // Add exercise function
  const addExercise = useCallback((exercise) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        exercise: [
          ...prev.dailyLog.exercise,
          {
            ...exercise,
            id: Date.now(),
            time: new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
          },
        ],
      },
    }));
    setShowAddExercise(false);
  }, []);

  // Update symptoms
  const updateSymptoms = useCallback((symptoms) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        symptoms: { ...prev.dailyLog.symptoms, ...symptoms },
      },
    }));
    setShowSymptomTracker(false);
  }, []);

  // Toggle supplement
  const toggleSupplement = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        supplements: prev.dailyLog.supplements.map((supp) =>
          supp.id === id ? { ...supp, taken: !supp.taken } : supp
        ),
      },
    }));
  }, []);

  // Remove food item
  const removeFood = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        foods: prev.dailyLog.foods.filter((food) => food.id !== id),
      },
    }));
  }, []);

  // Remove hydration entry
  const removeHydration = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      dailyLog: {
        ...prev.dailyLog,
        hydration: prev.dailyLog.hydration.filter((h) => h.id !== id),
      },
    }));
  }, []);

  // Update user weight
  const updateWeight = useCallback((newWeight) => {
    setState((prev) => ({
      ...prev,
      user: {
        ...prev.user,
        weight: parseFloat(newWeight),
      },
    }));
  }, []);

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthComponent onAuthSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <header className="mb-6 bg-black/30 backdrop-blur-md rounded-xl p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Health Tracker Pro
              </h1>
              <p className="text-gray-300 mt-1">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {saving && (
                  <span className="ml-2 text-yellow-400">Saving...</span>
                )}
              </p>
            </div>

            {/* Weight Tracker */}
            <div className="flex gap-4 items-center">
              <div className="text-center">
                <p className="text-sm text-gray-400">Current</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{state.user.weight}</p>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-gray-400 hover:text-white transition-colors">
                    <Edit2 size={16} />
                  </button>
                </div>
                {editMode && (
                  <input
                    type="number"
                    value={state.user.weight}
                    onChange={(e) => updateWeight(e.target.value)}
                    className="mt-1 px-2 py-1 bg-gray-800 rounded text-sm w-20"
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">Goal</p>
                <p className="text-2xl font-bold text-green-400">
                  {state.user.targetWeight}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-400">To Go</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(state.user.weight - state.user.targetWeight).toFixed(1)} lbs
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddFood(true)}
                className="bg-purple-500 hover:bg-purple-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Apple size={18} />
                <span className="hidden sm:inline">Food</span>
              </button>
              <button
                onClick={() => setShowAddHydration(true)}
                className="bg-blue-500 hover:bg-blue-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Droplet size={18} />
                <span className="hidden sm:inline">Water</span>
              </button>
              <button
                onClick={() => setShowAddExercise(true)}
                className="bg-green-500 hover:bg-green-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Activity size={18} />
                <span className="hidden sm:inline">Exercise</span>
              </button>
              <button
                onClick={() => setShowSymptomTracker(true)}
                className="bg-orange-500 hover:bg-orange-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <Heart size={18} />
                <span className="hidden sm:inline">Symptoms</span>
              </button>

              {/* Add this sign out button */}
              <button
                onClick={handleSignOut}
                className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg flex items-center gap-2 transition-colors">
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Health Alerts & Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6 space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`
                ${
                  rec.type === 'warning'
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-blue-500/20 border-blue-500'
                }
                border rounded-lg p-3 backdrop-blur-md flex items-center gap-2
              `}>
                <AlertCircle
                  size={18}
                  className={
                    rec.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }
                />
                <p className="text-sm">{rec.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Critical Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-400" />
                <h3 className="font-semibold">Uric Acid</h3>
              </div>
              <span className="text-xs text-gray-400">
                {state.user.conditions.gout.lastUpdated}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {state.user.conditions.gout.current} mg/dL
            </p>
            <p className="text-sm text-gray-300">
              Target: &lt;{state.user.conditions.gout.target} mg/dL
            </p>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (state.user.conditions.gout.current / 12) * 100,
                    100
                  )}%`,
                }}></div>
            </div>
          </div>

          <div className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="text-yellow-400" />
                <h3 className="font-semibold">Kidney Function</h3>
              </div>
              <span className="text-xs text-gray-400">
                {state.user.conditions.kidney.lastUpdated}
              </span>
            </div>
            <p className="text-2xl font-bold">
              eGFR: {state.user.conditions.kidney.eGFR.current}
            </p>
            <p className="text-sm text-gray-300">Stage 2 CKD (60-89 mL/min)</p>
            <div className="mt-1 text-xs text-gray-400">
              Creatinine: {state.user.conditions.kidney.creatinine.current}{' '}
              mg/dL
            </div>
          </div>

          <div
            className={`
            ${
              state.predictions.goutFlareRisk === 'high'
                ? 'bg-red-500/20 border-red-500'
                : state.predictions.goutFlareRisk === 'medium'
                ? 'bg-yellow-500/20 border-yellow-500'
                : 'bg-green-500/20 border-green-500'
            }
            border rounded-xl p-4 backdrop-blur-md
          `}>
            <div className="flex items-center gap-2 mb-2">
              <Zap
                className={getFlareRiskColor(state.predictions.goutFlareRisk)}
              />
              <h3 className="font-semibold">Flare Risk Today</h3>
            </div>
            <p
              className={`text-2xl font-bold capitalize ${getFlareRiskColor(
                state.predictions.goutFlareRisk
              )}`}>
              {state.predictions.goutFlareRisk}
            </p>
            <p className="text-sm text-gray-300 mt-1">
              Based on recent patterns
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            'overview',
            'nutrition',
            'hydration',
            'supplements',
            'exercise',
            'trends',
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors whitespace-nowrap
                ${
                  activeTab === tab
                    ? 'bg-purple-500 text-white'
                    : 'bg-black/30 text-gray-300 hover:bg-black/50'
                }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Daily Targets */}
          <div className="lg:col-span-1 space-y-6">
            {/* Calories Ring */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Target className="text-purple-400" />
                Daily Targets
              </h2>

              <div className="flex justify-center mb-6">
                <div className="relative w-40 h-40">
                  <svg className="transform -rotate-90 w-40 h-40">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-purple-400"
                      strokeDasharray={`${4.4 * percentages.calories} 440`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold">{totals.calories}</p>
                    <p className="text-sm text-gray-400">calories</p>
                    <p className="text-lg text-purple-400">
                      {percentages.calories}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Macros */}
              <div className="space-y-3">
                <MacroBar
                  label="Protein"
                  current={totals.protein}
                  target={state.user.restrictions.maxProtein}
                  min={state.user.restrictions.minProtein}
                  percentage={percentages.protein}
                  color="blue"
                  unit="g"
                />
                <MacroBar
                  label="Carbs"
                  current={totals.carbs}
                  target={state.user.restrictions.targetCarbs}
                  percentage={percentages.carbs}
                  color="green"
                  unit="g"
                />
                <MacroBar
                  label="Fat"
                  current={totals.fat}
                  target={state.user.restrictions.targetFat}
                  percentage={percentages.fat}
                  color="yellow"
                  unit="g"
                />
                <MacroBar
                  label="Fiber"
                  current={totals.fiber}
                  target={30}
                  percentage={Math.round((totals.fiber / 30) * 100)}
                  color="purple"
                  unit="g"
                />
              </div>
            </div>

            {/* Purine Tracker */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="text-orange-400" />
                Purine Management
              </h2>
              <div className="relative mb-4">
                <div className="h-10 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full opacity-30"></div>
                <div
                  className="absolute top-0 left-0 h-10 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full"
                  style={{
                    width: `${Math.min(percentages.purines, 100)}%`,
                  }}></div>
                <div className="absolute top-0 left-0 w-full h-10 flex items-center justify-between px-3">
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {totals.purines}mg
                  </span>
                  <span className="text-sm text-white drop-shadow-lg">
                    {state.user.restrictions.maxPurines}mg
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-400">Safe (0-100)</span>
                <span className="text-yellow-400">Caution (100-200)</span>
                <span className="text-red-400">Risk (200+)</span>
              </div>

              {/* Purine breakdown by meal */}
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  By Meal
                </p>
                {['breakfast', 'lunch', 'dinner', 'snack'].map((meal) => {
                  const mealPurines = state.dailyLog.foods
                    .filter((f) => f.category === meal)
                    .reduce((sum, f) => sum + (f.purines || 0), 0);
                  if (mealPurines === 0) return null;
                  return (
                    <div key={meal} className="flex justify-between text-sm">
                      <span className="capitalize text-gray-300">{meal}</span>
                      <span className={getPurineLevel(mealPurines).color}>
                        {mealPurines}mg
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sodium Tracker */}
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Sodium Intake</h2>
              <div className="text-center mb-3">
                <p
                  className={`text-2xl font-bold ${
                    percentages.sodium > 100 ? 'text-red-400' : 'text-white'
                  }`}>
                  {totals.sodium} mg
                </p>
                <p className="text-sm text-gray-400">
                  of {state.user.restrictions.maxSodium} mg max
                </p>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    percentages.sodium > 100
                      ? 'bg-red-500'
                      : percentages.sodium > 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(percentages.sodium, 100)}%`,
                  }}></div>
              </div>
            </div>
          </div>

          {/* Middle & Right Columns - Dynamic Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Food Log */}
                <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Apple className="text-green-400" />
                      Today's Food ({state.dailyLog.foods.length} items)
                    </h2>
                    <button
                      onClick={() => setShowAddFood(true)}
                      className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                      <Plus size={20} />
                      Add Food
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {state.dailyLog.foods.length === 0 ? (
                      <p className="text-gray-400 text-center py-8">
                        No foods logged yet today
                      </p>
                    ) : (
                      state.dailyLog.foods.map((food) => (
                        <FoodItem
                          key={food.id}
                          food={food}
                          onRemove={removeFood}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <StatCard
                    label="Calories"
                    value={totals.calories}
                    target={state.user.restrictions.targetCalories}
                    percentage={percentages.calories}
                    icon={<Zap size={16} />}
                  />
                  <StatCard
                    label="Protein"
                    value={`${totals.protein}g`}
                    target={`${state.user.restrictions.maxProtein}g`}
                    percentage={percentages.protein}
                    warning={percentages.protein > 100}
                    icon={<Activity size={16} />}
                  />
                  <StatCard
                    label="Purines"
                    value={`${totals.purines}mg`}
                    target={`${state.user.restrictions.maxPurines}mg`}
                    percentage={percentages.purines}
                    warning={percentages.purines > 80}
                    icon={<AlertCircle size={16} />}
                  />
                  <StatCard
                    label="Hydration"
                    value={`${totals.hydration}oz`}
                    target={`${state.user.restrictions.targetHydration}oz`}
                    percentage={percentages.hydration}
                    icon={<Droplet size={16} />}
                  />
                  <StatCard
                    label="Supplements"
                    value={`${totals.supplementsTaken}/${totals.supplementsTotal}`}
                    target="taken"
                    percentage={Math.round(
                      (totals.supplementsTaken / totals.supplementsTotal) * 100
                    )}
                    icon={<Pill size={16} />}
                  />
                  <StatCard
                    label="Sugar"
                    value={`${totals.sugar}g`}
                    target="50g"
                    percentage={Math.round((totals.sugar / 50) * 100)}
                    warning={totals.sugar > 50}
                    icon={<Coffee size={16} />}
                  />
                </div>
              </>
            )}

            {activeTab === 'nutrition' && (
              <NutritionTab
                foods={state.dailyLog.foods}
                totals={totals}
                restrictions={state.user.restrictions}
                onAddFood={addFood}
                onRemoveFood={removeFood}
              />
            )}

            {activeTab === 'hydration' && (
              <HydrationTab
                hydration={state.dailyLog.hydration}
                totals={totals}
                restrictions={state.user.restrictions}
                onAddHydration={addHydration}
                onRemoveHydration={removeHydration}
              />
            )}

            {activeTab === 'supplements' && (
              <SupplementsTab
                supplements={state.dailyLog.supplements}
                onToggle={toggleSupplement}
              />
            )}

            {activeTab === 'exercise' && (
              <ExerciseTab
                exercises={state.dailyLog.exercise}
                onAddExercise={addExercise}
              />
            )}

            {activeTab === 'trends' && (
              <TrendsTab user={state.user} predictions={state.predictions} />
            )}
          </div>
        </div>

        {/* Modals */}
        {showAddFood && (
          <AddFoodModal
            onAdd={addFood}
            onClose={() => setShowAddFood(false)}
            commonFoods={commonFoods}
          />
        )}

        {showAddHydration && (
          <AddHydrationModal
            onAdd={addHydration}
            onClose={() => setShowAddHydration(false)}
          />
        )}

        {showAddExercise && (
          <AddExerciseModal
            onAdd={addExercise}
            onClose={() => setShowAddExercise(false)}
          />
        )}

        {showSymptomTracker && (
          <SymptomTrackerModal
            symptoms={state.dailyLog.symptoms}
            onUpdate={updateSymptoms}
            onClose={() => setShowSymptomTracker(false)}
          />
        )}
      </div>
    </div>
  );
}

// Component for macro bars with min/max ranges
function MacroBar({ label, current, target, min, percentage, color, unit }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  const isInRange = min
    ? current >= min && current <= target
    : current <= target;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className={!isInRange ? 'text-yellow-400' : ''}>
          {current}
          {unit} / {min && `${min}-`}
          {target}
          {unit}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    </div>
  );
}

// Enhanced Food Item Component
function FoodItem({ food, onRemove }) {
  const purineInfo = getPurineLevel(food.purines);

  return (
    <div
      className={`${purineInfo.bg} border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all group`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-xs text-gray-400">{food.time}</span>
            <span className="text-sm font-medium">{food.name}</span>
            {food.purines > 100 && (
              <AlertCircle size={14} className="text-yellow-400" />
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="text-purple-400 font-semibold">
              {food.calories} cal
            </span>
            {food.protein > 0 && (
              <span className="text-blue-300">P: {food.protein}g</span>
            )}
            {food.carbs > 0 && (
              <span className="text-green-300">C: {food.carbs}g</span>
            )}
            {food.fat > 0 && (
              <span className="text-yellow-300">F: {food.fat}g</span>
            )}
            {food.fiber > 0 && (
              <span className="text-purple-300">Fiber: {food.fiber}g</span>
            )}
            {food.sugar > 0 && (
              <span className="text-pink-300">Sugar: {food.sugar}g</span>
            )}
            {food.sodium > 0 && (
              <span className="text-orange-300">Na: {food.sodium}mg</span>
            )}
            {food.purines > 0 && (
              <span className={purineInfo.color}>
                Purines: {food.purines}mg ({purineInfo.level})
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(food.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 ml-2">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// Enhanced Stat Card Component
function StatCard({ label, value, target, percentage, warning, icon }) {
  return (
    <div
      className={`p-4 rounded-lg transition-all ${
        warning
          ? 'bg-red-500/20 border border-red-500'
          : 'bg-black/30 backdrop-blur-md'
      }`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-gray-400 uppercase tracking-wider">
          {label}
        </p>
        {icon && (
          <span className={warning ? 'text-red-400' : 'text-gray-400'}>
            {icon}
          </span>
        )}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mb-2">{target}</p>
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            warning
              ? 'bg-red-500'
              : percentage > 100
              ? 'bg-yellow-500'
              : 'bg-purple-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}></div>
      </div>
    </div>
  );
}

// Nutrition Tab Component
function NutritionTab({
  foods,
  totals,
  restrictions,
  onAddFood,
  onRemoveFood,
}) {
  const mealCategories = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-6">
      {/* Detailed Macro Breakdown */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">
          Detailed Nutrition Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">Calories</p>
            <p className="text-2xl font-bold">{totals.calories}</p>
            <p className="text-xs text-gray-500">
              Target: {restrictions.targetCalories}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Protein</p>
            <p className="text-2xl font-bold">{totals.protein}g</p>
            <p className="text-xs text-gray-500">
              Range: {restrictions.minProtein}-{restrictions.maxProtein}g
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Carbs</p>
            <p className="text-2xl font-bold">{totals.carbs}g</p>
            <p className="text-xs text-gray-500">
              Target: {restrictions.targetCarbs}g
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Fat</p>
            <p className="text-2xl font-bold">{totals.fat}g</p>
            <p className="text-xs text-gray-500">
              Target: {restrictions.targetFat}g
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Fiber</p>
            <p className="text-2xl font-bold">{totals.fiber}g</p>
            <p className="text-xs text-gray-500">Target: 30g</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Sugar</p>
            <p className="text-2xl font-bold text-pink-400">{totals.sugar}g</p>
            <p className="text-xs text-gray-500">Limit: 50g</p>
          </div>
        </div>
      </div>

      {/* Foods by Meal */}
      {mealCategories.map((category) => {
        const mealFoods = foods.filter((f) => f.category === category);
        if (mealFoods.length === 0) return null;

        const mealTotals = mealFoods.reduce(
          (acc, food) => ({
            calories: acc.calories + (food.calories || 0),
            protein: acc.protein + (food.protein || 0),
            carbs: acc.carbs + (food.carbs || 0),
            fat: acc.fat + (food.fat || 0),
            purines: acc.purines + (food.purines || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, purines: 0 }
        );

        return (
          <div
            key={category}
            className="bg-black/30 backdrop-blur-md rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold capitalize">{category}</h3>
              <div className="flex gap-3 text-sm">
                <span className="text-purple-400">
                  {mealTotals.calories} cal
                </span>
                <span className="text-blue-300">P: {mealTotals.protein}g</span>
                <span className="text-green-300">C: {mealTotals.carbs}g</span>
                <span className="text-yellow-300">F: {mealTotals.fat}g</span>
              </div>
            </div>
            <div className="space-y-2">
              {mealFoods.map((food) => (
                <FoodItem key={food.id} food={food} onRemove={onRemoveFood} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Hydration Tab Component
function HydrationTab({
  hydration,
  totals,
  restrictions,
  onAddHydration,
  onRemoveHydration,
}) {
  const waterEntries = hydration.filter((h) => h.type === 'water');
  const coffeeEntries = hydration.filter((h) => h.type === 'coffee');
  const otherEntries = hydration.filter(
    (h) => h.type !== 'water' && h.type !== 'coffee'
  );

  return (
    <div className="space-y-6">
      {/* Hydration Overview */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Droplet className="text-blue-400" />
            Hydration Overview
          </h3>
          <button
            onClick={() => onAddHydration(16, 'water')}
            className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg text-sm transition-colors">
            Quick +16oz Water
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-4xl font-bold">{totals.hydration} oz</p>
          <p className="text-gray-400">
            of {restrictions.targetHydration} oz goal
          </p>
          <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{
                width: `${Math.min(
                  (totals.hydration / restrictions.targetHydration) * 100,
                  100
                )}%`,
              }}></div>
          </div>
        </div>

        {/* Visual Water Bottles */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-20 rounded-lg flex items-end justify-center p-2 transition-all
              ${
                i < Math.floor(totals.hydration / 23)
                  ? 'bg-blue-500'
                  : 'bg-gray-700'
              }`}>
              <Droplet
                size={24}
                className={
                  i < Math.floor(totals.hydration / 23)
                    ? 'text-white'
                    : 'text-gray-500'
                }
              />
            </div>
          ))}
        </div>

        {/* Breakdown by Type */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Plain Water</p>
            <p
              className={`text-xl font-bold ${
                totals.water >= restrictions.minWater &&
                totals.water <= restrictions.maxWater
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}>
              {totals.water} oz
            </p>
            <p className="text-xs text-gray-500">
              ({restrictions.minWater}-{restrictions.maxWater} oz)
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Coffee</p>
            <p
              className={`text-xl font-bold ${
                totals.coffee >= restrictions.optimalCoffee.min &&
                totals.coffee <= restrictions.optimalCoffee.max
                  ? 'text-green-400'
                  : 'text-yellow-400'
              }`}>
              {totals.coffee} servings
            </p>
            <p className="text-xs text-gray-500">
              ({restrictions.optimalCoffee.min}-{restrictions.optimalCoffee.max}{' '}
              optimal)
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Other</p>
            <p className="text-xl font-bold">
              {hydration
                .filter((h) => h.type === 'other' || h.type === 'tea')
                .reduce((sum, h) => sum + h.amount, 0)}{' '}
              oz
            </p>
          </div>
        </div>
      </div>

      {/* Hydration Log */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Today's Hydration Log</h3>
        <div className="space-y-2">
          {hydration.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              No hydration logged yet
            </p>
          ) : (
            hydration.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between items-center bg-gray-800/50 rounded-lg p-3 group">
                <div className="flex items-center gap-3">
                  <Droplet
                    size={18}
                    className={
                      entry.type === 'water'
                        ? 'text-blue-400'
                        : entry.type === 'coffee'
                        ? 'text-amber-400'
                        : 'text-gray-400'
                    }
                  />
                  <span className="text-sm text-gray-400">{entry.time}</span>
                  <span className="font-medium">
                    {entry.amount} oz {entry.type}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveHydration(entry.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Supplements Tab Component
function SupplementsTab({ supplements, onToggle }) {
  const categories = [...new Set(supplements.map((s) => s.category))];

  return (
    <div className="space-y-6">
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Pill className="text-green-400" />
          Daily Supplements
        </h3>

        <div className="mb-4">
          <p className="text-sm text-gray-400">
            {supplements.filter((s) => s.taken).length} of {supplements.length}{' '}
            taken today
          </p>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{
                width: `${
                  (supplements.filter((s) => s.taken).length /
                    supplements.length) *
                  100
                }%`,
              }}></div>
          </div>
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-6">
            <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-3">
              {category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {supplements
                .filter((s) => s.category === category)
                .map((supp) => (
                  <div
                    key={supp.id}
                    onClick={() => onToggle(supp.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border
                       ${
                         supp.taken
                           ? 'bg-green-500/20 border-green-500'
                           : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                       }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{supp.name}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {supp.dose}
                        </p>
                        {supp.equivalent && (
                          <p className="text-xs text-gray-500">
                            Equivalent: {supp.equivalent}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Take: {supp.time}
                        </p>
                      </div>
                      {supp.taken && (
                        <Check className="text-green-400" size={20} />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}

        {/* Supplement Notes */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-300">
            💡 Tip: Take Magnesium Glycinate at bedtime for better absorption
            and sleep quality. Cherry Extract is most effective when taken with
            breakfast.
          </p>
        </div>
      </div>
    </div>
  );
}

// Exercise Tab Component
function ExerciseTab({ exercises, onAddExercise }) {
  const totalCaloriesBurned = exercises.reduce(
    (sum, ex) => sum + (ex.caloriesBurned || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="text-green-400" />
            Today's Exercise
          </h3>
          <button
            onClick={onAddExercise}
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus size={20} />
            Add Exercise
          </button>
        </div>

        {exercises.length === 0 ? (
          <div className="text-center py-12">
            <Activity size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No exercise logged yet today</p>
            <p className="text-sm text-gray-500 mt-2">
              Track your workouts to adjust calorie goals
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold text-green-400">
                {totalCaloriesBurned}
              </p>
              <p className="text-gray-400">calories burned</p>
            </div>

            <div className="space-y-3">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{exercise.name}</p>
                      <p className="text-sm text-gray-400 mt-1">
                        {exercise.duration} min • {exercise.intensity} intensity
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        {exercise.caloriesBurned} cal
                      </p>
                      <p className="text-xs text-gray-400">{exercise.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Trends Tab Component
function TrendsTab({ user, predictions }) {
  const bmr = calculateBMR(user.weight, user.height, user.age);
  const tdee = calculateTDEE(bmr, user.activityLevel);
  const targetCalories = calculateDailyCalories(tdee, 1.5);

  return (
    <div className="space-y-6">
      {/* Metabolic Calculations */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Brain className="text-purple-400" />
          Metabolic Analysis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-400">BMR</p>
            <p className="text-2xl font-bold">{bmr}</p>
            <p className="text-xs text-gray-500">cal/day</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">TDEE</p>
            <p className="text-2xl font-bold">{tdee}</p>
            <p className="text-xs text-gray-500">cal/day</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Target</p>
            <p className="text-2xl font-bold text-purple-400">
              {targetCalories}
            </p>
            <p className="text-xs text-gray-500">for 1.5lb/week loss</p>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">AI Predictions</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">Weight Loss Rate</span>
            <span className="font-semibold text-green-400">
              {predictions.weightLossTrajectory}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">Goal Achievement</span>
            <span className="font-semibold text-blue-400">
              {predictions.nextGoalDate}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">Gout Flare Risk</span>
            <span
              className={`font-semibold capitalize ${getFlareRiskColor(
                predictions.goutFlareRisk
              )}`}>
              {predictions.goutFlareRisk}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
            <span className="text-gray-300">Hydration Status</span>
            <span className="font-semibold text-blue-400 capitalize">
              {predictions.hydrationStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart (Placeholder) */}
      <div className="bg-black/30 backdrop-blur-md rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4">
          Weight Trend (Last 7 Days)
        </h3>
        <div className="h-48 flex items-end justify-around">
          {[230.5, 230.8, 230.2, 230.4, 229.8, 230.1, 230].map(
            (weight, index) => {
              const height = ((weight - 229) / 2) * 100;
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
              return (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="w-8 bg-gradient-to-t from-purple-500 to-blue-500 rounded-t"
                    style={{ height: `${height}%` }}></div>
                  <p className="text-xs text-gray-400 mt-2">{days[index]}</p>
                  <p className="text-xs text-gray-500">{weight}</p>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}

// Add Food Modal Component
function AddFoodModal({ onAdd, onClose, commonFoods }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [food, setFood] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
    sugar: '',
    purines: '',
    sodium: '',
    category: 'meal',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = () => {
    if (!food.name || !food.calories) return;
    onAdd({
      ...food,
      calories: parseInt(food.calories) || 0,
      protein: parseFloat(food.protein) || 0,
      carbs: parseFloat(food.carbs) || 0,
      fat: parseFloat(food.fat) || 0,
      fiber: parseFloat(food.fiber) || 0,
      sugar: parseFloat(food.sugar) || 0,
      purines: parseInt(food.purines) || 0,
      sodium: parseInt(food.sodium) || 0,
    });
  };

  const handleQuickAdd = (quickFood) => {
    onAdd({
      ...quickFood,
      id: Date.now(),
      time: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    });
  };

  const filteredFoods = commonFoods.filter((f) =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Food</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'manual'
                ? 'bg-purple-500'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}>
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'quick'
                ? 'bg-purple-500'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}>
            Quick Add
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'search'
                ? 'bg-purple-500'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            disabled>
            Search Database (Coming Soon)
          </button>
        </div>

        {activeTab === 'manual' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Food Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Chicken Breast (4oz)"
                value={food.name}
                onChange={(e) => setFood({ ...food, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Category
              </label>
              <select
                value={food.category}
                onChange={(e) => setFood({ ...food, category: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
                <option value="beverage">Beverage</option>
                <option value="supplement">Supplement</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Calories *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={food.calories}
                  onChange={(e) =>
                    setFood({ ...food, calories: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Protein (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={food.protein}
                  onChange={(e) =>
                    setFood({ ...food, protein: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Carbs (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={food.carbs}
                  onChange={(e) => setFood({ ...food, carbs: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Fat (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={food.fat}
                  onChange={(e) => setFood({ ...food, fat: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Fiber (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={food.fiber}
                  onChange={(e) => setFood({ ...food, fiber: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Sugar (g)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={food.sugar}
                  onChange={(e) => setFood({ ...food, sugar: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Purines (mg)
                  <Info size={14} className="inline ml-1 text-gray-500" />
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={food.purines}
                  onChange={(e) =>
                    setFood({ ...food, purines: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Sodium (mg)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={food.sodium}
                  onChange={(e) => setFood({ ...food, sodium: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Purine Reference Guide */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300 mb-2">
                Purine Reference Guide:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-green-400">
                  Low (&lt;50mg): Most fruits, vegetables, dairy
                </span>
                <span className="text-yellow-400">
                  Moderate (50-150mg): Chicken, beef, legumes
                </span>
                <span className="text-orange-400">
                  High (150-300mg): Seafood, organ meats
                </span>
                <span className="text-red-400">
                  Very High (&gt;300mg): Anchovies, sardines, liver
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors">
                Add Food
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {activeTab === 'quick' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search common foods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
              {filteredFoods.map((food, index) => (
                <div
                  key={index}
                  onClick={() => handleQuickAdd(food)}
                  className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{food.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {food.calories} cal • P: {food.protein}g • C:{' '}
                        {food.carbs}g • F: {food.fat}g
                        {food.purines > 0 && ` • Purines: ${food.purines}mg`}
                      </p>
                    </div>
                    <Plus size={20} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add Hydration Modal Component
function AddHydrationModal({ onAdd, onClose }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('water');
  const quickAmounts = [8, 16, 20, 32];

  const handleSubmit = () => {
    if (!amount) return;
    onAdd(amount, type);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Hydration</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Quick Add
            </label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((oz) => (
                <button
                  key={oz}
                  onClick={() => setAmount(oz.toString())}
                  className={`py-2 rounded-lg transition-colors ${
                    amount === oz.toString()
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}>
                  {oz} oz
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Custom Amount (oz)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="water">Water</option>
              <option value="coffee">Coffee</option>
              <option value="tea">Tea</option>
              <option value="other">Other</option>
            </select>
          </div>

          {type === 'coffee' && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-300">
                Note: 8oz = 1 coffee serving. Current:{' '}
                {amount ? Math.round(parseInt(amount) / 8) : 0} servings
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors">
              Add
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Exercise Modal Component
function AddExerciseModal({ onAdd, onClose }) {
  const [exercise, setExercise] = useState({
    name: '',
    duration: '',
    intensity: 'moderate',
    caloriesBurned: '',
  });

  const commonExercises = [
    { name: 'Weightlifting', caloriesPerMin: 6 },
    { name: 'Peloton Cycling', caloriesPerMin: 10 },
    { name: 'Running', caloriesPerMin: 12 },
    { name: 'Walking', caloriesPerMin: 4 },
    { name: 'Swimming', caloriesPerMin: 8 },
    { name: 'Yoga', caloriesPerMin: 3 },
  ];

  const handleExerciseSelect = (ex) => {
    const calories = exercise.duration
      ? ex.caloriesPerMin * parseInt(exercise.duration)
      : '';
    setExercise({
      ...exercise,
      name: ex.name,
      caloriesBurned: calories.toString(),
    });
  };

  const handleSubmit = () => {
    if (!exercise.name || !exercise.duration) return;
    onAdd({
      ...exercise,
      duration: parseInt(exercise.duration),
      caloriesBurned: parseInt(exercise.caloriesBurned) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Exercise</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Quick Select
            </label>
            <div className="grid grid-cols-2 gap-2">
              {commonExercises.map((ex, index) => (
                <button
                  key={index}
                  onClick={() => handleExerciseSelect(ex)}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    exercise.name === ex.name
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}>
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              placeholder="e.g., Weightlifting"
              value={exercise.name}
              onChange={(e) =>
                setExercise({ ...exercise, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Duration (min)
              </label>
              <input
                type="number"
                placeholder="30"
                value={exercise.duration}
                onChange={(e) =>
                  setExercise({ ...exercise, duration: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Intensity
              </label>
              <select
                value={exercise.intensity}
                onChange={(e) =>
                  setExercise({ ...exercise, intensity: e.target.value })
                }
                className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="vigorous">Vigorous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Calories Burned (estimate)
            </label>
            <input
              type="number"
              placeholder="Auto-calculated or enter manually"
              value={exercise.caloriesBurned}
              onChange={(e) =>
                setExercise({ ...exercise, caloriesBurned: e.target.value })
              }
              className="w-full px-3 py-2 bg-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg transition-colors">
              Add Exercise
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Symptom Tracker Modal Component
function SymptomTrackerModal({ symptoms, onUpdate, onClose }) {
  const [localSymptoms, setLocalSymptoms] = useState({
    jointPain: symptoms.jointPain || 5,
    energy: symptoms.energy || 5,
    digestion: symptoms.digestion || 5,
    mood: symptoms.mood || 5,
  });

  const symptomInfo = {
    jointPain: {
      icon: '🦴',
      label: 'Joint Pain',
      lowLabel: 'No Pain',
      highLabel: 'Severe',
    },
    energy: {
      icon: '⚡',
      label: 'Energy Level',
      lowLabel: 'Exhausted',
      highLabel: 'Energetic',
    },
    digestion: {
      icon: '🍽️',
      label: 'Digestion',
      lowLabel: 'Poor',
      highLabel: 'Excellent',
    },
    mood: { icon: '😊', label: 'Mood', lowLabel: 'Low', highLabel: 'Great' },
  };

  const handleSubmit = () => {
    onUpdate(localSymptoms);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Track Symptoms</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(symptomInfo).map(([key, info]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <span className="text-xl">{info.icon}</span>
                  {info.label}
                </label>
                <span className="text-lg font-bold text-purple-400">
                  {localSymptoms[key]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={localSymptoms[key]}
                onChange={(e) =>
                  setLocalSymptoms({
                    ...localSymptoms,
                    [key]: parseInt(e.target.value),
                  })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{info.lowLabel}</span>
                <span>{info.highLabel}</span>
              </div>
            </div>
          ))}

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              Track symptoms daily to identify patterns and triggers for flares
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors">
              Save Symptoms
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
