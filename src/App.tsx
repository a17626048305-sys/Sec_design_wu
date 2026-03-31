/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, RefreshCw } from 'lucide-react';

// --- Helper Components ---

const ScaleContainer = ({ children }: { children: React.ReactNode }) => {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    handleResize(); window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
      <div style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'center center', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {children}
      </div>
    </div>
  );
};

const AlertBadge = ({ level }: { level: string }) => {
  const styles: Record<string, string> = { 
    '紧急': 'border-[#FF3333] text-[#FF3333] bg-[#FF3333]/15', 
    '高危': 'border-[#FF6B00] text-[#FF6B00] bg-[#FF6B00]/15', 
    '中危': 'border-[#FADB14] text-[#FADB14] bg-[#FADB14]/15', 
    '低危': 'border-[#00FFD1] text-[#00FFD1] bg-[#00FFD1]/15' 
  };
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-[1px] text-[12px] font-bold border ${styles[level]}`} style={{ clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}>
      <span className="tracking-widest drop-shadow-[0_0_5px_currentColor]">{level}</span>
    </div>
  );
};

const PanelCard = ({ title, titleRight, children, className = '', style = {} }: any) => (
  <div className={`cyber-card flex-1 min-h-0 ${className}`} style={style}>
    <div className="card-corner corner-tl"></div><div className="card-corner corner-tr"></div>
    <div className="card-corner corner-bl"></div><div className="card-corner corner-br"></div>
    {title && (
      <div className="card-title-bar">
        <div className="card-title">{title}</div>
        {titleRight && <div>{titleRight}</div>}
      </div>
    )}
    <div className="p-4 flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">{children}</div>
  </div>
);

const CyberTable = ({ headers, data, scrollable = true, widths, headerColor = 'text-[#A5D8FF]' }: any) => {
  const displayData = scrollable ? [...data, ...data] : data;
  const colgroup = widths ? <colgroup>{widths.map((w: any, i: number) => <col key={i} style={{ width: w }} />)}</colgroup> : null;
  return (
    <div className="flex flex-col w-full h-full min-h-0">
      {headers && headers.length > 0 && (
        <div className="bg-gradient-to-r from-[#0B1D44] to-[#07122B] border-b border-[#00F3FF]/40 z-10 pr-[4px]">
          <table className="strict-table text-[13px] text-left">{colgroup}<thead><tr>{headers.map((h: any, i: number) => <th key={i} className={`py-1.5 px-3 font-bold ${headerColor}`}>{h}</th>)}</tr></thead></table>
        </div>
      )}
      <div className="flex-1 overflow-hidden relative scroll-container bg-[#030816]/30">
        <div className={scrollable ? "animate-scroll absolute w-full" : "w-full overflow-y-auto h-full"}>
          <table className="strict-table text-[13px] text-left">{colgroup}<tbody>{displayData.map((row: any, i: number) => <tr key={i} className="border-b border-[#00F3FF]/10 hover:bg-[#00F3FF]/10 transition-colors">{row.map((cell: any, j: number) => <td key={j} className="py-1.5 px-3 text-[#FFFFFF]" title={cell}>{cell}</td>)}</tr>)}</tbody></table>
        </div>
      </div>
    </div>
  );
};

const EChartsWrapper = ({ option, style }: any) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).echarts) { setIsLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    script.onload = () => {
      fetch('https://cdn.jsdelivr.net/gh/apache/echarts@4.9.0/map/json/china.json').then(res => res.json()).then(geoJson => {
          (window as any).echarts.registerMap('china', geoJson); setIsLoaded(true);
      });
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (isLoaded && chartRef.current && (window as any).echarts) {
      const chart = (window as any).echarts.getInstanceByDom(chartRef.current) || (window as any).echarts.init(chartRef.current);
      chart.setOption(option);
      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [isLoaded, option]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', ...style }}>
      {!isLoaded && <div className="absolute inset-0 flex items-center justify-center text-[#00F3FF] text-[12px] animate-pulse">可视化引擎加载中...</div>}
      <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

// --- Main Dashboard Component ---

export default function App() {
  const [currentTime, setCurrentTime] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const assetMessages = "2026-03-16 14:41:33 华东分公司新增注册资产信息...        2026-03-16 14:45:00 集团总部资产异常离线...        ";

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(`${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pieOption = useMemo(() => ({
    tooltip: { trigger: 'item', backgroundColor: 'rgba(7,18,43,0.9)', borderColor: '#00F3FF', textStyle: { color: '#fff' } },
    legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { color: '#A5D8FF', fontSize: 12 } },
    series: [{ type: 'pie', radius: ['50%', '75%'], center: ['35%', '50%'], label: { show: false }, data: [{ value: 454, name: '已注册正常', itemStyle: { color: '#00F3FF' } }, { value: 360, name: '未注册资产', itemStyle: { color: '#A5D8FF' } }, { value: 110, name: '已注册异常', itemStyle: { color: '#FF3333' } }] }]
  }), []);

  const barOption = useMemo(() => ({
    grid: { top: 30, right: 15, bottom: 25, left: 35 },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(7,18,43,0.9)', borderColor: '#00F3FF', textStyle: { color: '#fff' } },
    xAxis: { type: 'category', data: ['已完成', '超期', '临期', '流转中'], axisLabel: { color: '#A5D8FF', fontSize: 12 }, axisLine: { lineStyle: { color: 'rgba(0,243,255,0.3)' } }, axisTick: { show: false } },
    yAxis: { type: 'value', axisLabel: { color: '#A5D8FF', fontSize: 12 }, splitLine: { lineStyle: { color: 'rgba(0,243,255,0.1)', type: 'dashed' } } },
    series: [{ type: 'bar', barWidth: '35%', itemStyle: { borderRadius: [2, 2, 0, 0] }, data: [{ value: 45, itemStyle: { color: '#00F3FF' } }, { value: 20, itemStyle: { color: '#FF3333' } }, { value: 28, itemStyle: { color: '#FFB000' } }, { value: 35, itemStyle: { color: '#00F3FF' } }] }]
  }), []);

  const mapOption = useMemo(() => ({
    tooltip: {
      trigger: 'item', backgroundColor: 'rgba(7,18,43,0.95)', borderColor: '#00F3FF', borderWidth: 1, padding: 12, textStyle: { color: '#fff' },
      formatter: (p: any) => {
        if (!p.value) return ''; const v = p.value;
        return `<div style="min-width: 160px"><div style="font-size:14px; font-weight:bold; margin-bottom:8px; border-bottom:1px solid rgba(0,243,255,0.3); padding-bottom:4px; color:#00F3FF;">${p.name}</div>
          <div style="margin-bottom:6px;">告警总数: <span style="font-family:monospace; font-size:14px; font-weight:bold; color:${p.color}">${v[2]}</span></div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
            <div><span style="color:#FF3333">●</span> 紧急: <span style="font-family:monospace">${v[3]}</span></div><div><span style="color:#FF6B00">●</span> 高危: <span style="font-family:monospace">${v[4]}</span></div>
            <div><span style="color:#FADB14">●</span> 中危: <span style="font-family:monospace">${v[5]}</span></div><div><span style="color:#00FFD1">●</span> 低危: <span style="font-family:monospace">${v[6]}</span></div>
          </div></div>`;
      }
    },
    geo: { map: 'china', roam: true, zoom: 1.1, center: [104.114129, 35.550339], itemStyle: { areaColor: 'rgba(0, 243, 255, 0.04)', borderColor: 'rgba(0, 243, 255, 0.5)', shadowColor: 'rgba(0, 243, 255, 0.2)', shadowBlur: 10 }, emphasis: { itemStyle: { areaColor: 'rgba(0, 243, 255, 0.25)', borderColor: '#00F3FF', borderWidth: 2 } } },
    series: [{ type: 'effectScatter', coordinateSystem: 'geo', symbolSize: (v: any) => v[2] > 100 ? 15 : (v[2] > 50 ? 12 : 8), showEffectOn: 'render', rippleEffect: { brushType: 'stroke', scale: 4, period: 3 }, itemStyle: { color: (p: any) => p.value[2] > 100 ? '#FF3333' : (p.value[2] >= 50 ? '#FFB000' : '#00FFD1'), shadowBlur: 10, shadowColor: '#333' },
      data: [{ name: '武汉中核', value: [114.31, 30.52, 524, 200, 100, 200, 24] }, { name: '北京总部', value: [116.40, 39.90, 85, 20, 30, 20, 15] }, { name: '上海中心', value: [121.47, 31.23, 120, 50, 40, 20, 10] }, { name: '广州分部', value: [113.26, 23.12, 30, 0, 5, 10, 15] }, { name: '成都研发', value: [104.06, 30.67, 45, 5, 10, 20, 10] }, { name: '西安基地', value: [108.94, 34.26, 60, 10, 15, 20, 15] }] }]
  }), []);

  return (
    <ScaleContainer>
      <header className="h-[70px] w-full flex justify-between items-center px-8 relative bg-[#07122B]/50 z-20">
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#00F3FF] to-transparent shadow-[0_0_15px_#00F3FF]"></div>
        <div className="w-[350px] text-[#00F3FF] text-[16px] font-bold tracking-wider font-mono">{currentTime}</div>
        <div className="flex-1 flex justify-center items-center"><h1 className="header-title-text">武汉中核网络安全态势感知中心</h1></div>
        <div className="w-[350px] text-right text-[#A5D8FF] text-[13px] font-bold flex items-center justify-end gap-2">
          <RefreshCw size={16} className="text-[#00F3FF] animate-spin-slow" />
          <span>自动刷新: 3分钟</span>
        </div>
      </header>

      <main className="flex-1 w-full flex gap-4 p-4 overflow-hidden z-10 min-h-0">
        {/* Left Column */}
        <aside className="w-[420px] flex flex-col gap-4 min-h-0">
          <PanelCard title="资产注册概况" style={{ height: '240px', flexShrink: 0 }}>
             <div className="w-full h-full relative">
               <EChartsWrapper option={pieOption} />
               <div className="absolute left-[35%] top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none drop-shadow-[0_0_5px_#00F3FF]">
                  <span className="text-[20px] font-bold text-[#00F3FF] font-mono leading-none">924</span><span className="text-[10px] text-[#A5D8FF] mt-1">总资产</span>
               </div>
             </div>
          </PanelCard>
          <PanelCard title="单位资产统计" style={{flex: 1}}>
            <div className="bg-[#00F3FF]/10 border border-[#00F3FF]/30 h-[36px] flex items-center px-3 mb-3 overflow-hidden text-[13px] text-[#00F3FF] shrink-0">
              <div className="flex-1 overflow-hidden whitespace-nowrap flex"><div className="animate-marquee font-mono"><span className="pr-12">{assetMessages}</span><span className="pr-12">{assetMessages}</span></div></div>
            </div>
            <div className="flex-1 min-h-0 border border-[#00F3FF]/20">
              <CyberTable headers={['单位名称', '已注册', '未注册', '异常']} widths={['40%', '20%', '20%', '20%']} data={[['集团总部', '100', '10', '10'], ['华东分公司', '200', '20', '20'], ['华南研发中心', '300', '30', '30'], ['华中研发中心', '200', '20', '20'],['华北研发中心', '150', '15', '15']]} />
            </div>
          </PanelCard>
          <PanelCard title="资产威胁情报" style={{flex: 1}}>
            <div className="flex flex-col gap-2 shrink-0 overflow-y-auto pr-1 h-full no-scrollbar">
               {[{ ip: '192.168.21.64', unit: '集团总部', level: '高危', desc: 'JeePlus Druid Monitor 路径未授权访问', color: '#FF6B00' }, { ip: '192.168.21.64', unit: '集团总部', level: '中危', desc: 'SpringBoot Actuator 敏感信息泄露', color: '#FADB14' }, { ip: '192.168.21.65', unit: '华东分公司', level: '低危', desc: 'Redis 弱口令漏洞扫描探测报备', color: '#00FFD1' }, { ip: '192.168.21.88', unit: '华中研发中心', level: '高危', desc: 'Apache Log4j2 远程代码执行漏洞', color: '#FF6B00' }].map((item, idx) => (
                 <div key={idx} className="bg-[#0B1D44]/40 border border-[#00F3FF]/20 p-2 rounded relative"><div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{backgroundColor: item.color}}></div><div className="flex justify-between items-center mb-0.5 pl-2"><span className="text-[#00F3FF] font-bold font-mono text-[13px]">{item.ip} <span className="text-[#A5D8FF] text-[12px] font-normal ml-2 font-sans">{item.unit}</span></span><AlertBadge level={item.level} /></div><div className="text-[12px] text-gray-300 pl-2 truncate">{item.desc}</div></div>
               ))}
            </div>
          </PanelCard>
        </aside>

        {/* Middle Column */}
        <section className="flex-1 flex flex-col gap-4 min-h-0">
           <PanelCard title="网络安全威胁告警实时监控" className="flex-1 min-h-0 flex flex-col">
              
              {/* Time Selection Bar */}
              <div className="flex items-center gap-4 mb-4 shrink-0 px-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[#A5D8FF] text-[13px]">首次告警时间:</span>
                    <div className="relative flex items-center">
                       <input 
                         type="text" 
                         className="bg-[#030816]/80 border border-[#00F3FF]/40 text-white px-3 py-1 text-[13px] outline-none w-[140px] rounded-sm font-mono" 
                         defaultValue="2026/02/22" 
                       />
                       <Calendar size={14} className="absolute right-2 text-[#00F3FF]" />
                    </div>
                    <span className="text-[#00F3FF] font-bold">-</span>
                    <div className="relative flex items-center">
                       <input 
                         type="text" 
                         className="bg-[#030816]/80 border border-[#00F3FF]/40 text-white px-3 py-1 text-[13px] outline-none w-[140px] rounded-sm font-mono" 
                         defaultValue="2026/02/28" 
                       />
                       <Calendar size={14} className="absolute right-2 text-[#00F3FF]" />
                    </div>
                 </div>
              </div>

              {/* AI Flow Animation Area */}
              <div className="h-[260px] mb-4 relative flex items-center justify-between px-4 bg-[#07122B]/30 shrink-0 border border-[#00F3FF]/10 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
                  
                  {/* Node 1: Sources */}
                  <div className="flex flex-col justify-between h-[220px] w-[160px] relative z-10 shrink-0">
                     {[
                       { name: '奇安信态势感知', count: 433 }, 
                       { name: '深信服 AISOC', count: 243 }, 
                       { name: '山石网科 NGFW', count: 223 }, 
                       { name: '安恒态势感知平台', count: 135 }, 
                       { name: '中新赛克 AISOC', count: 331 }
                     ].map((src, idx) => (
                       <motion.div 
                         key={idx} 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: idx * 0.1 }}
                         className="h-[36px] flex justify-between items-center bg-[#07152B] border border-[#2A486F] px-3 rounded shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:border-[#00F3FF]/50 transition-colors"
                       >
                          <span className="text-[#A5D8FF] text-[12px]">{src.name}</span>
                          <span className="text-[#00F3FF] text-[14px] font-mono font-bold">{src.count}</span>
                       </motion.div>
                     ))}
                  </div>

                  {/* Flow 1: Sources to Summary */}
                  <div className="w-[60px] relative h-[220px]">
                      <svg width="100%" height="100%" viewBox="0 0 60 220" preserveAspectRatio="none" className="overflow-visible">
                         <path d="M0,18 C40,18 40,110 60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,64 C40,64 40,110 60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,110 L60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,156 C40,156 40,110 60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,202 C40,202 40,110 60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         
                         <path d="M0,18 C40,18 40,110 60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay: '0s'}} />
                         <path d="M0,64 C40,64 40,110 60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay: '0.6s'}} />
                         <path d="M0,110 L60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay: '1.2s'}} />
                         <path d="M0,156 C40,156 40,110 60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay: '0.3s'}} />
                         <path d="M0,202 C40,202 40,110 60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay: '0.9s'}} />
                      </svg>
                  </div>

                  {/* Node 2: Summary */}
                  <div className="w-[100px] h-[80px] relative z-10 shrink-0 bg-[#07152B] border border-[#00F3FF]/30 rounded-md flex flex-col items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.1)]">
                     <div className="text-[#A5D8FF] text-[12px] mb-1">告警汇总</div>
                     <div className="text-[22px] text-white font-mono font-bold leading-none tracking-wider">1,300</div>
                  </div>

                  {/* Flow 2: Summary to AI */}
                  <div className="w-[40px] relative h-[220px]">
                      <svg width="100%" height="100%" viewBox="0 0 40 220" preserveAspectRatio="none">
                        <path d="M0,110 L40,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                        <path d="M0,110 L40,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" />
                      </svg>
                  </div>

                  {/* Node 3: AI Center */}
                  <div className="w-[220px] h-[220px] relative z-10 shrink-0 flex items-center justify-center">
                      {/* Core Sphere */}
                      <div className="w-[84px] h-[84px] rounded-full border-[2px] border-[#00F3FF] shadow-[0_0_30px_rgba(0,243,255,0.6)] bg-[#030816] flex items-center justify-center z-20 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-tr from-[#00F3FF]/20 to-transparent animate-pulse"></div>
                         <span className="text-[28px] font-black text-[#00F3FF] tracking-widest ml-1 drop-shadow-[0_0_10px_#00F3FF]">AI</span>
                      </div>
                      
                      {/* Orbiting Rings */}
                      <div className="absolute w-[130px] h-[130px] rounded-full border border-dashed border-[#00F3FF]/30 animate-[spin_10s_linear_infinite] z-10">
                         <div className="absolute top-[10px] left-[15px] w-[8px] h-[8px] rounded-full bg-[#00F3FF] shadow-[0_0_10px_#00F3FF]"></div>
                      </div>
                      <div className="absolute w-[160px] h-[160px] rounded-full border border-dashed border-[#00F3FF]/20 animate-[spin_15s_linear_reverse_infinite] z-5">
                         <div className="absolute bottom-[20px] right-[25px] w-[6px] h-[6px] rounded-full bg-[#00F3FF] shadow-[0_0_8px_#00F3FF]"></div>
                      </div>
                      
                      {/* Labels */}
                      <div className="absolute top-[20px] left-[-20px] z-20 bg-[#07152B]/90 border border-[#2A486F] px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
                         <div className="w-[6px] h-[6px] bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>
                         <span className="text-white text-[12px] font-medium">规则过滤</span>
                      </div>
                      <div className="absolute top-[20px] right-[-20px] z-20 bg-[#07152B]/90 border border-[#2A486F] px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
                         <span className="text-white text-[12px] font-medium">清洗去重</span>
                         <div className="w-[6px] h-[6px] bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>
                      </div>
                      <div className="absolute bottom-[20px] left-[-20px] z-20 bg-[#07152B]/90 border border-[#2A486F] px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
                         <div className="w-[6px] h-[6px] bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>
                         <span className="text-white text-[12px] font-medium">研判分析</span>
                      </div>
                      <div className="absolute bottom-[20px] right-[-20px] z-20 bg-[#07152B]/90 border border-[#2A486F] px-3 py-1.5 rounded flex items-center gap-2 shadow-lg">
                         <span className="text-white text-[12px] font-medium">关联归并</span>
                         <div className="w-[6px] h-[6px] bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>
                      </div>
                  </div>

                  {/* Flow 3: AI to Output */}
                  <div className="w-[40px] relative h-[220px]">
                      <svg width="100%" height="100%" viewBox="0 0 40 220" preserveAspectRatio="none">
                        <path d="M0,110 L40,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                        <path d="M0,110 L40,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay:'0.5s'}} />
                      </svg>
                  </div>

                  {/* Node 4: Output Total */}
                  <div className="w-[120px] h-[90px] relative z-10 shrink-0 bg-[#FF3333]/10 border border-[#FF3333]/50 rounded-md flex flex-col items-center justify-center shadow-[inset_0_0_25px_rgba(255,51,51,0.15)]">
                     <div className="text-[#FF3333] text-[12px] font-bold mb-1">事件输出总数</div>
                     <div className="text-[32px] text-[#FF3333] font-mono font-bold leading-none drop-shadow-[0_0_12px_#FF3333]">120</div>
                  </div>

                  {/* Flow 4: Output to Stats */}
                  <div className="w-[60px] relative h-[220px]">
                      <svg width="100%" height="100%" viewBox="0 0 60 220" preserveAspectRatio="none" className="overflow-visible">
                         <path d="M0,110 C40,110 40,35 60,35" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,110 L60,110" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         <path d="M0,110 C40,110 40,185 60,185" className="svg-track-base" vectorEffect="non-scaling-stroke" />
                         
                         <path d="M0,110 C40,110 40,35 60,35" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" />
                         <path d="M0,110 L60,110" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay:'0.3s'}} />
                         <path d="M0,110 C40,110 40,185 60,185" className="svg-beam" pathLength="100" vectorEffect="non-scaling-stroke" style={{animationDelay:'0.6s'}} />
                      </svg>
                  </div>

                  {/* Node 5: Stats Cards */}
                  <div className="flex flex-col justify-between h-[220px] w-[220px] relative z-10 shrink-0">
                     
                     {/* Card 1: Noise Reduction */}
                     <div className="h-[68px] bg-[#07152B] border border-[#2A486F] rounded-md px-3 py-2 flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-center pb-1.5 border-b border-[#2A486F]/50">
                           <span className="text-[#A5D8FF] text-[12px]">核心降噪率</span>
                           <span className="text-[#00F3FF] text-[14px] font-bold">99.2%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1">
                           <div className="text-gray-400">尝试数 <div className="text-white text-[14px] font-mono mt-0.5">15,420</div></div>
                           <div className="text-gray-400 text-right">成功数 <div className="text-white text-[14px] font-mono mt-0.5">15,300</div></div>
                        </div>
                     </div>

                     {/* Card 2: Process Status */}
                     <div className="h-[68px] bg-[#07152B] border border-[#2A486F] rounded-md px-3 py-2 flex flex-col justify-between shadow-lg">
                        <div className="text-[#A5D8FF] text-[12px] pb-1.5 border-b border-[#2A486F]/50">处理状态统计</div>
                        <div className="flex justify-between items-end text-[11px] pt-1 px-1">
                           <div className="flex flex-col items-center">
                             <span className="text-gray-400 mb-1">已处置</span>
                             <div className="w-[34px] h-[2px] bg-[#00FFD1] mb-1 shadow-[0_0_5px_#00FFD1]"></div>
                             <span className="text-[#00FFD1] font-mono font-bold">60</span>
                           </div>
                           <div className="flex flex-col items-center">
                             <span className="text-gray-400 mb-1">处置中</span>
                             <div className="w-[34px] h-[2px] bg-[#FFB000] mb-1 shadow-[0_0_5px_#FFB000]"></div>
                             <span className="text-[#FFB000] font-mono font-bold">60</span>
                           </div>
                           <div className="flex flex-col items-center">
                             <span className="text-gray-400 mb-1">待处置</span>
                             <div className="w-[34px] h-[2px] bg-[#FF3333] mb-1 shadow-[0_0_5px_#FF3333]"></div>
                             <span className="text-[#FF3333] font-mono font-bold">0</span>
                           </div>
                        </div>
                     </div>

                     {/* Card 3: Event Levels */}
                     <div className="h-[68px] bg-[#07152B] border border-[#2A486F] rounded-md px-3 py-2 flex flex-col justify-between shadow-lg">
                        <div className="text-[#A5D8FF] text-[12px] pb-1.5 border-b border-[#2A486F]/50">事件等级统计</div>
                        <div className="flex justify-between items-center text-[11px] pt-1.5 px-1">
                           <div className="flex flex-col items-center"><span className="text-[#FF3333] font-bold mb-0.5">紧急</span><span className="text-white font-mono">10</span></div>
                           <div className="flex flex-col items-center"><span className="text-[#FF6B00] font-bold mb-0.5">高危</span><span className="text-white font-mono">30</span></div>
                           <div className="flex flex-col items-center"><span className="text-[#FADB14] font-bold mb-0.5">中危</span><span className="text-white font-mono">40</span></div>
                           <div className="flex flex-col items-center"><span className="text-[#00FFD1] font-bold mb-0.5">低危</span><span className="text-white font-mono">40</span></div>
                        </div>
                     </div>

                  </div>
              </div>

              <div className="flex-1 w-full min-h-0 relative">
                 <EChartsWrapper option={mapOption} />
                 <div className="absolute right-4 bottom-4 bg-[#030816]/90 border border-[#00F3FF]/30 p-3 rounded-md backdrop-blur-md z-10 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                    <div className="text-[#A5D8FF] text-[12px] font-bold mb-2 pb-1.5 border-b border-[#00F3FF]/20">区域事件热度</div>
                    <div className="flex flex-col gap-2 text-[12px] text-gray-300 font-mono">
                      <div className="flex items-center justify-between w-[120px]"><span>&gt; 100</span><span className="w-3.5 h-3.5 rounded-full bg-[#FF3333] shadow-[0_0_10px_#FF3333] animate-pulse"></span></div>
                      <div className="flex items-center justify-between w-[120px]"><span>50 ~ 100</span><span className="w-3.5 h-3.5 rounded-full bg-[#FFB000] shadow-[0_0_10px_#FFB000] animate-pulse"></span></div>
                      <div className="flex items-center justify-between w-[120px]"><span>0 ~ 50</span><span className="w-3.5 h-3.5 rounded-full bg-[#00FFD1] shadow-[0_0_10px_#00FFD1]"></span></div>
                    </div>
                 </div>
              </div>
           </PanelCard>
        </section>

        {/* Right Column */}
        <aside className="w-[420px] flex flex-col gap-4 min-h-0">
          <PanelCard title="网络安全运营工单" style={{ flex: 1.2 }}>
            <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
               <div className="h-[56px] bg-gradient-to-b from-[#00F3FF]/20 to-transparent border border-[#00F3FF]/40 rounded flex flex-col items-center justify-center relative"><div className="absolute top-0 w-1/2 h-[2px] bg-[#00F3FF] shadow-[0_0_8px_#00F3FF]"></div><span className="text-[18px] font-bold text-[#00F3FF] font-mono leading-none">16,900</span><span className="text-[11px] text-gray-300 mt-1">工单总数</span></div>
               <div className="h-[56px] bg-gradient-to-b from-[#FFB000]/20 to-transparent border border-[#FFB000]/40 rounded flex flex-col items-center justify-center relative"><div className="absolute top-0 w-1/2 h-[2px] bg-[#FFB000] shadow-[0_0_8px_#FFB000]"></div><span className="text-[18px] font-bold text-[#FFB000] font-mono leading-none">13,450</span><span className="text-[11px] text-gray-300 mt-1">处置中</span></div>
               <div className="h-[56px] bg-gradient-to-b from-[#00FFD1]/20 to-transparent border border-[#00FFD1]/40 rounded flex flex-col items-center justify-center relative"><div className="absolute top-0 w-1/2 h-[2px] bg-[#00FFD1] shadow-[0_0_8px_#00FFD1]"></div><span className="text-[18px] font-bold text-[#00FFD1] font-mono leading-none">3,450</span><span className="text-[11px] text-gray-300 mt-1">已完成</span></div>
            </div>
            
            <div className="flex border-b border-[#00F3FF]/20 mb-3 overflow-x-auto gap-4 shrink-0 no-scrollbar">
              {['一类工单', '二类工单', '三类工单', '四类工单', '五类工单', '六类工单'].map((type, idx) => (
                <button key={idx} onClick={() => setActiveTab(idx)} className={`pb-2 pt-1 text-[12px] whitespace-nowrap transition-colors relative ${activeTab === idx ? 'text-[#00F3FF] font-bold' : 'text-[#6486AD] hover:text-[#A5D8FF]'}`}>
                  {type}{activeTab === idx && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#00F3FF] shadow-[0_0_5px_#00F3FF]"></div>}
                </button>
              ))}
            </div>

            <div className="flex-1 min-h-0 border border-[#00F3FF]/20">
               <CyberTable headers={['单位名称', '已处置', '待处置']} widths={['50%', '25%', '25%']} data={[['集团总部', `${10 + activeTab * 2}`, '10'], ['华东分公司', `${20 + activeTab}`, '20'], ['华南研发中心', '30', '30'], ['华中研发中心', '20', '20'], ['华北研发中心', '30', '30'], ['华北分部', '18', '12'], ['西南研发中心', '25', '15']]} />
            </div>
          </PanelCard>

          <PanelCard title="工单状态统计" style={{ height: '240px', flexShrink: 0 }}>
             <EChartsWrapper option={barOption} />
          </PanelCard>

          <PanelCard title="实时工单播报" style={{ flex: 0.8 }}>
             <div className="flex-1 overflow-hidden relative bg-[#030816]/30 border border-[#00F3FF]/20 scroll-container">
                <div className="absolute w-full animate-scroll text-[13px]">
                   {[...Array(12)].map((_, idx) => (
                     <div key={idx} className="flex justify-between items-center py-2 px-3 border-b border-[#00F3FF]/10 hover:bg-[#00F3FF]/10 transition-colors">
                        <span className="text-gray-200">工单编号 XA-{1000+idx}...</span>
                        <span className="text-[#A5D8FF] font-mono text-[12px]">15:17:41</span>
                     </div>
                   ))}
                </div>
             </div>
          </PanelCard>
        </aside>
      </main>
    </ScaleContainer>
  );
}
