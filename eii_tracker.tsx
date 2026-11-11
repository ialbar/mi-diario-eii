import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Activity, Camera, BookOpen, PlusCircle, LayoutDashboard, CheckCircle2, ChevronRight, FileText, Download } from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'eii-tracker-app';

// --- DEFAULT FORM STATE ---
const getEmptyForm = () => ({
  date: new Date().toISOString().split('T')[0],
  meals: { breakfast: '', midMorning: '', lunch: '', snack: '', dinner: '' },
  habits: { baseProteinsVegLunch: false, baseProteinsVegDinner: false, slowEating: false, noHeavyMixes: false, avoidedBadFoods: false },
  energy: { didSnack: false, noExtremeHunger: false, morning: 'media', afternoon: 'media' },
  digestion: { bloating: 0, pain: 0, gas: 0 },
  stools: { count: 0, urgency: 0 },
  symptoms: { jointPain: 0, headache: 0, skin: 0 },
  supplements: { cafeina: false, somnilove: false, stressOff: false, omega3: false },
  medicines: { arcoxia: '', lorazepam: '' },
  comments: ''
});

export default function EIITrackerApp() {
  const [activeTab, setActiveTab] = useState('form');
  const [formData, setFormData] = useState(getEmptyForm());
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load data on mount
  useEffect(() => {
    const loadData = () => {
      try {
        const storedLogs = localStorage.getItem(`logs_${appId}`);
        if (storedLogs) {
          setLogs(JSON.parse(storedLogs));
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
      }
    };
    loadData();
  }, []);

  const updateNested = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const handleSave = () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const newLog = {
        ...formData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      
      const updatedLogs = [...logs, newLog];
      setLogs(updatedLogs);
      localStorage.setItem(`logs_${appId}`, JSON.stringify(updatedLogs));
      
      setSaveStatus('success');
      setTimeout(() => {
        setFormData(getEmptyForm());
        setSaveStatus(null);
        setActiveTab('dashboard');
      }, 1500);
    } catch (error) {
      console.error("Error saving doc: ", error);
      setSaveStatus('error');
    }
    setLoading(false);
  };

  const downloadCSV = () => {
    if (!logs || logs.length === 0) return;
    
    // Cabeceras del Excel
    const headers = ['Fecha', 'Desayuno', 'Comida', 'Cena', 'Arcoxia (mg)', 'Lorazepam (mg)', 'Dolor Abdominal (0-3)', 'Hinchazón (0-3)', 'Nº Deposiciones', 'Urgencia (0-3)', 'Dolor Articular (0-9)', 'Comentarios'];
    
    // Mapeamos los datos de cada día a una fila
    const rows = logs.map(log => [
      log.date,
      `"${log.meals?.breakfast || ''}"`,
      `"${log.meals?.lunch || ''}"`,
      `"${log.meals?.dinner || ''}"`,
      log.medicines?.arcoxia || 0,
      log.medicines?.lorazepam || 0,
      log.digestion?.pain || 0,
      log.digestion?.bloating || 0,
      log.stools?.count || 0,
      log.stools?.urgency || 0,
      log.symptoms?.jointPain || 0,
      `"${(log.comments || '').replace(/\n/g, ' ')}"`
    ]);

    // Construimos el archivo
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    
    // Forzamos la descarga
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "registro_diario_eii.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 md:pb-0">
      
      {/* Top Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Activity className="text-emerald-600 w-6 h-6" />
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">EII Tracker</h1>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <NavButton active={activeTab === 'form'} onClick={() => setActiveTab('form')} icon={<PlusCircle size={18}/>} text="Registro Diario" />
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18}/>} text="Estadísticas" />
              <NavButton active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<Camera size={18}/>} text="Escanear" />
              <NavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen size={18}/>} text="Guía EII" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto p-4 py-8">
        {activeTab === 'form' && (
          <FormView 
            formData={formData} 
            setFormData={setFormData} 
            updateNested={updateNested} 
            handleSave={handleSave} 
            loading={loading} 
            saveStatus={saveStatus} 
          />
        )}
        {activeTab === 'dashboard' && <DashboardView logs={logs} onDownload={downloadCSV} />}
        {activeTab === 'scanner' && <ScannerView />}
        {activeTab === 'guide' && <GuideView />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-slate-200 z-50 flex justify-around p-2 pb-safe">
        <MobileNavButton active={activeTab === 'form'} onClick={() => setActiveTab('form')} icon={<PlusCircle />} text="Registro" />
        <MobileNavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} text="Datos" />
        <MobileNavButton active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} icon={<Camera />} text="Escanear" />
        <MobileNavButton active={activeTab === 'guide'} onClick={() => setActiveTab('guide')} icon={<BookOpen />} text="Guía" />
      </nav>
    </div>
  );
}

// --- UI COMPONENTS ---
const NavButton = ({ active, onClick, icon, text }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm
      ${active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'}`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

const MobileNavButton = ({ active, onClick, icon, text }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full py-2 space-y-1 transition-colors
      ${active ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {React.cloneElement(icon, { size: 24, strokeWidth: active ? 2.5 : 2 })}
    <span className="text-[10px] font-medium tracking-wide">{text}</span>
  </button>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-start space-x-3 cursor-pointer group">
    <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
      <input 
        type="checkbox" 
        className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <CheckCircle2 className="absolute text-white opacity-0 peer-checked:opacity-100 w-4 h-4 pointer-events-none transition-opacity" />
    </div>
    <span className="text-slate-700 group-hover:text-slate-900 select-none text-sm">{label}</span>
  </label>
);

const ScaleInput = ({ label, value, max = 3, onChange }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">{value}</span>
    </div>
    <div className="flex space-x-2">
      {Array.from({length: max + 1}, (_, i) => i).map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 py-1.5 text-center text-sm font-medium transition-all rounded-md border
            ${value === v 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);

const Scale9Input = ({ label, value, onChange }) => (
  <div className="flex flex-col space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">{value || 0}</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`flex-1 min-w-[28px] py-1 text-center text-sm font-medium transition-all border rounded-md
            ${(value || 0) === v 
              ? 'bg-rose-500 border-rose-500 text-white shadow-sm' 
              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);

const EnergyToggle = ({ label, value, onChange }) => (
  <div className="flex flex-col space-y-2">
    <span className="text-sm font-medium text-slate-700">{label}</span>
    <div className="flex bg-slate-100 p-1 rounded-lg">
      {['baja', 'media', 'buena'].map(level => (
        <button
          key={level}
          onClick={() => onChange(level)}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md capitalize transition-colors
            ${value === level ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {level}
        </button>
      ))}
    </div>
  </div>
);

// --- MAIN VIEWS ---

const FormView = ({ formData, setFormData, updateNested, handleSave, loading, saveStatus }) => (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 md:pb-0">
    
    <div className="flex justify-between items-center">
      <h2 className="text-2xl font-bold text-slate-800">Checklist Diario</h2>
      <input 
        type="date" 
        value={formData.date}
        onChange={(e) => setFormData({...formData, date: e.target.value})}
        className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium bg-white"
      />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* MEALS SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
        <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 flex items-center space-x-2">
          <span className="text-xl">🍽️</span>
          <h3 className="font-semibold text-orange-800">Registro de Comidas</h3>
        </div>
        <div className="p-4 space-y-4">
          {['Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena'].map((mealStr, idx) => {
            const keys = ['breakfast', 'midMorning', 'lunch', 'snack', 'dinner'];
            const key = keys[idx];
            return (
              <div key={key} className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">{mealStr}:</label>
                <input 
                  type="text" 
                  value={formData.meals[key]} 
                  onChange={(e) => updateNested('meals', key, e.target.value)}
                  placeholder="¿Qué has comido exactamente?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm bg-slate-50 focus:bg-white transition-colors"
                />
                {key === 'lunch' && (
                  <div className="pt-1 pb-2 ml-1">
                    <Checkbox label="Estructura base + proteína + verdura en comida" checked={formData.habits.baseProteinsVegLunch} onChange={(val) => updateNested('habits', 'baseProteinsVegLunch', val)} />
                  </div>
                )}
                {key === 'dinner' && (
                  <div className="pt-1 pb-2 ml-1">
                    <Checkbox label="Estructura base + proteína + verdura en cena" checked={formData.habits.baseProteinsVegDinner} onChange={(val) => updateNested('habits', 'baseProteinsVegDinner', val)} />
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Hábitos y Gestión</h4>
            <Checkbox label="He comido despacio" checked={formData.habits.slowEating} onChange={(val) => updateNested('habits', 'slowEating', val)} />
            <Checkbox label="No he hecho mezclas muy pesadas" checked={formData.habits.noHeavyMixes} onChange={(val) => updateNested('habits', 'noHeavyMixes', val)} />
            <Checkbox label="He evitado alimentos que sé que me sientan mal" checked={formData.habits.avoidedBadFoods} onChange={(val) => updateNested('habits', 'avoidedBadFoods', val)} />
            <Checkbox label="He hecho la merienda" checked={formData.energy.didSnack} onChange={(val) => updateNested('energy', 'didSnack', val)} />
            <Checkbox label="No he llegado con hambre extrema a la cena" checked={formData.energy.noExtremeHunger} onChange={(val) => updateNested('energy', 'noExtremeHunger', val)} />
          </div>
        </div>
      </div>

      {/* SUPPLEMENTS & MEDS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden md:col-span-2">
        <div className="bg-purple-50 px-4 py-3 border-b border-purple-100 flex items-center space-x-2">
          <span className="text-xl">💊</span>
          <h3 className="font-semibold text-purple-800">Suplementos y Medicación</h3>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Suplementos</h4>
            <Checkbox label="Natural Cafeína" checked={formData.supplements.cafeina} onChange={(val) => updateNested('supplements', 'cafeina', val)} />
            <Checkbox label="SomniLove" checked={formData.supplements.somnilove} onChange={(val) => updateNested('supplements', 'somnilove', val)} />
            <Checkbox label="Stress Off" checked={formData.supplements.stressOff} onChange={(val) => updateNested('supplements', 'stressOff', val)} />
            <Checkbox label="Vegan Omega 3" checked={formData.supplements.omega3} onChange={(val) => updateNested('supplements', 'omega3', val)} />
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Medicinas</h4>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700 w-24">Arcoxia:</span>
              <input 
                type="number" min="0" step="any" placeholder="mg"
                value={formData.medicines.arcoxia} 
                onChange={(e) => updateNested('medicines', 'arcoxia', e.target.value)}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-md text-center focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-sm text-slate-500">mg</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-slate-700 w-24">Lorazepam:</span>
              <input 
                type="number" min="0" step="any" placeholder="mg"
                value={formData.medicines.lorazepam} 
                onChange={(e) => updateNested('medicines', 'lorazepam', e.target.value)}
                className="w-24 px-3 py-1.5 border border-slate-300 rounded-md text-center focus:ring-purple-500 focus:border-purple-500"
              />
              <span className="text-sm text-slate-500">mg</span>
            </div>
          </div>
        </div>
      </div>

      {/* DIGESTION SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center space-x-2">
          <span className="text-xl">⚙️</span>
          <h3 className="font-semibold text-emerald-800">Digestión y Síntomas (0-3)</h3>
        </div>
        <div className="p-4 space-y-5">
           <ScaleInput label="Hinchazón" value={formData.digestion.bloating} onChange={(val) => updateNested('digestion', 'bloating', val)} />
           <ScaleInput label="Dolor abdominal" value={formData.digestion.pain} onChange={(val) => updateNested('digestion', 'pain', val)} />
           <ScaleInput label="Gases" value={formData.digestion.gas} onChange={(val) => updateNested('digestion', 'gas', val)} />
        </div>
      </div>

      {/* STOOLS & ENERGY SECTION */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center space-x-2">
            <span className="text-xl">🚽</span>
            <h3 className="font-semibold text-blue-800">Deposiciones</h3>
          </div>
          <div className="p-4 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Nº de veces</span>
              <div className="flex items-center space-x-3">
                <button onClick={() => updateNested('stools', 'count', Math.max(0, formData.stools.count - 1))} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">-</button>
                <span className="text-lg font-bold w-6 text-center">{formData.stools.count}</span>
                <button onClick={() => updateNested('stools', 'count', formData.stools.count + 1)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200">+</button>
              </div>
            </div>
            <ScaleInput label="Urgencia" value={formData.stools.urgency} onChange={(val) => updateNested('stools', 'urgency', val)} />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-semibold text-amber-800">Energía General</h3>
          </div>
          <div className="p-4 space-y-4">
             <EnergyToggle label="Mañana" value={formData.energy.morning} onChange={(val) => updateNested('energy', 'morning', val)} />
             <EnergyToggle label="Tarde" value={formData.energy.afternoon} onChange={(val) => updateNested('energy', 'afternoon', val)} />
          </div>
        </div>
      </div>

      {/* OTHER SYMPTOMS 0-9 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center space-x-2">
          <span className="text-xl">⚠️</span>
          <h3 className="font-semibold text-rose-800">Otros dolores y piel (0-9)</h3>
        </div>
        <div className="p-4 space-y-5">
           <Scale9Input label="Dolor articular" value={formData.symptoms.jointPain} onChange={(val) => updateNested('symptoms', 'jointPain', val)} />
           <Scale9Input label="Dolor de cabeza" value={formData.symptoms.headache} onChange={(val) => updateNested('symptoms', 'headache', val)} />
           <Scale9Input label="Piel (irritación, eccema)" value={formData.symptoms.skin} onChange={(val) => updateNested('symptoms', 'skin', val)} />
        </div>
      </div>

      {/* COMMENTS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center space-x-2">
          <span className="text-xl">📝</span>
          <h3 className="font-semibold text-slate-700">Comentarios del día</h3>
        </div>
        <div className="p-4">
          <textarea
            value={formData.comments}
            onChange={(e) => setFormData({...formData, comments: e.target.value})}
            placeholder="Anota aquí observaciones de tolerancia a comidas, estrés emocional, etc."
            className="w-full h-32 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none text-sm bg-slate-50 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 md:bottom-6 left-0 right-0 p-4 md:p-0 md:max-w-4xl md:mx-auto z-40 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-12 md:bg-none pb-[80px] md:pb-0 pointer-events-none flex justify-center">
        <button 
          onClick={handleSave}
          disabled={loading}
          className="pointer-events-auto flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-70"
        >
          {loading ? (
            <span className="animate-pulse">Guardando...</span>
          ) : saveStatus === 'success' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <span>Guardar Registro Diario</span>
          )}
        </button>
      </div>

    </div>
  </div>
);


const DashboardView = ({ logs, onDownload }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500 flex flex-col items-center">
        <LayoutDashboard className="w-16 h-16 text-slate-200 mb-4" />
        <h3 className="text-lg font-medium text-slate-700">No hay datos todavía</h3>
        <p className="max-w-xs mt-2">Rellena tu primer registro diario para empezar a ver estadísticas.</p>
      </div>
    );
  }

  // Formatting data for Recharts
  const chartData = [...logs].sort((a,b) => new Date(a.date) - new Date(b.date)).map(log => {
    const d = new Date(log.date);
    return {
      dateOriginal: log.date,
      dateShort: `${d.getDate()}/${d.getMonth()+1}`,
      hinchazon: log.digestion?.bloating || 0,
      dolor: log.digestion?.pain || 0,
      gases: log.digestion?.gas || 0,
      deposiciones: log.stools?.count || 0,
      urgencia: log.stools?.urgency || 0,
      // Calculate a simplistic symptom score (higher is worse) for the combined view
      totalSíntomas: (log.digestion?.bloating || 0) + (log.digestion?.pain || 0) + (log.digestion?.gas || 0) + ((log.stools?.urgency || 0) * 1.5)
    };
  });

  // Calculate Lorazepam statistics safely (ignoring old logs without this field)
  const lorazepamLogs = logs.filter(l => l.medicines && l.medicines.lorazepam !== '' && l.medicines.lorazepam !== null && l.medicines.lorazepam !== undefined);
  const totalLorazepamDose = lorazepamLogs.reduce((sum, log) => sum + parseFloat(log.medicines.lorazepam || 0), 0);
  const avgLorazepam = lorazepamLogs.length > 0 ? (totalLorazepamDose / lorazepamLogs.length).toFixed(1) : 0;

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 md:pb-0">
      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <LayoutDashboard className="text-emerald-600 w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Tus Estadísticas</h2>
            <p className="text-sm text-slate-500">Analiza la evolución de tus síntomas</p>
          </div>
        </div>
        
        <button 
          onClick={onDownload}
          className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors text-sm border border-slate-200"
          title="Descargar datos para el dietista"
        >
          <Download size={18} />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>
      </div>
      
      {/* DIGESTION CHART */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center"><span className="mr-2">⚙️</span> Evolución Digestiva (0-3)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dateShort" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
              <YAxis domain={[0, 3]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              <Line type="monotone" dataKey="dolor" stroke="#ef4444" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Dolor Abdominal" />
              <Line type="monotone" dataKey="hinchazon" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Hinchazón" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* STOOLS CHART */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-slate-700 mb-4 flex items-center"><span className="mr-2">🚽</span> Deposiciones y Urgencia</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="dateShort" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
              <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 3]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
              <Bar yAxisId="left" dataKey="deposiciones" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Nº Deposiciones" />
              <Line yAxisId="right" type="monotone" dataKey="urgencia" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} name="Nivel Urgencia (0-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* QUICK SUMMARY (SYMPTOMS 0-9) */}
      <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100 mb-8">
        <h4 className="font-semibold text-emerald-800 mb-3">Resumen de Síntomas Extra</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
            <div className="text-2xl font-bold text-slate-700">
              {logs.filter(l => (l.symptoms?.jointPain || 0) > 3).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Días Dolor Articular (&gt;3)</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
            <div className="text-2xl font-bold text-slate-700">
              {logs.filter(l => (l.symptoms?.headache || 0) > 3).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Días con Cefalea (&gt;3)</div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm border border-emerald-100">
            <div className="text-2xl font-bold text-slate-700">
              {logs.filter(l => (l.symptoms?.skin || 0) > 3).length}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Días Piel Irritada (&gt;3)</div>
          </div>
        </div>
      </div>

      {/* LORAZEPAM STATS */}
      {lorazepamLogs.length > 0 && (
        <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 mb-8">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center"><span className="mr-2">💊</span> Estadística de Lorazepam</h4>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-around bg-white p-4 rounded-lg shadow-sm border border-purple-100">
            <div className="text-center w-full sm:w-auto">
              <div className="text-sm text-slate-500 uppercase tracking-wide">Días registrados (con uso)</div>
              <div className="text-2xl font-bold text-purple-700">{lorazepamLogs.length}</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-purple-100"></div>
            <div className="w-full h-px sm:hidden bg-purple-100 my-2"></div>
            <div className="text-center w-full sm:w-auto">
              <div className="text-sm text-slate-500 uppercase tracking-wide">Dosis media (días de uso)</div>
              <div className="text-2xl font-bold text-purple-700">{avgLorazepam} <span className="text-base font-normal">mg</span></div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-purple-100"></div>
            <div className="w-full h-px sm:hidden bg-purple-100 my-2"></div>
            <div className="text-center w-full sm:w-auto">
              <div className="text-sm text-slate-500 uppercase tracking-wide">Dosis total acumulada</div>
              <div className="text-2xl font-bold text-purple-700">{totalLorazepamDose} <span className="text-base font-normal">mg</span></div>
            </div>
          </div>
          <p className="text-xs text-purple-600 mt-3 text-center">* Solo se contabilizan los días en los que se registró explícitamente la dosis en mg.</p>
        </div>
      )}
    </div>
  );
};


const ScannerView = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 text-emerald-600">
        <Camera size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-3">Escanear Plantilla Física</h2>
      <p className="text-slate-500 mb-8 leading-relaxed">
        Sube una foto de tu checklist en papel. Utilizaremos inteligencia artificial para extraer los datos y añadirlos automáticamente a tus estadísticas.
      </p>
      
      <div className="w-full bg-white border-2 border-dashed border-slate-300 rounded-xl p-8 transition-colors hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer flex flex-col items-center justify-center">
        <FileText className="text-slate-400 mb-3" size={32} />
        <span className="font-medium text-slate-700">Toca aquí para seleccionar una foto</span>
        <span className="text-xs text-slate-400 mt-2">Formatos soportados: JPG, PNG</span>
      </div>

      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-left flex items-start space-x-3">
        <span className="text-xl">⚠️</span>
        <p><strong>Nota técnica:</strong> La integración de Google Gemini Pro Vision para OCR requiere configuración de API Keys de backend. El frontend está preparado para recibir la imagen cuando el endpoint esté listo.</p>
      </div>
    </div>
  );
};

const GuideView = () => {
  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16 md:pb-0">
      <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 pb-4">
        <BookOpen className="text-emerald-600 w-8 h-8" />
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Guía Clínica EII</h2>
          <p className="text-sm text-slate-500">Fisiología, dieta y estilo de vida</p>
        </div>
      </div>

      <div className="space-y-6">
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg flex items-center">
              <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
              La Fisiología del Intestino
            </h3>
          </div>
          <div className="p-5 text-slate-600 text-sm leading-relaxed space-y-3">
            <p>La EII es una respuesta inmunitaria desproporcionada hacia la propia microbiota intestinal, a menudo desencadenada por un fallo en la barrera protectora del intestino.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>La barrera de moco y los aditivos:</strong> Investigaciones recientes han demostrado que aditivos muy comunes (emulsionantes y ciertos espesantes) actúan como "detergentes" que rompen la capa de moco protectora. Eliminar los ultraprocesados es la primera línea de defensa.</li>
              <li><strong>El papel del Butirato:</strong> Las células del colon se alimentan de ácidos grasos de cadena corta (AGCC), especialmente el butirato. Este compuesto lo fabrican las bacterias al fermentar fibra soluble y almidón resistente. Reintroducir patata o arroz cocidos y luego enfriados es fundamental para reparar el tejido dañado en remisión.</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg flex items-center">
              <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
              Estrategias Nutricionales
            </h3>
          </div>
          <div className="p-5 text-slate-600 text-sm leading-relaxed space-y-3">
            <p>No existe una dieta universal, pero la aplicación de protocolos contrastados marca la diferencia.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Dieta de Exclusión (CDED):</strong> Excluye agresores como grasas animales pesadas, trigo y lácteos durante 6-12 semanas, y pauta alimentos diseñados para reparar (pechuga de pollo, huevos, patatas y manzanas peladas).</li>
              <li><strong>Dieta Baja en FODMAPs:</strong> Útil si estando en remisión sigues con gases o hinchazón. Ayuda a identificar qué carbohidratos fermentables específicos te generan problemas mecánicos.</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-lg flex items-center">
              <span className="bg-orange-100 text-orange-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
              Eje Intestino-Cerebro y Carga Física
            </h3>
          </div>
          <div className="p-5 text-slate-600 text-sm leading-relaxed space-y-3">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Modulación del Deporte:</strong> En remisión, el entrenamiento de fuerza y cardiovascular es excelente. En fase de brote, el esfuerzo intenso provoca <em>isquemia intestinal transitoria</em> (la sangre se desvía a los músculos), lo que empeora gravemente la mucosa. En esos días, prioriza la movilidad suave.</li>
              <li><strong>Carga Cognitiva:</strong> Mantener una alta carga mental de forma continua (estrés) mantiene el sistema en alerta (cortisol alto), debilitando las uniones celulares del intestino. Es vital activar el nervio vago (parasimpático) mediante respiración para poder digerir y desinflamar.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};