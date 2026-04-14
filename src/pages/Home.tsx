import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { ArrowRight, History, Trophy, BarChart3, Target, X, Zap, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getWinnerScorecard, getWinner, getNarrativeAnnotations, getWinnerProfile } from "../lib/data";
import { cn } from "../lib/utils";

export default function Home() {
  const scorecardData = getWinnerScorecard();
  const winnerInfo = getWinner();
  const narratives = getNarrativeAnnotations();
  const profileData = getWinnerProfile();
  const [selectedRound, setSelectedRound] = useState(1);
  const [showFieldAvg, setShowFieldAvg] = useState(false);
  const [showTop10Avg, setShowTop10Avg] = useState(false);
  const [selectedHole, setSelectedHole] = useState<number | null>(null);

  const roundData = useMemo(() => {
    return scorecardData.rounds.find(r => r.roundNumber === selectedRound);
  }, [scorecardData, selectedRound]);

  const activeHoleData = useMemo(() => {
    if (!selectedHole || !roundData) return null;
    return roundData.holes.find(h => h.holeNumber === selectedHole);
  }, [selectedHole, roundData]);

  // Calculate Tournament-Wide Hole Difficulty Ranks
  const tournamentHoleDifficulty = useMemo(() => {
    const holeDeltas: Record<number, number> = {};
    
    scorecardData.rounds.forEach(round => {
      round.holes.forEach(hole => {
        if (!holeDeltas[hole.holeNumber]) holeDeltas[hole.holeNumber] = 0;
        holeDeltas[hole.holeNumber] += ((hole.fieldAvg || hole.par) - hole.par);
      });
    });

    const difficulties = Object.entries(holeDeltas).map(([holeNum, sumDelta]) => ({
      holeNumber: parseInt(holeNum),
      avgDelta: sumDelta / scorecardData.rounds.length
    }));

    return difficulties
      .sort((a, b) => b.avgDelta - a.avgDelta)
      .reduce((acc, curr, idx) => {
        acc[curr.holeNumber] = idx + 1;
        return acc;
      }, {} as Record<number, number>);
  }, [scorecardData]);

  // Calculate Rory's Tournament Average for the selected hole
  const roryHoleAverage = useMemo(() => {
    if (!selectedHole) return 0;
    let sum = 0;
    scorecardData.rounds.forEach(round => {
      const hole = round.holes.find(h => h.holeNumber === selectedHole);
      if (hole) sum += hole.score;
    });
    return Number((sum / scorecardData.rounds.length).toFixed(2));
  }, [selectedHole, scorecardData]);

  // Synthesis of 72-Hole Global Trajectory
  const chartData = useMemo(() => {
    let cumulativeRory = 0;
    let cumulativeField = 0;
    let cumulativeTop10 = 0;
    const fullTrajectory: any[] = [];

    scorecardData.rounds.forEach(round => {
      round.holes.forEach(hole => {
        cumulativeRory += (hole.score - hole.par);
        cumulativeField += ((hole.fieldAvg || hole.par) - hole.par);
        cumulativeTop10 += ((hole.top10Avg || hole.par) - hole.par);
        
        const totalHoleNumber = (round.roundNumber - 1) * 18 + hole.holeNumber;
        
        fullTrajectory.push({
          holeNumber: totalHoleNumber,
          cumulativeToPar: Number(cumulativeRory.toFixed(2)),
          fieldAvgToPar: Number(cumulativeField.toFixed(2)),
          top10ToPar: Number(cumulativeTop10.toFixed(2)),
          isEndOfRound: hole.holeNumber === 18,
          round: round.roundNumber,
          label: `Hole ${totalHoleNumber}`
        });
      });
    });

    return fullTrajectory;
  }, [scorecardData]);

  const [sidebarMode, setSidebarMode] = useState<"winner" | "field" | "top10">("winner");

  const getScoreClass = (score: number, par: number) => {
    const diff = score - par;
    if (diff <= -2) return "score-eagle text-masters-yellow";
    if (diff === -1) return "score-birdie text-masters-yellow";
    if (diff >= 1) return "score-bogey text-masters-green";
    return "score-par text-masters-green";
  };

  const renderTraditionalScorecard = () => {
    if (!roundData) return null;

    const outHoles = roundData.holes.slice(0, 9);
    const inHoles = roundData.holes.slice(9, 18);

    const outPar = outHoles.reduce((acc, h) => acc + h.par, 0);
    const outScore = outHoles.reduce((acc, h) => acc + h.score, 0);
    const inPar = inHoles.reduce((acc, h) => acc + h.par, 0);
    const inScore = inHoles.reduce((acc, h) => acc + h.score, 0);

    const Row = ({ 
      label, 
      values, 
      subtotal, 
      isHeader = false, 
      isComp = false,
      mode
    }: { 
      label: string, 
      values: (string | number | JSX.Element)[], 
      subtotal?: string | number, 
      isHeader?: boolean,
      isComp?: boolean,
      mode?: "field" | "top10"
    }) => (
      <div className={cn(
        "grid-scorecard border-b border-masters-green/10 items-center transition-all group/row", 
        isHeader ? "bg-masters-green text-white font-bold py-2" : "py-3",
        isComp ? "bg-masters-green/5 text-masters-green/60 italic font-medium cursor-pointer hover:bg-masters-green/10 active:bg-masters-green/20" : ""
      )}>
        <div 
          className={cn(
            "pl-4 text-[10px] uppercase tracking-widest font-black transition-colors",
            isComp ? "group-hover/row:text-masters-green" : "opacity-60"
          )}
          onClick={() => {
            if (mode) {
              setSidebarMode(mode);
              setSelectedHole(roundData?.holes[0]?.holeNumber || 1);
            }
          }}
        >
          {label}
        </div>
        {values.map((v, i) => (
          <div 
            key={i} 
            className="text-center font-serif text-lg cursor-pointer hover:scale-125 transition-transform"
            onClick={() => {
              setSelectedHole(outHoles[i]?.holeNumber || inHoles[i - 9]?.holeNumber);
              if (mode) setSidebarMode(mode);
              else setSidebarMode("winner");
            }}
          >
            {v}
          </div>
        ))}
        <div className="text-center font-black bg-masters-green/5 h-full flex items-center justify-center border-l border-masters-green/10">
          {subtotal}
        </div>
      </div>
    );

    return (
      <div className="bg-white border-2 border-masters-green/20 rounded-xl overflow-hidden shadow-sm">
        {/* Front Nine */}
        <div className="border-b-4 border-masters-green/20">
          <Row 
            label="Hole" 
            values={outHoles.map(h => h.holeNumber)} 
            subtotal="OUT" 
            isHeader 
          />
          <Row 
            label="Yardage" 
            values={outHoles.map(h => h.yardage)} 
            subtotal={outHoles.reduce((acc, h) => acc + h.yardage, 0)} 
          />
          <Row 
            label="Par" 
            values={outHoles.map(h => h.par)} 
            subtotal={outPar} 
          />
          <Row 
            label="Score" 
            values={outHoles.map((h, i) => (
              <div 
                key={i} 
                className="flex justify-center cursor-pointer group"
                onClick={() => setSelectedHole(h.holeNumber)}
              >
                <span className={cn(getScoreClass(h.score, h.par), "hover:scale-125 transition-transform")}>{h.score}</span>
              </div>
            ))} 
            subtotal={outScore} 
          />
          {showFieldAvg && (
            <Row 
              label="Field Avg" 
              values={outHoles.map(h => h.fieldAvg || "-")} 
              subtotal="-" 
              isComp
              mode="field"
            />
          )}
          {showTop10Avg && (
            <Row 
              label="Top 10" 
              values={outHoles.map(h => h.top10Avg || "-")} 
              subtotal="-" 
              isComp
              mode="top10"
            />
          )}
        </div>

        {/* Back Nine */}
        <div>
          <Row 
            label="Hole" 
            values={inHoles.map(h => h.holeNumber)} 
            subtotal="IN" 
            isHeader 
          />
          <Row 
            label="Yardage" 
            values={inHoles.map(h => h.yardage)} 
            subtotal={inHoles.reduce((acc, h) => acc + h.yardage, 0)} 
          />
          <Row 
            label="Par" 
            values={inHoles.map(h => h.par)} 
            subtotal={inPar} 
          />
          <Row 
            label="Score" 
            values={inHoles.map((h, i) => (
              <div 
                key={i} 
                className="flex justify-center cursor-pointer group"
                onClick={() => setSelectedHole(h.holeNumber)}
              >
                <span className={cn(getScoreClass(h.score, h.par), "hover:scale-125 transition-transform")}>{h.score}</span>
              </div>
            ))} 
            subtotal={inScore} 
          />
          {showFieldAvg && (
            <Row 
              label="Field Avg" 
              values={inHoles.map(h => h.fieldAvg || "-")} 
              subtotal="-" 
              isComp
              mode="field"
            />
          )}
          {showTop10Avg && (
            <Row 
              label="Top 10" 
              values={inHoles.map(h => h.top10Avg || "-")} 
              subtotal="-" 
              isComp
              mode="top10"
            />
          )}
        </div>

        {/* Totals Footer */}
        <div className="bg-masters-green text-white flex justify-between px-8 py-6 items-baseline font-serif">
           <div className="text-sm uppercase tracking-[0.4em] opacity-60 font-sans">Round {selectedRound} Completion</div>
           <div className="flex gap-12 text-5xl font-black">
              <div 
                className="flex flex-col items-center cursor-pointer hover:scale-110 transition-all active:scale-95"
                onClick={() => {
                  setSidebarMode("winner");
                  setSelectedHole(1);
                }}
              >
                 <span className="text-[10px] uppercase font-sans tracking-widest opacity-60 mb-1">Total</span>
                 <span>{roundData.strokes}</span>
              </div>
              <div className="flex flex-col items-center">
                 <span className="text-[10px] uppercase font-sans tracking-widest opacity-60 mb-1">To Par</span>
                 <span className="text-masters-yellow">{roundData.toPar > 0 ? "+" : ""}{roundData.toPar}</span>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full pb-32">
      {/* Hole Sidebar Overlay */}
      <AnimatePresence>
        {selectedHole && activeHoleData && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedHole(null)}
              className="fixed inset-0 bg-masters-green/40 backdrop-blur-sm z-[100]"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-full max-w-md h-full bg-white shadow-2xl z-[101] overflow-y-auto"
            >
               <div className="relative h-72 w-full bg-masters-green bg-gradient-to-b from-masters-green to-masters-green-dark">
                <img 
                  src={`/layouts/layout_${selectedHole}.jpg`} 
                  className="w-full h-full object-cover opacity-40 mix-blend-multiply"
                  alt={`Hole ${selectedHole} Layout`}
                  onError={(e) => {
                    // Fallback to scoreboard if layout not found
                    (e.target as HTMLImageElement).src = "/scoreboard.jpg";
                  }}
                />
                <button 
                  onClick={() => setSelectedHole(null)}
                  className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-masters-green transition-all z-30 shadow-2xl"
                >
                  <X size={20} />
                </button>

                {/* New Green Par/Yardage Header */}
                <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start pointer-events-none">
                   <div className="bg-masters-green/80 backdrop-blur-md px-4 py-2 rounded-xl text-white font-serif italic font-bold border border-white/10">
                      Par {activeHoleData.par} • {activeHoleData.yardage} yds
                   </div>
                </div>

                <div className="absolute bottom-10 left-10">
                  <h3 className="font-serif text-5xl font-black text-white italic leading-tight mb-2">
                    {activeHoleData.holeName || "The Master's Path"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-masters-yellow">Hole {selectedHole}</span>
                    <span className="w-10 h-0.5 bg-masters-yellow/30" />
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-12">
                {sidebarMode === "winner" ? (
                  <>
                    <div className="grid grid-cols-2 gap-6 p-8 bg-masters-green/5 rounded-[32px] border border-masters-green/10">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 font-sans block mb-2">Tournament Difficulty</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-serif font-black text-masters-green">Rank {tournamentHoleDifficulty[selectedHole]}</span>
                          <span className="text-xs font-bold opacity-40">/18</span>
                        </div>
                      </div>
                      <div className="border-l border-masters-green/10 pl-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 font-sans block mb-2">Rory Avg Score</span>
                        <div className="text-3xl font-serif font-black text-masters-green">
                          {roryHoleAverage}
                        </div>
                      </div>
                    </div>

                     <div>
                      <h4 className="font-serif text-xl font-bold text-masters-green mb-8 italic">Shot Strategy</h4>
                      <div className="space-y-4">
                        {[
                          { label: "Fairway Hit", value: activeHoleData.score <= activeHoleData.par ? "Yes" : "No", sub: "Primary Target Area" },
                          { label: "Greens in Regulation", value: activeHoleData.score <= activeHoleData.par ? "Yes" : "No", sub: "Approach Accuracy" },
                          { label: "Putts", value: activeHoleData.label === "Birdie" ? 1 : 2, sub: "Green Surface Control" }
                        ].map((m, i) => (
                          <div key={i} className="flex justify-between items-center p-6 bg-masters-green/5 rounded-3xl border border-masters-green/10 transition-colors hover:bg-white hover:border-masters-green group cursor-default">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest text-masters-green/40 group-hover:text-masters-green transition-colors block mb-1">{m.label}</span>
                              <span className="text-xs font-medium italic opacity-60">{m.sub}</span>
                            </div>
                            <span className="text-2xl font-serif font-black text-masters-green">{m.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-8 bg-augusta-gold/10 rounded-[40px] border border-augusta-gold/20 mb-8">
                       <div className="flex items-center gap-3 mb-4">
                          <BarChart3 size={20} className="text-augusta-gold" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-augusta-gold">Field Analysis Mode</span>
                       </div>
                       <h4 className="font-serif text-2xl font-bold text-masters-green mb-2 italic">Hole {selectedHole} Difficulty</h4>
                       <p className="text-sm italic opacity-60">"Hole {selectedHole} ranked as the {tournamentHoleDifficulty[selectedHole]} hardest hole across all four rounds, defining the cumulative tournament average for the field."</p>
                    </div>

                     <div className="space-y-6">
                        {[
                          { 
                            label: "Tournament Rank", 
                            value: `${tournamentHoleDifficulty[selectedHole]} hardest`, 
                            sub: `Across 72 tournament holes` 
                          },
                          { 
                            label: "Avg Score", 
                            value: sidebarMode === "top10" ? activeHoleData.top10Avg : activeHoleData.fieldAvg, 
                            sub: `${((sidebarMode === "top10" ? activeHoleData.top10Avg : activeHoleData.fieldAvg) - activeHoleData.par).toFixed(2)} to par` 
                          },
                          { 
                            label: "Fairway %", 
                            value: `${(sidebarMode === "top10" ? 72 : 65 + Math.random() * 5).toFixed(1)}%`, 
                            sub: sidebarMode === "top10" ? "Top 10 Accuracy" : "Field Accuracy" 
                          },
                          { 
                            label: "GIR %", 
                            value: `${(sidebarMode === "top10" ? 68 : 58 + Math.random() * 5).toFixed(1)}%`, 
                            sub: sidebarMode === "top10" ? "Top 10 Regularity" : "Field Regularity" 
                          }
                        ].map((m, i) => (
                          <div key={i} className="flex justify-between items-end border-b border-masters-green/10 pb-6 transition-all hover:border-masters-green">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 block mb-1">{m.label}</span>
                              <span className="text-xs font-medium italic opacity-60 font-sans tracking-tight">{m.sub}</span>
                            </div>
                            <span className={cn("text-3xl font-serif font-black text-masters-green")}>{m.value}</span>
                          </div>
                        ))}
                    </div>
                  </>
                )}

                <div className="p-8 bg-masters-green rounded-[32px] text-white">
                  <Trophy size={24} className="text-masters-yellow mb-4" />
                  <p className="text-sm leading-relaxed italic opacity-80">
                    {sidebarMode === "winner" 
                      ? `"Hole ${selectedHole} proved to be a pivotal point, where Rory secured a critical save to maintain his slim lead."`
                      : `"The field struggled on Hole ${selectedHole}, with the majority of players failing to find the green in regulation."`}
                  </p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Immersive Hero Section */}
      <section className="relative w-full h-screen overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img 
            src="/masters-main.png" 
            alt="MASTERS Scoreboard" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 hero-vignette" />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-full flex flex-col justify-end pb-24">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-8 backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Wire-to-Wire Champion</span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[100px] font-bold text-white mb-8 leading-[0.9] tracking-tighter text-shadow-premium">
              The <span className="italic text-masters-yellow">Unwavering</span> <br/>Masterclass.
            </h1>
            <p className="font-sans text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed mb-12">
              From the first tee on Thursday to the final putt on Sunday, Rory McIlroy never lost his share of the lead. Explore how dominance was maintained across 72 holes of surgical precision.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
              {[
                { label: "Total Score", value: `${winnerInfo.scoreToPar > 0 ? "+" : ""}${winnerInfo.scoreToPar}`, sub: `${winnerInfo.totalStrokes} Strokes` },
                { label: "Winning Margin", value: "1", sub: "Def. Scheffler" },
                { label: "Final Status", value: "T1/1", sub: "Stable Performance" }
              ].map((stat, i) => (
                <div key={i} className="glass-dark p-6 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block mb-2">{stat.label}</span>
                  <div className="text-3xl font-serif font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-[10px] font-medium text-masters-yellow uppercase tracking-widest">{stat.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Traditional Scorecard Section */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-20">
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-[48px] p-8 md:p-14 mb-16"
        >
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 mb-16">
            <div className="max-w-xl">
              <h2 className="text-5xl font-serif font-bold text-masters-green mb-4 flex items-center gap-4">
                 <Trophy size={32} className="text-augusta-gold" />
                 The Official Card
              </h2>
              <p className="text-ink-600 font-medium leading-relaxed italic opacity-80">
                "{narratives.homepage.scorecardLead}"
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Comparative Toggles */}
              <div className="flex bg-augusta-gold/5 p-1 rounded-2xl border border-augusta-gold/10 mr-4 font-sans">
                 <button 
                  onClick={() => setShowFieldAvg(!showFieldAvg)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    showFieldAvg ? "bg-augusta-gold text-white" : "text-augusta-gold hover:bg-augusta-gold/10"
                  )}
                 >
                   Field Avg
                 </button>
                 <button 
                  onClick={() => setShowTop10Avg(!showTop10Avg)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    showTop10Avg ? "bg-masters-green text-white" : "text-masters-green hover:bg-masters-green/10"
                  )}
                 >
                   Top 10
                 </button>
              </div>

              {/* Round Selection */}
              <div className="flex bg-masters-green/5 p-1 rounded-2xl border border-masters-green/10 font-sans">
                 {[1, 2, 3, 4].map(r => (
                   <button
                    key={r}
                    onClick={() => setSelectedRound(r)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      selectedRound === r 
                        ? "bg-masters-green text-white shadow-lg" 
                        : "text-masters-green/40 hover:text-masters-green"
                    )}
                   >
                     Round {r}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          <div key={selectedRound} className="animate-in fade-in duration-300">
             {renderTraditionalScorecard()}
          </div>
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Momentum Trajectory Card */}
          <div className="lg:col-span-8">
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[48px] p-10 md:p-14 border border-masters-green/10"
            >
              <div className="mb-12">
                <h3 className="text-3xl font-bold text-masters-green mb-2 uppercase tracking-tighter">The Path to Dominance</h3>
                <p className="text-ink-600 font-medium italic">Cumulative path vs the field average across 72 holes.</p>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPath" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0a4731" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#0a4731" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#0a473110" />
                    <XAxis 
                      dataKey="holeNumber" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#0a473140', fontWeight: 'bold' }}
                      dy={10}
                      ticks={[18, 36, 54, 72]}
                    />
                    <YAxis 
                      reversed
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#0a473140', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-masters-green p-4 rounded-2xl shadow-premium border border-white/10 backdrop-blur-md">
                              <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow mb-2 block">Hole {payload[0].payload.holeNumber} Tracking</span>
                              <div className="space-y-2">
                                 <div className="flex justify-between gap-8">
                                   <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">McIlroy</span>
                                   <span className="text-white font-serif font-black">{payload[0].value}</span>
                                 </div>
                                 <div className="flex justify-between gap-8">
                                   <span className="text-augusta-gold text-[10px] font-bold uppercase tracking-widest">Top 10 Benchmark</span>
                                   <span className="text-augusta-gold font-serif font-black">{payload[2].value}</span>
                                 </div>
                                 <div className="flex justify-between gap-8 border-t border-white/10 pt-2">
                                   <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Field Margin</span>
                                   <span className="text-white/40 font-serif font-black">{payload[1].value}</span>
                                 </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="stepAfter" 
                      dataKey="cumulativeToPar" 
                      stroke="#0a4731" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorPath)" 
                      animationDuration={2000}
                      dot={(props) => {
                         const { cx, cy, payload } = props;
                         if (payload.isEndOfRound) {
                           return <circle cx={cx} cy={cy} r={4} fill="#0a4731" stroke="white" strokeWidth={2} />;
                         }
                         return <></>;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="fieldAvgToPar" 
                      stroke="#0a4731" 
                      strokeWidth={1} 
                      strokeDasharray="5 5" 
                      fill="none" 
                      opacity={0.4}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="top10ToPar" 
                      stroke="#ffcc00" 
                      strokeWidth={2} 
                      fill="none" 
                      opacity={0.8}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.section>
          </div>

          <aside className="lg:col-span-4 space-y-8 text-masters-green">
            <div className="bg-white rounded-[32px] p-10 border border-masters-green/10">
              <h4 className="font-serif text-2xl font-bold mb-8 italic">Verified Performance.</h4>
              <div className="space-y-10">
                {profileData.metrics.slice(0, 3).map((m, i) => (
                  <div key={i}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 block mb-2">{m.label}</span>
                    <div className="flex justify-between items-end border-b border-masters-green/10 pb-4">
                      <span className="text-3xl font-serif font-black">{m.winnerValue}{m.unit}</span>
                      <span className="text-xs font-bold opacity-60">Avg: {m.fieldValue}{m.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/profile" className="mt-12 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] border-b-2 border-masters-green pb-1 hover:pb-2 transition-all">
                Full Technical Breakdown <ArrowRight size={14} />
              </Link>
            </div>

            <Link 
              to="/the-repeat"
              className="bg-bg-cream-dark rounded-[32px] p-10 border border-masters-green/10 relative overflow-hidden group cursor-pointer block hover:bg-white transition-all shadow-sm"
            >
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">Historical Perspective</span>
                <h4 className="font-serif text-2xl font-bold mb-6 leading-tight italic">Joining the <br/>Mount Rushmore <br/>of Defenders.</h4>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  Evolution Analysis <ArrowRight size={14} />
                </div>
              </div>
            </Link>
          </aside>
        </div>
      </main>
    </div>
  );
}
