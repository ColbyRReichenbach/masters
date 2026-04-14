import { useMemo } from "react";
import { motion } from "motion/react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import { Star, ArrowRight, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { getRepeatContext, getRoryRepeatComparison, getNarrativeAnnotations, getWinner } from "../lib/data";
import { cn } from "../lib/utils";

export default function TheRepeat() {
  const repeatContext = getRepeatContext();
  const comparison = getRoryRepeatComparison();
  const narratives = getNarrativeAnnotations();
  const winnerData = getWinner();

  const historicalBenchmarks = useMemo(() => {
    return comparison.historicalBenchmarks || [];
  }, [comparison]);

  return (
    <div className="w-full pb-32">
      {/* Immersive Hero Section */}
      <section className="relative w-full h-screen overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img 
            src="/rory-jacket.png" 
            alt="Rory McIlroy in the Green Jacket" 
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
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Historical Context</span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[100px] font-bold text-white mb-8 leading-[0.9] tracking-tighter text-shadow-premium">
              The <span className="italic text-masters-yellow">Repeat.</span> <br/>Defying Odds.
            </h1>
            <p className="font-sans text-xl md:text-2xl text-white/90 max-w-3xl leading-relaxed mb-12">
              Only three men in history had ever defended their Masters title. In 2026, Rory McIlroy erased the 24-year drought and etched his name onto the tournament's Mount Rushmore.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mount Rushmore Component */}
      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-20">
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-[48px] p-10 md:p-14 mb-16"
        >
          <div className="mb-16">
            <h2 className="text-4xl font-serif font-bold text-masters-green mb-4">Historical Benchmarks</h2>
            <div className="h-1 w-20 bg-masters-green/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {historicalBenchmarks.map((hero, i) => {
              const isRory = hero.player.includes("McIlroy");
              return (
                <motion.div 
                  key={hero.player}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-10 rounded-[40px] border-2 transition-all duration-500 flex flex-col justify-between min-h-[420px]",
                    isRory ? "bg-masters-green text-white border-masters-green shadow-2xl scale-105 z-10" : "bg-white text-masters-green border-masters-green/5 shadow-sm"
                  )}
                >
                  <div>
                    <div className="flex justify-between items-start mb-8 text-white/40">
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {isRory ? "2025-26" : hero.years}
                      </span>
                      {isRory && <Star size={16} className="text-masters-yellow fill-masters-yellow" />}
                    </div>
                    <h3 className={cn("font-serif text-3xl font-bold mb-2 leading-tight", isRory ? "text-white" : "text-masters-green")}>
                      {isRory ? "Rory McIlroy" : hero.player}
                    </h3>
                    <div className={cn("h-1 w-12 mb-8", isRory ? "bg-masters-yellow" : "bg-masters-green/20")} />
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-10", isRory ? "text-masters-yellow" : "opacity-40")}>
                      {isRory ? "Title Defense Champion" : "Historical Defender"}
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-baseline border-b border-masters-green/10 pb-4">
                      <span className="text-[10px] uppercase font-sans font-bold opacity-60 tracking-widest">
                        Winning Scores
                      </span>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                           <span className={cn("text-[8px] font-black uppercase", isRory ? "text-white/40" : "opacity-40")}>
                             {hero.years?.split('-')[0] || "Year 1"}:
                           </span>
                           <span className={cn("font-serif font-black text-2xl block", isRory ? "text-white" : "text-masters-green")}>{hero.score1}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                           <span className={cn("text-[8px] font-black uppercase", isRory ? "text-masters-yellow/60" : "opacity-40")}>
                             {isRory ? "2026" : (hero.years?.split('-')[1] || "Year 2")}:
                           </span>
                           <span className={cn("font-serif font-black text-2xl block", isRory ? "text-masters-yellow" : "opacity-40")}>{hero.score2}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                       <p className="text-[10px] leading-relaxed opacity-70 font-medium italic">
                         "{hero.significance}"
                       </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pb-24">
          <div className="lg:col-span-8">
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-[48px] p-10 md:p-14 border border-masters-green/10"
            >
              <div className="mb-12">
                <h3 className="text-3xl font-bold text-masters-green mb-2 uppercase tracking-tighter">The Defense Architecture</h3>
                <p className="text-ink-600 font-medium italic">Comparison of the 2025 breakthrough vs the 2026 title defense.</p>
              </div>

              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={comparison.cumulativeHistory}>
                    <defs>
                      <linearGradient id="color2026" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#004621" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#004621" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#004621" strokeOpacity={0.05} />
                    <XAxis 
                      dataKey="hole" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#004621', fontSize: 10, fontWeight: 700, opacity: 0.4}}
                      ticks={[18, 36, 54, 72]}
                    />
                    <YAxis 
                      reversed 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#004621', fontSize: 10, fontWeight: 700, opacity: 0.4}}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const s25 = payload.find(p => p.dataKey === "score2025")?.value;
                          const s26 = payload.find(p => p.dataKey === "score2026")?.value;

                          return (
                            <div className="bg-masters-green text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Hole {label} Path</p>
                              <div className="space-y-1">
                                <div className="flex justify-between gap-8 items-center">
                                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">2025 Cumulative</span>
                                  <span className="font-serif font-black text-lg text-white">{s25 !== undefined ? s25 : "-"}</span>
                                </div>
                                <div className="flex justify-between gap-8 items-center pt-1 border-t border-white/10">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-masters-yellow/60">2026 Cumulative</span>
                                  <span className="font-serif font-black text-lg text-masters-yellow">{s26 !== undefined ? s26 : "-"}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                     <Area 
                      type="monotone" 
                      dataKey="score2025" 
                      stroke="#004621" 
                      fill="transparent" 
                      strokeDasharray="5 5"
                      strokeWidth={1}
                      name="2025 Path"
                      dot={(props) => {
                         const { cx, cy, payload } = props;
                         if (payload.hole % 18 === 0) {
                           return <circle cx={cx} cy={cy} r={3} fill="#004621" opacity={0.3} />;
                         }
                         return <></>;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="score2026" 
                      stroke="#004621" 
                      strokeWidth={4} 
                      fill="url(#color2026)" 
                      name="2026 Path"
                      dot={(props) => {
                         const { cx, cy, payload } = props;
                         if (payload.hole % 18 === 0) {
                           return <circle cx={cx} cy={cy} r={4} fill="#004621" stroke="white" strokeWidth={2} />;
                         }
                         return <></>;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-12 p-8 bg-masters-green/5 rounded-3xl border border-masters-green/10">
                <div className="flex gap-6">
                  <div>
                    <h4 className="font-serif text-xl font-bold mb-2">Evolution Summary</h4>
                    <p className="text-sm text-ink-800 leading-relaxed italic">
                      "{comparison.takeaways.how2026HeldUpUnderPressure}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          <aside className="lg:col-span-4 space-y-8">
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="bg-masters-green rounded-[32px] p-12 text-white shadow-2xl relative overflow-hidden group"
            >
               <div className="relative z-10">
                 <h3 className="font-serif text-3xl font-bold mb-8 italic text-masters-yellow">The Immortal Rank.</h3>
                 <p className="text-sm opacity-70 leading-relaxed mb-10">
                    By successfully defending his title, Rory McIlroy joined Jack Nicklaus (1966), Nick Faldo (1990), and Tiger Woods (2002) as the fourth member of the most exclusive club in golf.
                 </p>
                 <div className="h-px w-full bg-white/10 mb-10" />
                 <Link to="/" className="text-[10px] font-black uppercase tracking-[0.4em] text-masters-yellow border-b-2 border-masters-yellow/20 pb-1">
                    Tournament Review <ArrowRight size={14} />
                 </Link>
               </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-masters-green/10 p-10 rounded-[48px] shadow-sm"
            >
               <p className="font-serif text-xl text-masters-green italic font-bold mb-8">
                 "{repeatContext.rarityText}"
               </p>
               <div className="w-12 h-1 bg-masters-green/20 rounded-full" />
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
