import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { Settings, Users, User, Weight, Ruler, ArrowDown, Info, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculateZiplineCurve, calculateOptimalTension, Point } from './utils/physics';

type Language = 'ru' | 'en';

const translations = {
  ru: {
    title: 'Инженерный расчет зиплайна',
    subtitle: 'Анализ провиса v1.1',
    status: 'Статус',
    calculating: 'РАСЧЕТ',
    geometry: 'Геометрия',
    startHeight: 'Высота старта',
    span: 'Длина пролета',
    dropPercent: 'Уклон',
    physics: 'Физика',
    tension: 'Натяжение троса',
    ropeMass: 'Масса троса',
    scenarios: 'Сценарии нагрузки',
    noLoad: 'Без нагрузки',
    onePerson: '1 человек',
    twoPeople: '2 человека',
    personWeight: 'Вес человека',
    loadPosition: 'Положение груза',
    start: 'СТАРТ',
    end: 'ФИНИШ',
    warning: 'Всегда проверяйте расчеты у сертифицированного инженера перед установкой. Экологические факторы (ветер, температура) не учитываются.',
    endHeight: 'Высота финиша',
    totalDrop: 'Перепад высот',
    maxSag: 'Макс. провис',
    minClearance: 'Мин. просвет',
    profileView: 'Профиль',
    safetyWarning: 'Предупреждение',
    distance: 'Расстояние (м)',
    height: 'Высота (м)',
    dragHint: 'Перетаскивайте груз на графике',
    temperature: 'Температура воздуха',
    speed: 'Скорость',
    maxSpeed: 'Макс. скорость',
    safetyFactor: 'Запас прочности',
    brakeZone: 'Зона торможения',
    brakeDist: 'Дистанция тормоза',
    equipmentWeight: 'Вес оборудования',
    cableType: 'Тип троса',
    reactions: 'Реакции на опорах',
    horiz: 'Гор.',
    vert: 'Верт.',
    startAnchor: 'Опора СТАРТ',
    endAnchor: 'Опора ФИНИШ',
    autoTension: 'Авто-натяжение',
    targetSag: 'Целевой провис',
    currentSpeed: 'Скорость здесь',
    dragScenario: 'Поза (сопротивление)',
    superman: 'Супермен',
    sitting: 'Сидя',
    star: 'Звезда',
    cableLength: 'Длина троса',
    feetLevel: 'Уровень ног',
    safetyLevel: 'Линия запаса',
    clearance: 'Зазор',
    finishSpeed: 'Скорость на финише',
  },
  en: {
    title: 'Zipline Physics Engine',
    subtitle: 'Precision Sag Analysis v1.5',
    status: 'Status',
    calculating: 'CALCULATING',
    geometry: 'Geometry',
    startHeight: 'Start Height',
    span: 'Span (Length)',
    dropPercent: 'Drop Gradient',
    physics: 'Physics',
    tension: 'Rope Tension',
    ropeMass: 'Rope Mass',
    scenarios: 'Load Scenarios',
    noLoad: 'No Load',
    onePerson: '1 Person',
    twoPeople: '2 People',
    personWeight: 'Person Weight',
    loadPosition: 'Load Position',
    start: 'START',
    end: 'END',
    warning: 'Always verify calculations with a certified engineer before installation. Environmental factors like wind and temperature are not accounted for.',
    endHeight: 'End Height',
    totalDrop: 'Total Drop',
    maxSag: 'Max Sag',
    minClearance: 'Min Clearance',
    profileView: 'Profile View',
    safetyWarning: 'Safety Warning',
    distance: 'Distance (m)',
    height: 'Height (m)',
    dragHint: 'Drag the load on the chart',
    temperature: 'Air Temperature',
    speed: 'Speed',
    maxSpeed: 'Max Speed',
    safetyFactor: 'Safety Factor',
    brakeZone: 'Braking Zone',
    brakeDist: 'Brake Distance',
    equipmentWeight: 'Equipment Weight',
    cableType: 'Cable Type',
    reactions: 'Anchor Reactions',
    horiz: 'Horiz',
    vert: 'Vert',
    startAnchor: 'START Anchor',
    endAnchor: 'END Anchor',
    autoTension: 'Auto-tension',
    targetSag: 'Target Sag',
    currentSpeed: 'Current Speed',
    dragScenario: 'Pose (Drag)',
    superman: 'Superman',
    sitting: 'Sitting',
    star: 'Star',
    cableLength: 'Cable Length',
    feetLevel: 'Feet Level',
    safetyLevel: 'Safety Margin',
    clearance: 'Clearance',
    finishSpeed: 'Finish Speed',
  }
};

const DRAG_SCENARIOS = [
  { id: 'superman', area: 0.15 },
  { id: 'sitting', area: 0.50 },
  { id: 'star', area: 0.90 },
];

const CABLES = [
  { name: 'Triniks ZL 10mm (0.61 кг/м)', mass: 0.61, strengths: { 1570: 106, 1770: 112, 1960: 120 } },
  { name: 'Triniks ZL 11mm (0.72 кг/м)', mass: 0.72, strengths: { 1570: 123, 1770: 131, 1960: 139 } },
  { name: 'Triniks ZL 12mm (0.86 кг/м)', mass: 0.86, strengths: { 1570: 147, 1770: 156, 1960: 165 } },
  { name: 'Triniks ZL 16mm (1.54 кг/м)', mass: 1.54, strengths: { 1570: 270, 1770: 287, 1960: 303 } },
  { name: 'Steel 12mm CDCI (0.61 кг/м)', mass: 0.61, strengths: { 1770: 92.5 } }, 
  { name: 'Steel 14mm CDCI (0.84 кг/м)', mass: 0.84, strengths: { 1770: 141 } }, 
];

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const t = translations[lang];

  // Inputs
  const [startHeight, setStartHeight] = useState(15); // meters
  const [span, setSpan] = useState(100); // meters
  const [dropPercent, setDropPercent] = useState(4); // %
  const [tension, setTension] = useState(800); // kg
  const [targetSagRatio, setTargetSagRatio] = useState(2); // %
  const [autoTension, setAutoTension] = useState(true);
  const [selectedCable, setSelectedCable] = useState(CABLES[2]); // Triniks 12mm
  const [ropeWeight, setRopeWeight] = useState(CABLES[2].mass); 
  const [personWeight, setPersonWeight] = useState(120); // kg
  const [equipmentWeight, setEquipmentWeight] = useState(2); // kg
  const [loadPosition, setLoadPosition] = useState(0.5); // 0 to 1 (percentage of span)
  const [scenario, setScenario] = useState<'none' | 'one' | 'two'>('none');
  const [dragScenario, setDragScenario] = useState(DRAG_SCENARIOS[1]); // Default Sitting
  const [temperature, setTemperature] = useState(20); // Celsius
  const [hoverX, setHoverX] = useState<number | null>(null);

  const personHangingHeight = 2.0; // Distance from cable to feet
  const safetyMargin = 1.0; // Additional safety below feet

  const chartRef = useRef<SVGSVGElement>(null);
  const speedChartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const endHeight = startHeight - (span * dropPercent) / 100;
  const actualLoadWeight = scenario === 'none' ? 0 : scenario === 'one' ? personWeight : personWeight * 2;

  // Auto-tension effect
  useEffect(() => {
    if (autoTension) {
      const optimal = calculateOptimalTension(span, ropeWeight, targetSagRatio / 100);
      setTension(Math.round(optimal / 10) * 10);
    }
  }, [autoTension, span, ropeWeight, targetSagRatio]);

  const results = useMemo(() => {
    return calculateZiplineCurve(
      span,
      startHeight,
      endHeight,
      ropeWeight,
      tension,
      actualLoadWeight,
      loadPosition * span,
      temperature,
      equipmentWeight,
      dragScenario.area
    );
  }, [span, startHeight, endHeight, ropeWeight, tension, actualLoadWeight, loadPosition, temperature, equipmentWeight, dragScenario]);

  // Reference results for 1 person to show clearance even when "No Load" is selected
  const referenceResults = useMemo(() => {
    return calculateZiplineCurve(
      span,
      startHeight,
      endHeight,
      ropeWeight,
      tension,
      120, // Standard 1 person weight
      loadPosition * span,
      temperature,
      2,
      0.5
    );
  }, [span, startHeight, endHeight, ropeWeight, tension, loadPosition, temperature]);

  const curveData = results.points;
  const travelProfile = results.travelProfile;

  // Clearance lines are ALWAYS based on a loaded state (current or reference)
  const activeProfile = scenario === 'none' ? referenceResults.travelProfile : travelProfile;
  const feetLineData = activeProfile.map(p => ({ x: p.x, y: p.y - personHangingHeight }));
  const safetyLineData = activeProfile.map(p => ({ x: p.x, y: p.y - personHangingHeight - safetyMargin }));
  const maxSpeed = useMemo(() => d3.max(travelProfile, (d: Point) => d.speed || 0) || 0, [travelProfile]);
  const finishSpeed = travelProfile[travelProfile.length - 1]?.speed || 0;
  const currentSpeedAtLoad = useMemo(() => {
    const loadX = loadPosition * span;
    return travelProfile.reduce((prev: Point, curr: Point) => Math.abs(curr.x - loadX) < Math.abs(prev.x - loadX) ? curr : prev).speed || 0;
  }, [travelProfile, loadPosition, span]);
  const currentStrengthKg = ((selectedCable.strengths as any)[1770] || Object.values(selectedCable.strengths)[0] || 0) * 101.97; // kN to kg
  const currentSafetyFactor = currentStrengthKg / (results.maxTensionNewtons / 9.81);

  // D3 Visualization
  useEffect(() => {
    if (!chartRef.current || !containerRef.current) return;

    const svg = d3.select(chartRef.current);
    svg.selectAll('*').remove();

    const width = containerRef.current.clientWidth;
    const height = 350;
    const margin = { top: 40, right: 40, bottom: 40, left: 60 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().domain([0, span]).range([0, innerWidth]);
    const minY = d3.min(curveData, (d: Point) => d.y) ?? 0;
    const maxY = Math.max(startHeight, endHeight) + 2;
    const yScale = d3.scaleLinear().domain([Math.min(0, minY - 2), maxY]).range([innerHeight, 0]);

    // Axes
    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(xScale).ticks(10));
    g.append('g').call(d3.axisLeft(yScale));

    // Grid
    g.append('g').attr('opacity', 0.1).call(d3.axisBottom(xScale).tickSize(innerHeight).tickFormat(() => ''));
    g.append('g').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Ground
    g.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', yScale(0)).attr('y2', yScale(0)).attr('stroke', '#141414').attr('stroke-width', 2).attr('stroke-dasharray', '4,4');

    // The Rope
    const line = d3.line<Point>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveMonotoneX);
    g.append('path').datum(curveData).attr('fill', 'none').attr('stroke', '#1A9ADA').attr('stroke-width', 3).attr('d', line);

    // Feet and Safety Lines (based on travel profile)
    const feetLine = d3.line<any>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveMonotoneX);
    g.append('path')
      .datum(feetLineData)
      .attr('fill', 'none')
      .attr('stroke', '#141414')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2')
      .attr('opacity', 0.3)
      .attr('d', feetLine);

    g.append('path')
      .datum(safetyLineData)
      .attr('fill', 'none')
      .attr('stroke', '#FF4444')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .attr('opacity', 0.3)
      .attr('d', feetLine);

    // Hover tracker overlay (MUST BE BEFORE LOAD INDICATOR to not block drag)
    const overlay = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    overlay.on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      const x = xScale.invert(mx);
      setHoverX(x);
    }).on('mouseleave', () => {
      setHoverX(null);
    });

    // Load indicator
    if (scenario !== 'none') {
      const loadX = loadPosition * span;
      const loadY = curveData.reduce((prev: Point, curr: Point) => Math.abs(curr.x - loadX) < Math.abs(prev.x - loadX) ? curr : prev).y;
      const loadGroup = g.append('g').attr('transform', `translate(${xScale(loadX)},${yScale(loadY)})`).style('cursor', 'grab');
      
      const feetY = loadY - personHangingHeight;
      const safetyY = feetY - safetyMargin;

      loadGroup.append('circle').attr('r', 12).attr('fill', '#141414').attr('opacity', 0.2);
      loadGroup.append('circle').attr('r', 6).attr('fill', '#141414');
      
      // Vertical line from load to ground
      g.append('line')
        .attr('x1', xScale(loadX))
        .attr('y1', yScale(loadY))
        .attr('x2', xScale(loadX))
        .attr('y2', yScale(0))
        .attr('stroke', '#141414')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.2);

      // Height labels at load position (Moved further LEFT to avoid speed overlap)
      const drawHeightLabel = (yVal: number, color: string) => {
        const yPos = yScale(yVal);
        g.append('circle').attr('cx', xScale(loadX)).attr('cy', yPos).attr('r', 3).attr('fill', color);
        g.append('text')
          .attr('x', xScale(loadX) - 12)
          .attr('y', yPos + 3)
          .attr('text-anchor', 'end')
          .attr('font-size', '8px')
          .attr('font-weight', 'bold')
          .attr('fill', color)
          .text(`${yVal.toFixed(1)}m`);
      };

      drawHeightLabel(loadY, '#141414');
      drawHeightLabel(feetY, '#666');
      drawHeightLabel(safetyY, '#FF4444');

      loadGroup.append('text').attr('y', 25).attr('text-anchor', 'middle').attr('font-size', '10px').attr('font-weight', '600').text(`${actualLoadWeight}kg`);
      loadGroup.append('text').attr('x', 15).attr('y', 42).attr('text-anchor', 'start').attr('font-size', '9px').attr('font-weight', 'bold').attr('fill', '#1A9ADA').text(`${currentSpeedAtLoad.toFixed(1)} км/ч`);
      
      loadGroup.call(d3.drag<SVGGElement, unknown>().on('drag', (event) => {
        const x = xScale.invert(event.x);
        setLoadPosition(Math.max(0.01, Math.min(0.99, x / span)));
      }));
    }

    if (hoverX !== null) {
      const hX = Math.max(0, Math.min(span, hoverX));
      const p = activeProfile.reduce((prev, curr) => Math.abs(curr.x - hX) < Math.abs(prev.x - hX) ? curr : prev);
      const cableY = p.y;
      const feetY = cableY - personHangingHeight;
      const safetyY = feetY - safetyMargin;

      const hoverG = g.append('g').attr('pointer-events', 'none');
      
      hoverG.append('line')
        .attr('x1', xScale(hX))
        .attr('y1', 0)
        .attr('x2', xScale(hX))
        .attr('y2', innerHeight)
        .attr('stroke', '#141414')
        .attr('stroke-width', 0.5)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.2);

      const drawHoverLabel = (yVal: number, color: string) => {
        const yPos = yScale(yVal);
        hoverG.append('circle').attr('cx', xScale(hX)).attr('cy', yPos).attr('r', 2).attr('fill', color);
        hoverG.append('text')
          .attr('x', xScale(hX) + 5)
          .attr('y', yPos - 5)
          .attr('font-size', '8px')
          .attr('fill', color)
          .attr('font-weight', 'bold')
          .text(`${yVal.toFixed(1)}m`);
      };

      drawHoverLabel(cableY, '#141414');
      drawHoverLabel(feetY, '#666');
      drawHoverLabel(safetyY, '#FF4444');
    }

    // Speed Chart
    if (speedChartRef.current) {
      const sSvg = d3.select(speedChartRef.current);
      sSvg.selectAll('*').remove();
      const sHeight = 100;
      const sInnerHeight = sHeight - 35;
      const sg = sSvg.append('g').attr('transform', `translate(${margin.left}, 20)`);
      const syScale = d3.scaleLinear().domain([0, Math.max(10, maxSpeed * 1.1)]).range([sInnerHeight, 0]);
      
      // Grid for speed chart
      sg.append('g').attr('opacity', 0.05).call(d3.axisLeft(syScale).ticks(3).tickSize(-innerWidth).tickFormat(() => ''));
      
      sg.append('g').attr('transform', `translate(0,${sInnerHeight})`).call(d3.axisBottom(xScale).ticks(10).tickFormat(() => ''));
      sg.append('g').call(d3.axisLeft(syScale).ticks(3));
      const sLine = d3.line<Point>().x(d => xScale(d.x)).y(d => syScale(d.speed || 0)).curve(d3.curveMonotoneX);
      sg.append('path').datum(travelProfile).attr('fill', 'rgba(26, 154, 218, 0.1)').attr('stroke', '#1A9ADA').attr('stroke-width', 1.5).attr('d', sLine);
      sg.append('text').attr('x', -5).attr('y', -8).attr('font-size', '9px').attr('font-weight', 'bold').text(`${t.speed} (km/h)`);
    }

  }, [curveData, travelProfile, span, startHeight, endHeight, scenario, loadPosition, actualLoadWeight, t, maxSpeed, currentSpeedAtLoad]);

  return (
    <div className="min-h-screen bg-white text-brand-dark font-sans selection:bg-brand-blue selection:text-white">
      <main className="grid grid-cols-1 lg:grid-cols-12 h-screen">
        <aside className="lg:col-span-3 border-r border-brand-dark/10 p-4 flex flex-col overflow-y-auto bg-brand-dark/[0.02]">
          <div className="flex-grow space-y-4">
            <section>
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70"><Settings size={12} /> {t.geometry}</h2>
            <div className="grid grid-cols-2 gap-2">
              <InputGroup label={t.startHeight} value={startHeight} onChange={setStartHeight} unit="m" />
              <InputGroup label={t.span} value={span} onChange={setSpan} unit="m" />
              <InputGroup label={t.dropPercent} value={dropPercent} onChange={(v: number) => setDropPercent(Math.max(0, v))} unit="%" step={0.5} />
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70"><Weight size={12} /> {t.physics}</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase opacity-50">{t.cableType}</label>
                <select 
                  className="w-full bg-white border border-brand-dark/20 p-1.5 text-[11px] font-mono focus:outline-none"
                  value={CABLES.indexOf(selectedCable)}
                  onChange={(e) => {
                    const cable = CABLES[parseInt(e.target.value)];
                    setSelectedCable(cable);
                    setRopeWeight(cable.mass);
                  }}
                >
                  {CABLES.map((c, i) => <option key={i} value={i}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.tension}</label>
                    <input type="checkbox" checked={autoTension} onChange={(e) => setAutoTension(e.target.checked)} className="accent-brand-blue scale-75" />
                  </div>
                  <InputGroup value={tension} onChange={(v: number) => { setTension(v); setAutoTension(false); }} unit="кг" step={10} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase opacity-50">{t.targetSag}</label>
                  <InputGroup value={targetSagRatio} onChange={setTargetSagRatio} unit="%" step={0.1} />
                </div>
                <InputGroup label={t.temperature} value={temperature} onChange={setTemperature} unit="°C" step={1} />
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70"><Users size={12} /> {t.scenarios}</h2>
            <div className="grid grid-cols-3 gap-1 mb-3">
              {['none', 'one', 'two'].map(s => (
                <button key={s} onClick={() => setScenario(s as any)} className={`py-1 border border-brand-dark/20 text-[8px] font-bold uppercase transition-colors ${scenario === s ? 'bg-brand-dark text-white' : 'hover:bg-brand-dark/5'}`}>
                  {s === 'none' ? t.noLoad : s === 'one' ? t.onePerson : t.twoPeople}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {scenario !== 'none' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.dragScenario}</label>
                    <div className="grid grid-cols-3 gap-1">
                      {DRAG_SCENARIOS.map(ds => (
                        <button 
                          key={ds.id} 
                          onClick={() => setDragScenario(ds)}
                          className={`p-1 border border-brand-dark/20 text-[8px] font-bold uppercase transition-colors ${dragScenario.id === ds.id ? 'bg-brand-dark text-white' : 'hover:bg-brand-dark/5'}`}
                        >
                          {(t as any)[ds.id]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup label={t.personWeight} value={personWeight} onChange={setPersonWeight} unit="кг" />
                    <InputGroup label={t.equipmentWeight} value={equipmentWeight} onChange={setEquipmentWeight} unit="кг" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.loadPosition}</label>
                    <input type="range" min="0.05" max="0.95" step="0.01" value={loadPosition} onChange={(e) => setLoadPosition(parseFloat(e.target.value))} className="w-full accent-brand-blue h-2" />
                    <div className="flex justify-between text-[9px] font-mono opacity-50">
                      <span>{t.start}</span>
                      <span>{(loadPosition * span).toFixed(1)}m</span>
                      <span>{t.end}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <section className="pt-3 border-t border-[#141414]/10">
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">{t.reactions} (кг)</h2>
            <p className="text-[7px] opacity-40 mb-2 uppercase italic leading-tight">
              {lang === 'ru' ? '+ вниз, - вверх' : '+ down, - up'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-1.5 bg-white border border-[#141414]/5">
                <p className="text-[8px] font-bold opacity-40 uppercase mb-1">{t.startAnchor}</p>
                <div className="flex justify-between text-[10px] font-mono"><span>H:</span><span>{results.reactions.start.horizontal.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-mono"><span>V:</span><span>{results.reactions.start.vertical.toFixed(0)}</span></div>
              </div>
              <div className="p-1.5 bg-white border border-[#141414]/5">
                <p className="text-[8px] font-bold opacity-40 uppercase mb-1">{t.endAnchor}</p>
                <div className="flex justify-between text-[10px] font-mono"><span>H:</span><span>{results.reactions.end.horizontal.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-mono"><span>V:</span><span>{results.reactions.end.vertical.toFixed(0)}</span></div>
              </div>
            </div>
          </section>
          </div>

          <div className="mt-8 pt-4 border-t border-brand-dark/10">
            <h1 className="text-xl font-bold tracking-tighter leading-none flex flex-col">
              <span className="text-brand-dark">NORWAY</span>
              <span className="text-brand-blue">PARK</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 mt-1">Стройотдел</p>
          </div>
        </aside>

        <div className="lg:col-span-9 p-4 flex flex-col gap-4">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            <StatCard label={t.endHeight} value={`${endHeight.toFixed(1)}m`} />
            <StatCard label={t.totalDrop} value={`${(startHeight - endHeight).toFixed(1)}m`} />
            <StatCard label={t.dropPercent} value={`${dropPercent}%`} />
            <StatCard label={t.cableLength} value={`${results.cableLength.toFixed(1)}m`} />
            <StatCard label={t.maxSag} value={`${(Math.max(startHeight, endHeight) - (d3.min(curveData, (d: Point) => d.y) ?? 0)).toFixed(2)}m`} />
            <StatCard label={t.maxSpeed} value={`${maxSpeed.toFixed(0)} км/ч`} highlight={maxSpeed > 60} />
            <StatCard label={t.finishSpeed} value={`${finishSpeed.toFixed(0)} км/ч`} highlight={finishSpeed > 40} />
            <StatCard label={t.safetyFactor} value={currentSafetyFactor.toFixed(1)} highlight={currentSafetyFactor < 3} />
          </div>

          <div ref={containerRef} className="bg-white border border-brand-dark/10 rounded-lg shadow-sm relative overflow-hidden flex flex-col w-full">
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase bg-brand-dark text-white px-1.5 py-0.5 rounded w-fit">{t.profileView}</span>
              {scenario !== 'none' && <span className="text-[8px] font-bold uppercase text-brand-blue italic">{t.dragHint}</span>}
            </div>
            <svg ref={chartRef} className="w-full h-[400px]" />
            <div className="h-[100px] border-t border-[#141414]/10 bg-black/[0.02]">
              <svg ref={speedChartRef} className="w-full h-full" />
            </div>
          </div>

          <footer className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="flex items-center gap-2 border border-brand-dark/20 px-2 py-1 text-[9px] font-bold uppercase hover:bg-brand-blue hover:text-white transition-colors bg-white">
                <Globe size={10} /> {lang === 'ru' ? 'English' : 'Русский'}
              </button>
              <div className="flex items-center gap-4">
                <p className="text-[9px] font-bold uppercase opacity-40">{t.safetyWarning}</p>
                <p className="text-[10px] italic serif opacity-60">"{t.warning}"</p>
              </div>
            </div>
            <div className="text-right font-mono text-[8px] opacity-30 leading-tight">
              {t.title} | COORD_SYS: CARTESIAN | GRAVITY: 9.81 m/s² | ROPE: {selectedCable.name}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

function InputGroup({ label, value, onChange, unit, step = 1 }: any) {
  return (
    <div className="space-y-0.5">
      {label && <label className="text-[9px] font-bold uppercase opacity-50">{label}</label>}
      <div className="flex items-center gap-1">
        <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-brand-dark/20 px-1.5 py-1 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue" />
        <span className="text-[9px] font-bold opacity-40">{unit}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, badge }: { label: string, value: string, highlight?: boolean, badge?: string }) {
  return (
    <div className={`border-b border-brand-dark/10 pb-1 relative ${highlight ? 'border-brand-blue' : ''}`}>
      <div className="flex justify-between items-start">
        <p className="text-[9px] font-bold uppercase opacity-40 mb-0.5">{label}</p>
        {badge && <span className="text-[7px] font-bold uppercase bg-brand-lime text-white px-1 rounded-sm">{badge}</span>}
      </div>
      <p className={`text-base font-mono tracking-tighter ${highlight ? 'text-brand-blue' : ''}`}>{value}</p>
    </div>
  );
}
