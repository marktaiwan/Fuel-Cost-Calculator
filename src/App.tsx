import {useState, useEffect } from 'react'
import {Calculator, Plus, Trash2, Fuel, Map, Gauge} from 'lucide-react'
import './App.css'

type Result = {
  id: number;
  name: string;
  price: string;
  liters: number;
  totalCost: number;
};

type Grade = {
  id: number;
  name: string;
  price: string;
};

// Initialize and load saved parameters
const saved = localStorage.getItem('fuelCalculatorSettings');
const defaults: {
  rememberSettings: boolean;
  efficiency: string;
  efficiencyUnit: string;
  fuelGrades: Grade[];
} = {
  rememberSettings: false,
  efficiency: '',
  efficiencyUnit: 'l/100km',
  fuelGrades: [
    {id: 1, name: '95 Unleaded', price: ''},
    {id: 2, name: '98 Unleaded', price: ''},
  ]
};
if (saved) {
  try {
    const parsed = JSON.parse(saved);
    defaults.rememberSettings = true;
    if (parsed.efficiency !== undefined) defaults.efficiency = parsed.efficiency;
    if (parsed.efficiencyUnit) defaults.efficiencyUnit = parsed.efficiencyUnit;
    if (parsed.fuelGrades) defaults.fuelGrades = parsed.fuelGrades;
  } catch (e) {
    console.error("Failed to parse stored parameters", e);
  }
}

function App() {

  const [distance, setDistance] = useState<string>('');
  const [isRoundtrip, setIsRoundtrip] = useState(false);
  const [efficiency, setEfficiency] = useState(defaults.efficiency);
  const [efficiencyUnit, setEfficiencyUnit] = useState(defaults.efficiencyUnit);
  const [fuelGrades, setFuelGrades] = useState(defaults.fuelGrades);
  const [rememberSettings, setRememberSettings] = useState(defaults.rememberSettings);

  // Save or clear settings based on the user's toggle state
  useEffect(() => {
    if (rememberSettings) {
      localStorage.setItem('fuelCalculatorSettings', JSON.stringify({
        efficiency,
        efficiencyUnit,
        fuelGrades
      }));
    } else {
      localStorage.removeItem('fuelCalculatorSettings');
    }
  }, [rememberSettings, efficiency, efficiencyUnit, fuelGrades]);

  let results: Result[] = [];
  if (distance && efficiency) {
    let litersNeeded = 0;
    const dist = parseFloat(distance);
    const actualDist = isRoundtrip && dist > 0 ? dist * 2 : dist;
    const eff = parseFloat(efficiency);

    if (actualDist > 0 && eff > 0) {
      if (efficiencyUnit === 'km/l') {
        litersNeeded = actualDist / eff;
      } else if (efficiencyUnit === 'l/100km') {
        litersNeeded = (actualDist / 100) * eff;
      }
    }
  
    results = fuelGrades
      .filter(grade => parseFloat(grade.price) > 0)
      .map(grade => ({
        ...grade,
        liters: litersNeeded,
        totalCost: litersNeeded * (parseFloat(grade.price) || 0)
      }));
  }

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value;
    const eff = parseFloat(efficiency);
    if (newUnit !== efficiencyUnit && efficiency !== '' && eff > 0) {
      // The conversion formula works identically in both directions!
      const convertedEff = 100 / eff;
      setEfficiency((Math.round(convertedEff * 10) / 10).toString());
    }
    setEfficiencyUnit(newUnit);
  };

  const updateFuelGrade = (id: number, field: string, value: string | number) => {
    setFuelGrades(fuelGrades.map(grade =>
      grade.id === id ? {...grade, [field]: value} : grade
    ));
  };

  const addFuelGrade = () => {
    const newId = fuelGrades.length > 0 ? Math.max(...fuelGrades.map(f => f.id)) + 1 : 1;
    setFuelGrades([...fuelGrades, {id: newId, name: `Fuel Grade ${newId}`, price: '0'}]);
  };

  const removeFuelGrade = (id: number) => {
    if (fuelGrades.length > 1) {
      setFuelGrades(fuelGrades.filter(grade => grade.id !== id));
    }
  };

  const inputProps = {
    enterKeyHint: 'done' as const,
    // Selects the texts on focus
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.target.select();
    },
    // Blurs the input field on enter key
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') (e.target as HTMLElement).blur();
    },
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="bg-purple-700 text-white p-6 rounded-2xl shadow-md flex items-center space-x-4">
          <div className="bg-purple-600 p-4 rounded-full">
            <Calculator size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Fuel Cost Calculator</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 order-2 sm:order-1">
            <h2 className="text-lg font-semibold border-b border-slate-200 pb-2 flex items-center gap-2 text-purple-900">
              <Map className="w-5 h-5" /> Primary Parameters
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-600">Trip Distance (km)</label>
                  <label className="flex items-center gap-1 text-sm text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRoundtrip}
                      onChange={(e) => setIsRoundtrip(e.target.checked)}
                      className="accent-pink-500 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    Roundtrip
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    {...inputProps}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                    km
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Gauge className="w-4 h-4" /> Efficiency
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={efficiency}
                    onChange={(e) => setEfficiency(e.target.value)}
                    {...inputProps}
                    className="flex-1 min-w-1/2 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                  />
                  <select
                    value={efficiencyUnit}
                    onChange={handleUnitChange}
                    className="flex-none bg-slate-50 border border-slate-300 rounded-xl px-2 outline-none cursor-pointer"
                  >
                    <option value="l/100km">L / 100km</option>
                    <option value="km/l">km / L</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 order-1 sm:order-2">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-purple-900">
                <Fuel className="w-5 h-5" /> Fuel Grades
              </h2>
              <button
                onClick={addFuelGrade}
                className="text-sm flex items-center gap-1 text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Grade
              </button>
            </div>
            <div className="space-y-3 max-h-120 overflow-y-auto">
              {fuelGrades.map(grade => (
                <div key={grade.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text" value={grade.name}
                      onChange={(e) => updateFuelGrade(grade.id, 'name', e.target.value)}
                      {...inputProps}
                      className="w-full text-sm p-1 border-b border-slate-200 bg-transparent outline-none focus:border-purple-500"
                    />
                    <div className="flex items-center text-sm">
                      <span className="mr-1 text-slate-500">NT$</span>
                      <input
                        type="number" step="0.1" value={grade.price}
                        onChange={(e) => updateFuelGrade(grade.id, 'price', e.target.value)}
                        {...inputProps}
                        className="w-20 p-1 border-b border-slate-200 bg-transparent outline-none focus:border-purple-500"
                      />
                      <span className="ml-1 text-slate-500">/ L</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFuelGrade(grade.id)}
                    disabled={fuelGrades.length === 1}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${fuelGrades.length === 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-red-400 hover:text-red-600 hover:bg-red-50'
                      }`}
                    title="Remove fuel grade"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 flex justify-end px-2 order-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-purple-700 transition-colors">
              <input
                type="checkbox"
                checked={rememberSettings}
                onChange={(e) => setRememberSettings(e.target.checked)}
                className="accent-pink-500 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              Remember settings between sessions
            </label>
          </div>
        </div>

        <div className="bg-purple-50 p-3 md:p-6 rounded-2xl border border-purple-100">
          <h2 className="text-xl font-bold text-purple-900 mb-4">Calculated Projections</h2>
          {(parseFloat(distance) <= 0 || parseFloat(efficiency) <= 0 || isNaN(parseFloat(distance)) || isNaN(parseFloat(efficiency)))
            ? (
              <div className="text-center p-4 bg-white/60 rounded-xl mt-4 text-purple-800 text-sm">
                * Awaiting valid inputs for distance and efficiency.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
                {results.map(res => (
                  <div key={`result-${res.id}`} className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 relative overflow-hidden group hover:border-purple-300 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                    <h3 className="font-semibold text-slate-800 truncate pr-4">{res.name || 'Unnamed Grade'}</h3>
                    <div className="text-sm text-slate-500 mt-1 mb-4">@ NT$ {Number(res.price).toFixed(2)} / L</div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Fuel Required:</span>
                        <span className="font-medium text-slate-700">{res.liters > 0 ? res.liters.toFixed(2) : '0.00'} L</span>
                      </div>
                      <div className="flex justify-between items-end pt-2 border-t border-slate-100 mt-2">
                        <span className="text-slate-600 font-medium">Estimated Cost:</span>
                        <span className="text-2xl font-bold text-purple-700">
                          NT$ {Math.ceil(res.totalCost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App
