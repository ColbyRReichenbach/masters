import { useMemo } from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Tooltip
} from "recharts";
import { Target, Zap, ShieldCheck, TrendingUp, Trophy, ArrowRight, MousePointer2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getWinnerProfile, getWinner } from "../lib/data";
import { cn } from "../lib/utils";

export default function Profile() {
  const profileData = getWinnerProfile();
  const winnerData = getWinner();

  const technicalStats = useMemo(() => {
    const getScaleMetadata = (name: string) => {
      const n = name.toLowerCase();
      if (n.includes("distance")) return { max: 360, min: 250, inverted: false };
      if (n.includes("regulation")) return { max: 100, min: 0, inverted: false };
      if (n.includes("putts")) return { max: 2.1, min: 1.4, inverted: true }; // Lower is better
      if (n.includes("scrambling")) return { max: 80, min: 1, inverted: true }; // Rank: 1 is top
      return { max: 100, min: 0, inverted: false };
    };

    return profileData.metrics.map(m => {
      const meta = getScaleMetadata(m.label);
      let percentage = meta.inverted 
        ? ((meta.max - m.winnerValue) / (meta.max - meta.min)) * 100
        : ((m.winnerValue - meta.min) / (meta.max - meta.min)) * 100;
        
      return {
        name: m.label,
        winner: m.winnerValue,
        field: m.fieldValue,
        top10: m.top10Value,
        unit: m.unit,
        delta: m.deltaVsField,
        direction: m.directionality,
        barWidth: Math.max(5, Math.min(100, percentage)),
        meta
      };
    });
  }, [profileData]);

  const verdicts = [
    { title: "Power Blueprint", text: profileData.verdicts.primarySeparator },
    { title: "Defensive Mastery", text: profileData.verdicts.secondarySupport },
    { title: "The X-Factor", text: profileData.verdicts.weaknessOvercome }
  ];

  return (
    <div className="w-full pb-32">
      {/* Premium Hero Section */}
      <section className="relative w-full h-[80vh] overflow-hidden bg-masters-green">
        <div className="absolute inset-0">
          <img 
            src="/rory-scoreboard.png" 
            alt="Rory McIlroy at the Scoreboard" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 hero-vignette" />
        </div>
        
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 h-full flex flex-col justify-end pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
             <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/20 rounded-full mb-6 backdrop-blur-md">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white">Technical Analysis</span>
            </div>
            <h1 className="font-serif text-6xl md:text-8xl font-bold text-white mb-6 leading-tight tracking-tighter text-shadow-premium">
              The <span className="italic text-masters-yellow">Blueprint</span> <br/>for Augusta.
            </h1>
            <p className="font-sans text-xl text-white/90 max-w-2xl leading-relaxed">
              Analyzing the surgical precision and raw power that defined Rory McIlroy's 2026 title defense. Every metric verified against final round ground-truth data.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Technical Magnitude Component */}
          <div className="lg:col-span-8 space-y-12">
            <motion.section 
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass rounded-[48px] p-10 md:p-14 mb-8"
            >
              <div className="mb-16">
                <h2 className="text-4xl font-serif font-bold text-masters-green mb-4">Technical Magnitude</h2>
                <div className="h-1 w-20 bg-masters-green/20 mb-4" />
                <p className="text-ink-600 font-medium italic">Relative performance benchmarks vs the cumulative field average.</p>
              </div>

              <div className="space-y-16">
                {technicalStats.map((stat, i) => (
                  <motion.div 
                    key={stat.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-ink-600/40 mb-2 block">{stat.name}</span>
                        <div className="flex items-baseline gap-3">
                           <span className="text-5xl font-serif font-bold text-masters-green">{stat.winner}</span>
                           <span className="text-xs font-black text-ink-600 uppercase tracking-widest">{stat.unit}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {!stat.name.toLowerCase().includes("scrambling") && (
                          <>
                            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-600/40 mb-2">
                               {stat.unit === "Yds" ? "Distance vs Field" : "Delta vs Field"}
                            </div>
                            <div className="text-xl font-serif font-bold text-masters-green">
                              {stat.delta > 0 ? "+" : ""}{stat.delta}{stat.unit}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Visual Bar with markers */}
                     <div className="relative h-4 w-full bg-masters-green/5 rounded-full overflow-hidden p-1 border border-masters-green/10">
                        <motion.div 
                         initial={{ width: 0 }}
                         whileInView={{ width: `${stat.barWidth}%` }}
                         transition={{ duration: 1, delay: i * 0.1 }}
                         className="h-full bg-masters-green rounded-full shadow-lg" 
                        />
                        {/* Top 10 Average Marker (Benchmark) - Darkened and conditioned */}
                        {!stat.name.toLowerCase().includes("scrambling") && (
                          <div 
                            className="absolute top-0 bottom-0 w-1.5 bg-masters-green/40 z-[9] shadow-sm" 
                            style={{ 
                              left: stat.meta.inverted 
                                ? `${((stat.meta.max - stat.top10) / (stat.meta.max - stat.meta.min)) * 100}%` 
                                : `${((stat.top10 - stat.meta.min) / (stat.meta.max - stat.meta.min)) * 100}%` 
                            }}
                          />
                        )}
                        {/* Field Average Marker - Conditional for ranks */}
                        {!stat.name.toLowerCase().includes("rank") && !stat.name.toLowerCase().includes("pos") && (
                          <div 
                           className="absolute top-0 bottom-0 w-1.5 bg-masters-yellow z-10 shadow-[0_0_10px_rgba(255,204,0,0.5)]" 
                           style={{ 
                              left: stat.meta.inverted 
                                ? `${((stat.meta.max - stat.field) / (stat.meta.max - stat.meta.min)) * 100}%` 
                                : `${((stat.field - stat.meta.min) / (stat.meta.max - stat.meta.min)) * 100}%` 
                           }}
                          />
                        )}
                     </div>
                     <div className="flex justify-between mt-3 px-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink-400">Winner Range</span>
                        <div className="text-right space-y-1">
                          {!stat.name.toLowerCase().includes("rank") && !stat.name.toLowerCase().includes("pos") && (
                            <>
                              <div className="text-[9px] font-black uppercase tracking-widest text-augusta-gold/80 flex items-center justify-end gap-2 px-2 border-r-2 border-augusta-gold/20">
                                <span>Field Average</span>
                                <span className="text-masters-green">({stat.field}{stat.unit})</span>
                              </div>
                              <div className="text-[8px] font-black uppercase tracking-widest text-ink-400/60 flex items-center justify-end gap-2">
                                <span>Top 10 Average</span>
                                <span className="text-masters-green/80">{stat.top10}{stat.unit}</span>
                              </div>
                            </>
                          )}
                        </div>
                     </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-16 flex gap-6 border-t border-line-subtle pt-10">
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-masters-green" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-600">McIlroy</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-masters-yellow" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-600">Field Average</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-masters-green/30" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Top 10 Average</span>
                 </div>
              </div>
            </motion.section>
          </div>

          {/* Expert Verdicts Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <h3 className="font-serif text-2xl font-bold text-white px-2">The Winning Verdict</h3>
            <div className="space-y-6">
              {verdicts.map((v, i) => (
                <motion.div 
                  key={v.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="bg-white rounded-[32px] p-8 shadow-premium border border-line-subtle group hover:border-masters-green transition-colors"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-masters-green/5 flex items-center justify-center text-masters-green group-hover:bg-masters-green group-hover:text-white transition-colors">
                       {v.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink-400">{v.title}</span>
                  </div>
                  <p className="font-medium text-green-950 leading-relaxed italic">
                    "{v.text}"
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-masters-yellow rounded-[32px] p-10 text-masters-green shadow-premium relative overflow-hidden group cursor-pointer"
            >
               <Trophy className="absolute -bottom-6 -right-6 text-masters-green/5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-700" size={180} />
               <div className="relative z-10">
                 <h4 className="font-serif text-3xl font-bold mb-4">Confirmed <br/>Dominance.</h4>
                 <p className="text-[10px] font-black uppercase tracking-widest mb-6 border-b border-masters-green/10 pb-4">Tournament ID: 2026-AUG-PRO-1</p>
                 <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                    Return to Scorecard <ArrowRight size={14} />
                 </Link>
               </div>
            </motion.div>
          </aside>
        </div>
      </main>
    </div>
  );
}
