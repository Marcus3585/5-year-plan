import React, { useState, useEffect } from 'react';
import CityView from './components/CityView';
import { NumberTicker } from './components/NumberTicker';
import { GameState, INITIAL_STATE, GDPState } from './types';
import { EVENTS, START_YEAR, END_YEAR } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
const FactoryIcon = () => <span>🏭</span>;
const WheatIcon = () => <span>🌾</span>;
const ShirtIcon = () => <span>👕</span>;

const App: React.FC = () => {
  const [state, setState] = useState<GameState>({
    year: START_YEAR,
    gdp: { ...INITIAL_STATE },
    selectedGoal: null,
    rocketProgramStarted: false,
    rocketLaunched: false,
    modifiers: { heavyEfficiency: 1.0, agriEfficiency: 1.0, heavyBonus: 0.0, stability: 1.0 },
    flags: { greatLeap: false, sovietSplit: false },
    gameOver: false,
    phase: 'setup',
  });

  const [allocation, setAllocation] = useState({ heavy: 50, light: 25, agri: 25 });
  const [budgetError, setBudgetError] = useState(false);

  // Derived Values
  const totalAllocation = allocation.heavy + allocation.light + allocation.agri;
  const isAllocationValid = totalAllocation === 100;
  const totalGDP = state.gdp.heavy + state.gdp.light + state.gdp.agri;

  // Handlers
  const handleStart = (goal: 'industrial' | 'agricultural') => {
    setState(prev => ({ ...prev, selectedGoal: goal, phase: 'playing' }));
    if (goal === 'industrial') setAllocation({ heavy: 55, light: 25, agri: 20 });
    else setAllocation({ heavy: 30, light: 35, agri: 35 });
  };

  const handleSliderChange = (key: keyof typeof allocation, val: string) => {
    setAllocation(prev => ({ ...prev, [key]: parseInt(val) }));
  };

  const processYear = () => {
    if (!isAllocationValid) {
        setBudgetError(true);
        setTimeout(() => setBudgetError(false), 500);
        return;
    }

    const { heavy, light, agri } = allocation;
    const sovietAid = (state.year < 1960 && !state.flags.sovietSplit) ? 0.08 : 0;
    
    // Growth Logic
    let heavyRate = (0.12 + sovietAid + state.modifiers.heavyBonus) 
                    * (heavy / 100) * 2.2 * state.modifiers.heavyEfficiency;
    // Boost bonus for extreme investment
    if (heavy > 45) heavyRate *= 1.1; 

    let lightRate = 0.10 * (light / 100) * 1.4;
    
    let agriRate = 0.04 * (agri / 100) * 1.0 * state.modifiers.agriEfficiency;
    // Natural Disaster Logic
    if (state.year >= 1959 && state.year <= 1961) agriRate -= 0.04;

    const newGdp: GDPState = {
        heavy: Math.max(10, state.gdp.heavy * (1 + heavyRate)),
        light: Math.max(10, state.gdp.light * (1 + lightRate)),
        agri: Math.max(10, state.gdp.agri * (1 + agriRate)),
    };

    const event = EVENTS[state.year];

    setState(prev => ({
        ...prev,
        phase: 'report',
        reportData: {
            year: prev.year,
            rates: { heavy: heavyRate, light: lightRate, agri: agriRate },
            event
        },
        gdp: newGdp
    }));
  };

  const handleEventDecision = (accept: boolean) => {
    if (state.reportData?.event && accept) {
        const effects = state.reportData.event.effect(state);
        setState(prev => ({
            ...prev,
            modifiers: effects.modifiers || prev.modifiers,
            flags: effects.flags || prev.flags
        }));
    }
    nextYear();
  };

  const nextYear = () => {
    const nextYearVal = state.year + 1;
    
    // Check Rocket Trigger
    let rocket = state.rocketProgramStarted;
    const heavyGrowth = (state.gdp.heavy / INITIAL_STATE.heavy) - 1;
    const lightGrowth = (state.gdp.light / INITIAL_STATE.light) - 1;
    
    if (!rocket && nextYearVal >= 1958 && heavyGrowth > 1.5 && lightGrowth > 0.25) {
        rocket = true;
    }

    // Check Rocket Launch End Game
    let launched = state.rocketLaunched;
    if (rocket && heavyGrowth > 3.0 && nextYearVal === END_YEAR) {
        launched = true;
    }

    if (nextYearVal > END_YEAR) {
        setState(prev => ({ ...prev, rocketProgramStarted: rocket, rocketLaunched: launched, phase: 'summary' }));
    } else {
        // Special check for Phase 1 summary (1958)
        if (nextYearVal === 1958 && state.phase !== 'summary') {
             setState(prev => ({ ...prev, year: nextYearVal, rocketProgramStarted: rocket, phase: 'summary' }));
        } else {
             setState(prev => ({ ...prev, year: nextYearVal, rocketProgramStarted: rocket, phase: 'playing' }));
        }
    }
  };

  const getEnding = () => {
    const hGrowth = (state.gdp.heavy / INITIAL_STATE.heavy) - 1;
    const aGrowth = (state.gdp.agri / INITIAL_STATE.agri) - 1;

    if (state.rocketLaunched) return {
        title: "大國重器：兩彈一星", desc: "憑藉強大的重工業基礎，成功發射了人造衛星，國家安全得到絕對保障，屹立於世界民族之林。", color: "bg-indigo-50 border-indigo-600 text-indigo-900", icon: "🚀"
    };
    if (aGrowth < -0.1) return {
        title: "深刻的反思", desc: "雖然工業有所發展，但忽視了農業基礎，導致民生艱難。經濟結構嚴重失衡，需要漫長的時間來恢復元氣。", color: "bg-red-50 border-red-600 text-red-900", icon: "📉"
    };
    if (hGrowth > 3.0) return {
        title: "工業巨人的崛起", desc: "建立了極為完備的工業體系，鋼鐵產量躍居世界前列。雖然生活水平提升有限，但為未來騰飛積蓄了無可比擬的力量。", color: "bg-slate-100 border-slate-600 text-slate-900", icon: "🏭"
    };
    if (aGrowth > 0.5 && hGrowth > 1.0) return {
        title: "繁榮的社會主義", desc: "工農業協調發展，人民生活富足，市場供應充足。走出了一條穩健而獨特的發展道路。", color: "bg-green-50 border-green-600 text-green-900", icon: "🏡"
    };
    return {
        title: "艱難的探索", desc: "十年風雨兼程，雖然發展速度未達預期，且歷經波折，但國家獨立自主，積累了寶貴的建設經驗。", color: "bg-stone-100 border-stone-600 text-stone-900", icon: "📖"
    };
  };

  const getAchievements = () => {
      const list = [];
      if (state.gdp.heavy > 500) list.push({ name: "鋼鐵洪流", desc: "重工業指數突破 500" });
      if (state.gdp.agri > 1200) list.push({ name: "天下糧倉", desc: "農業指數突破 1200" });
      if (state.gdp.light > 500) list.push({ name: "百花齊放", desc: "輕工業指數突破 500" });
      if (state.rocketLaunched) list.push({ name: "東方紅", desc: "成功發射人造衛星" });
      if (state.flags.sovietSplit && state.gdp.heavy > 300) list.push({ name: "自力更生", desc: "在蘇聯撤資後維持工業增長" });
      return list;
  };

  const StatRow = ({ label, start, end, icon, color }: { label: string, start: number, end: number, icon: any, color: string }) => {
      const growth = ((end - start) / start) * 100;
      return (
          <div className="flex items-center justify-between py-2 border-b border-stone-200 last:border-0">
              <div className="flex items-center gap-2">
                  <span className="text-xl">{icon}</span>
                  <span className="font-bold text-stone-700">{label}</span>
              </div>
              <div className="flex items-center gap-4">
                  <div className="text-stone-400 text-sm hidden md:block">{Math.round(start)} →</div>
                  <div className="font-mono text-lg font-bold">{Math.round(end)}</div>
                  <div className={`text-xs font-bold px-2 py-0.5 rounded ${growth >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {growth > 0 ? '+' : ''}{growth.toFixed(0)}%
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center items-start text-stone-800">
      <div className="max-w-4xl w-full bg-[#f9f7f3] p-6 rounded-lg shadow-2xl border border-[#d0c8b8] relative overflow-hidden">
        
        {/* Header */}
        <header className="text-center border-b-2 border-red-700 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-red-800 tracking-wider">五年計劃模擬器</h1>
            <p className="text-stone-500 text-sm mt-1">1953 - 1962 · 國家發展決策</p>
        </header>

        {/* Setup Phase */}
        {state.phase === 'setup' && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <p className="text-center text-lg">1953年，百廢待興。請選擇國家未來十年的發展總基調。</p>
                <div className="grid md:grid-cols-2 gap-4">
                    <button onClick={() => handleStart('industrial')} className="p-6 border-2 border-stone-300 rounded-lg hover:border-red-700 hover:bg-red-50 transition-all text-left group">
                        <div className="text-4xl mb-2">🏭</div>
                        <h3 className="font-bold text-xl group-hover:text-red-700">強國工業夢</h3>
                        <p className="text-sm text-stone-600 mt-2">集中力量發展重工業，建立國防與工業體系。</p>
                        <span className="text-xs font-bold text-red-600 mt-2 block">難度：較高</span>
                    </button>
                    <button onClick={() => handleStart('agricultural')} className="p-6 border-2 border-stone-300 rounded-lg hover:border-green-700 hover:bg-green-50 transition-all text-left group">
                        <div className="text-4xl mb-2">🌾</div>
                        <h3 className="font-bold text-xl group-hover:text-green-700">富足農業國</h3>
                        <p className="text-sm text-stone-600 mt-2">優先保障糧食生產，讓人民休養生息。</p>
                        <span className="text-xs font-bold text-green-600 mt-2 block">難度：較低</span>
                    </button>
                </div>
             </motion.div>
        )}

        {/* Main Game Interface */}
        {state.phase !== 'setup' && (
            <div className="space-y-6">
                {/* Status Bar */}
                <div className="flex justify-between items-center bg-amber-50 p-3 rounded border border-amber-200">
                     <div className="font-bold text-red-800">
                        {state.selectedGoal === 'industrial' ? '🏭 工業優先' : '🌾 農業優先'}
                     </div>
                     {state.rocketProgramStarted && (
                        <motion.div 
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="bg-indigo-900 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1"
                        >
                            🚀 兩彈一星研發中
                        </motion.div>
                     )}
                     {(state.year >= 1960 || state.flags.sovietSplit) && (
                        <div className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">⚠️ 蘇聯撤資</div>
                     )}
                </div>

                {/* Visualization */}
                <CityView 
                    gdp={state.gdp} 
                    year={state.year} 
                    isWinter={state.year % 2 === 0} 
                    hasRocket={state.rocketProgramStarted}
                    rocketLaunched={state.rocketLaunched}
                />

                {/* Dashboard Stats */}
                <div className="bg-red-900 text-white p-4 rounded-lg flex justify-between items-center shadow-md">
                    <div className="text-center">
                        <div className="text-xs opacity-80">當前年份</div>
                        <div className="text-3xl font-mono font-bold">{state.year}</div>
                    </div>
                    <div className="h-8 w-px bg-red-700 mx-2"></div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                        <div>
                            <div className="text-xs text-red-200">重工業</div>
                            <div className="font-mono font-bold text-lg"><NumberTicker value={state.gdp.heavy} /></div>
                        </div>
                        <div>
                            <div className="text-xs text-green-200">輕工業</div>
                            <div className="font-mono font-bold text-lg"><NumberTicker value={state.gdp.light} /></div>
                        </div>
                        <div>
                            <div className="text-xs text-yellow-200">農業</div>
                            <div className="font-mono font-bold text-lg"><NumberTicker value={state.gdp.agri} /></div>
                        </div>
                    </div>
                </div>

                {/* Controls - Only show in playing phase */}
                {state.phase === 'playing' && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm"
                    >
                        <h3 className="font-bold text-stone-700 mb-4 border-b pb-2">
                             📋 {state.year}年度 資源分配預算
                        </h3>
                        
                        <div className="space-y-4 mb-6">
                            {[
                                { key: 'heavy', label: '重工業投入', icon: <FactoryIcon />, color: 'text-red-800', rangeColor: 'accent-red-800' },
                                { key: 'light', label: '輕工業投入', icon: <ShirtIcon />, color: 'text-green-700', rangeColor: 'accent-green-700' },
                                { key: 'agri', label: '農業投入', icon: <WheatIcon />, color: 'text-yellow-700', rangeColor: 'accent-yellow-700' }
                            ].map((item) => (
                                <div key={item.key}>
                                    <div className="flex justify-between text-sm mb-1 font-bold">
                                        <span className={`flex items-center gap-2 ${item.color}`}>{item.icon} {item.label}</span>
                                        <span>{allocation[item.key as keyof typeof allocation]}%</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="5" max="90" 
                                        value={allocation[item.key as keyof typeof allocation]}
                                        onChange={(e) => handleSliderChange(item.key as keyof typeof allocation, e.target.value)}
                                        className={`w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer ${item.rangeColor}`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-3">
                             <div className={`px-4 py-1 rounded text-sm font-bold transition-colors duration-200 ${isAllocationValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} ${budgetError ? 'animate-bounce' : ''}`}>
                                資源分配: {totalAllocation}% {isAllocationValid ? '✓' : '(需100%)'}
                             </div>
                             <button 
                                onClick={processYear}
                                disabled={!isAllocationValid}
                                className="w-full bg-red-800 hover:bg-red-900 disabled:bg-stone-400 text-white font-bold py-3 px-4 rounded shadow-lg transition-colors"
                             >
                                執行預算
                             </button>
                        </div>
                    </motion.div>
                )}
            </div>
        )}

        {/* Annual Report Modal */}
        <AnimatePresence>
            {state.phase === 'report' && state.reportData && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                        className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden border-t-4 border-red-800"
                    >
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-center mb-6 border-b pb-2">{state.reportData.year}年 年度報告</h2>
                            
                            <div className="grid grid-cols-3 gap-4 mb-6 bg-stone-50 p-4 rounded">
                                <div className="text-center">
                                    <div className="text-xs text-stone-500">重工增長</div>
                                    <div className="font-bold text-red-800">+{((state.reportData.rates.heavy) * 100).toFixed(1)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-stone-500">輕工增長</div>
                                    <div className="font-bold text-green-700">+{((state.reportData.rates.light) * 100).toFixed(1)}%</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xs text-stone-500">農業增長</div>
                                    <div className={`font-bold ${state.reportData.rates.agri < 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {(state.reportData.rates.agri >= 0 ? '+' : '') + ((state.reportData.rates.agri) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            </div>

                            {state.reportData.event ? (
                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <h3 className="font-bold text-blue-900 mb-2">📅 歷史抉擇：{state.reportData.event.title}</h3>
                                    <p className="text-sm text-blue-800 mb-4">{state.reportData.event.desc}</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => handleEventDecision(true)} className="bg-blue-600 text-white text-sm py-2 px-3 rounded hover:bg-blue-700">
                                            {state.reportData.event.yesText}
                                        </button>
                                        <button onClick={() => handleEventDecision(false)} className="bg-stone-300 text-stone-700 text-sm py-2 px-3 rounded hover:bg-stone-400">
                                            {state.reportData.event.noText}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={() => nextYear()} className="w-full bg-stone-800 text-white py-3 rounded font-bold hover:bg-stone-900">
                                    繼續下一年度
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Summary / End Game Modal */}
        <AnimatePresence>
            {state.phase === 'summary' && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-stone-900/90 z-50 flex items-center justify-center p-4 overflow-y-auto"
                >
                    <motion.div 
                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full p-8 border-4 border-double border-stone-300 my-8"
                    >
                         {state.year === 1958 ? (
                             <div className="text-left">
                                <h2 className="text-3xl font-bold mb-2 text-center text-red-800 border-b-2 border-red-800 pb-2">第一個五年計劃結算 (1953-1957)</h2>
                                <p className="mb-6 text-stone-600 text-center italic">"一橋飛架南北，天塹變通途。" —— 建設初具規模</p>
                                
                                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 mb-6">
                                    <h3 className="font-bold text-stone-700 mb-3 uppercase text-xs tracking-wider">發展數據對比</h3>
                                    <StatRow label="重工業指數" start={INITIAL_STATE.heavy} end={state.gdp.heavy} icon="🏭" color="red" />
                                    <StatRow label="輕工業指數" start={INITIAL_STATE.light} end={state.gdp.light} icon="👕" color="green" />
                                    <StatRow label="農業指數" start={INITIAL_STATE.agri} end={state.gdp.agri} icon="🌾" color="yellow" />
                                </div>

                                {state.rocketProgramStarted ? (
                                    <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 mb-6 shadow-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="text-3xl">🚀</div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900">國防尖端科研項目已啟動</h4>
                                                <p className="text-sm text-indigo-800 mt-1">
                                                    鑑於重工業基礎雄厚，中央決定啟動「兩彈一星」計劃。這將消耗大量資源，但成功後將極大提升國際地位。
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-amber-50 border-l-4 border-amber-600 p-4 mb-6 text-sm text-amber-900">
                                        <p>重工業積累尚不足以開啟尖端國防項目。需要在第二個五年計劃中繼續努力。</p>
                                    </div>
                                )}

                                <div className="text-center">
                                    <button onClick={() => setState(prev => ({ ...prev, phase: 'playing' }))} className="bg-red-800 text-white px-8 py-3 rounded shadow-lg hover:bg-red-900 font-bold transition-transform hover:scale-105">
                                        開啟第二個五年計劃
                                    </button>
                                </div>
                             </div>
                         ) : (
                             <div className="text-left">
                                <h2 className="text-3xl font-bold mb-2 text-center">十年發展總結算 (1953-1962)</h2>
                                <p className="text-center text-stone-500 mb-6">歷史的長河奔騰不息，而這十年留下了不可磨滅的印記。</p>
                                
                                {(() => {
                                    const ending = getEnding();
                                    const achievements = getAchievements();
                                    return (
                                        <>
                                            <div className={`p-6 rounded-lg border-2 ${ending.color} mb-6 shadow-md`}>
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-4xl">{ending.icon}</span>
                                                    <h3 className="text-2xl font-bold">{ending.title}</h3>
                                                </div>
                                                <p className="text-md leading-relaxed opacity-90">{ending.desc}</p>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6 mb-8">
                                                <div className="bg-stone-50 p-4 rounded border border-stone-200">
                                                    <h4 className="font-bold text-stone-700 border-b border-stone-300 pb-2 mb-3">📈 最終數據</h4>
                                                    <StatRow label="重工業" start={INITIAL_STATE.heavy} end={state.gdp.heavy} icon="🏭" color="red" />
                                                    <StatRow label="輕工業" start={INITIAL_STATE.light} end={state.gdp.light} icon="👕" color="green" />
                                                    <StatRow label="農業" start={INITIAL_STATE.agri} end={state.gdp.agri} icon="🌾" color="yellow" />
                                                </div>

                                                <div className="bg-stone-50 p-4 rounded border border-stone-200">
                                                    <h4 className="font-bold text-stone-700 border-b border-stone-300 pb-2 mb-3">🏆 國家成就</h4>
                                                    {achievements.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {achievements.map((ach, i) => (
                                                                <div key={i} className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border border-stone-100">
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                                    <div>
                                                                        <div className="font-bold text-sm text-stone-800">{ach.name}</div>
                                                                        <div className="text-xs text-stone-500">{ach.desc}</div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-stone-400 italic text-sm text-center py-4">無特殊成就達成</div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )
                                })()}
                                
                                <div className="text-center">
                                    <p className="text-xs text-stone-500 italic mb-4">"歷史沒有如果，但未來可以選擇。"</p>
                                    <button onClick={() => window.location.reload()} className="bg-stone-800 text-white px-8 py-3 rounded shadow hover:bg-stone-900 font-bold">
                                        重新開始歷史
                                    </button>
                                </div>
                             </div>
                         )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default App;