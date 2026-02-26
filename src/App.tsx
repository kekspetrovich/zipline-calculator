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
    geometry: 'Геометрия и Физика',
    startHeight: 'Высота старта',
    span: 'Длина пролета',
    dropPercent: 'Уклон',
    physics: 'Физика',
    tension: 'Натяжение',
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
    temperature: 'Температура',
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
    feetLevel: 'Трос под нагрузкой',
    safetyLevel: 'Линия запаса',
    clearance: 'Зазор',
    finishSpeed: 'Скорость на финише',
    showFeetLine: 'Трос под нагрузкой',
    showSafetyLine: 'Линия безопасности',
    feetHeight: 'Высота подвеса',
    safetyMargin: 'От нагрузки до красной линии',
    geometryTooltip: 'Параметры трассы: высоты и длина',
    physicsTooltip: 'Характеристики троса и натяжение. Влияет на провис и прочность.',
    scenariosTooltip: 'Вес и положение людей. Влияет на провис и скорость.',
    poseTooltip: 'Аэродинамика. Влияет ТОЛЬКО на скорость, не на провис.',
    exportSvg: 'Экспорт SVG',
    noLoadCable: 'Трос без нагрузки',
  },
  en: {
    title: 'Zipline Physics Engine',
    subtitle: 'Precision Sag Analysis v1.5',
    status: 'Status',
    calculating: 'CALCULATING',
    geometry: 'Geometry & Physics',
    startHeight: 'Start Height',
    span: 'Span (Length)',
    dropPercent: 'Drop Gradient',
    physics: 'Physics',
    tension: 'Tension',
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
    temperature: 'Temperature',
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
    feetLevel: 'Loaded Cable Profile',
    safetyLevel: 'Safety Margin',
    clearance: 'Clearance',
    finishSpeed: 'Finish Speed',
    showFeetLine: 'Loaded Profile',
    showSafetyLine: 'Safety Line',
    feetHeight: 'Hanging Height',
    safetyMargin: 'Load to red line',
    geometryTooltip: 'Track parameters: heights and span',
    physicsTooltip: 'Cable specs and tension. Affects sag and strength.',
    scenariosTooltip: 'Load weight and position. Affects sag and speed.',
    poseTooltip: 'Aerodynamics. Affects ONLY speed, not sag.',
    exportSvg: 'Export SVG',
    noLoadCable: 'No-load Cable',
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
  const [dragScenario, setDragScenario] = useState(DRAG_SCENARIOS[1]); // Default Sitting
  const [temperature, setTemperature] = useState(20); // Celsius
  const [hoverX, setHoverX] = useState<number | null>(null);

  const [safetyMargin, setSafetyMargin] = useState(1.0); // Additional safety below loaded profile
  const [showNoLoadLine, setShowNoLoadLine] = useState(true);
  const [showFeetLine, setShowFeetLine] = useState(true);
  const [showSafetyLine, setShowSafetyLine] = useState(true);

  const chartRef = useRef<SVGSVGElement>(null);
  const speedChartRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const endHeight = startHeight - (span * dropPercent) / 100;
  const actualLoadWeight = personWeight + equipmentWeight;

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

  const curveData = results.points;
  const travelProfile = results.travelProfile;

  // No-load results for reference
  const noLoadResults = useMemo(() => {
    return calculateZiplineCurve(
      span,
      startHeight,
      endHeight,
      ropeWeight,
      tension,
      0, // No load
      0.5 * span,
      temperature,
      0,
      0.5
    );
  }, [span, startHeight, endHeight, ropeWeight, tension, temperature]);

  const noLoadCurveData = noLoadResults.points;

  // Clearance lines are based on the travel profile (cable under load)
  const feetLineData = travelProfile.map(p => ({ x: p.x, y: p.y }));
  const safetyLineData = travelProfile.map(p => ({ x: p.x, y: p.y - safetyMargin }));
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
    const totalHeight = containerRef.current.clientHeight;
    
    // Layout constants
    const speedChartHeight = 150;
    const gap = 40;
    const margin = { top: 50, right: 60, bottom: 40, left: 70 };
    
    const innerWidth = width - margin.left - margin.right;
    const mainChartInnerHeight = totalHeight - speedChartHeight - gap - margin.top - margin.bottom;

    const gMain = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const gSpeed = svg.append('g').attr('transform', `translate(${margin.left},${margin.top + mainChartInnerHeight + gap})`);

    // Helper for text with background (halo)
    const drawTextWithHalo = (selection: any, x: number, y: number, text: string, color: string, anchor: string = 'start', weight: string = 'normal', size: string = '14px') => {
      const g = selection.append('g').attr('transform', `translate(${x},${y})`);
      g.append('text')
        .attr('text-anchor', anchor)
        .attr('font-size', size)
        .attr('font-weight', weight)
        .attr('fill', 'white')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('stroke-linejoin', 'round')
        .attr('opacity', 0.8)
        .text(text);
      g.append('text')
        .attr('text-anchor', anchor)
        .attr('font-size', size)
        .attr('font-weight', weight)
        .attr('fill', color)
        .text(text);
    };

    // Shared X Scale
    const xScale = d3.scaleLinear().domain([0, span]).range([0, innerWidth]);

    // --- Main Chart Logic ---
    const minY_cable = Number(d3.min(curveData, (d: Point) => d.y) ?? 0);
    const minY_noLoad = showNoLoadLine ? Number(d3.min(noLoadCurveData, (d: Point) => d.y) ?? minY_cable) : minY_cable;
    const minY_feet = showFeetLine ? Number(d3.min(feetLineData, (d: any) => d.y) ?? minY_noLoad) : minY_noLoad;
    const minY_safety = showSafetyLine ? Number(d3.min(safetyLineData, (d: any) => d.y) ?? minY_feet) : minY_feet;
    const absoluteMinY = Math.min(minY_cable, minY_noLoad, minY_feet, minY_safety);
    
    const maxY = Math.max(startHeight, endHeight) + 2;
    const yDomainMin = absoluteMinY > 10 ? absoluteMinY - 5 : Math.min(0, absoluteMinY - 2);
    const yScale = d3.scaleLinear().domain([yDomainMin, maxY]).range([mainChartInnerHeight, 0]);

    // Main Axes
    gMain.append('g')
      .attr('transform', `translate(0,${mainChartInnerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10))
      .selectAll('text')
      .style('font-size', '14px');

    gMain.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('font-size', '14px');

    // Main Grid
    gMain.append('g').attr('opacity', 0.1).call(d3.axisBottom(xScale).tickSize(mainChartInnerHeight).tickFormat(() => ''));
    gMain.append('g').attr('opacity', 0.1).call(d3.axisLeft(yScale).tickSize(-innerWidth).tickFormat(() => ''));

    // Ground
    gMain.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#141414')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    // The Rope (Real-time)
    const line = d3.line<Point>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveMonotoneX);
    gMain.append('path').datum(curveData).attr('fill', 'none').attr('stroke', '#1A9ADA').attr('stroke-width', 4).attr('d', line);

    // No-load Cable (Thin Blue)
    if (showNoLoadLine) {
      gMain.append('path').datum(noLoadCurveData).attr('fill', 'none').attr('stroke', '#1A9ADA').attr('stroke-width', 1).attr('opacity', 0.5).attr('d', line);
    }

    // Start and Finish Points
    const drawAnchorPoint = (xVal: number, yVal: number) => {
      gMain.append('circle').attr('cx', xScale(xVal)).attr('cy', yScale(yVal)).attr('r', 6).attr('fill', '#141414');
      drawTextWithHalo(
        gMain,
        xScale(xVal) + (xVal === 0 ? 12 : -12),
        yScale(yVal) - 15,
        `${yVal.toFixed(1)}m`,
        '#141414',
        xVal === 0 ? 'start' : 'end',
        'bold',
        '16px'
      );
    };

    drawAnchorPoint(0, startHeight);
    drawAnchorPoint(span, endHeight);

    // Max Sag Indicator (Green Line)
    const maxSagPoint = travelProfile.reduce((prev, curr) => curr.y < prev.y ? curr : prev);
    const maxSagX = maxSagPoint.x;
    const noLoadAtMaxSag = noLoadCurveData.reduce((prev, curr) => Math.abs(curr.x - maxSagX) < Math.abs(prev.x - maxSagX) ? curr : prev);

    const gMaxSag = gMain.append('g').attr('pointer-events', 'none');
    gMaxSag.append('line')
      .attr('x1', xScale(maxSagX))
      .attr('y1', 0)
      .attr('x2', xScale(maxSagX))
      .attr('y2', mainChartInnerHeight)
      .attr('stroke', '#22C55E')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '5,5');

    const drawMaxSagLabel = (yVal: number, color: string) => {
      const yPos = yScale(yVal);
      gMaxSag.append('circle').attr('cx', xScale(maxSagX)).attr('cy', yPos).attr('r', 4).attr('fill', color);
      drawTextWithHalo(gMaxSag, xScale(maxSagX) + 8, yPos - 5, `${yVal.toFixed(1)}m`, color, 'start', 'bold', '13px');
    };

    drawMaxSagLabel(maxSagPoint.y, '#141414');
    if (showNoLoadLine) drawMaxSagLabel(noLoadAtMaxSag.y, '#1A9ADA');
    if (showSafetyLine) drawMaxSagLabel(maxSagPoint.y - safetyMargin, '#FF4444');

    // Feet and Safety Lines
    const feetLine = d3.line<any>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveMonotoneX);
    if (showFeetLine) {
      gMain.append('path').datum(feetLineData).attr('fill', 'none').attr('stroke', '#141414').attr('stroke-width', 2).attr('stroke-dasharray', '6,3').attr('opacity', 0.5).attr('d', feetLine);
    }
    if (showSafetyLine) {
      gMain.append('path').datum(safetyLineData).attr('fill', 'none').attr('stroke', '#FF4444').attr('stroke-width', 2).attr('stroke-dasharray', '4,4').attr('opacity', 0.5).attr('d', feetLine);
    }

    // --- Speed Chart Logic ---
    const syScale = d3.scaleLinear().domain([0, Math.max(15, maxSpeed * 1.1)]).range([speedChartHeight - 40, 0]);
    
    gSpeed.append('g').attr('opacity', 0.05).call(d3.axisLeft(syScale).ticks(5).tickSize(-innerWidth).tickFormat(() => ''));
    gSpeed.append('g').attr('transform', `translate(0,${speedChartHeight - 40})`).call(d3.axisBottom(xScale).ticks(10)).selectAll('text').style('font-size', '14px');
    gSpeed.append('g').call(d3.axisLeft(syScale).ticks(5)).selectAll('text').style('font-size', '14px');

    const sLine = d3.line<Point>().x(d => xScale(d.x)).y(d => syScale(d.speed || 0)).curve(d3.curveMonotoneX);
    gSpeed.append('path').datum(travelProfile).attr('fill', 'none').attr('stroke', '#1A9ADA').attr('stroke-width', 3).attr('d', sLine);
    gSpeed.append('text').attr('x', 0).attr('y', -15).attr('font-size', '14px').attr('font-weight', 'bold').attr('fill', '#141414').text(`${t.speed} (km/h)`);

    // Max Sag Speed Point
    const maxSagSpeed = maxSagPoint.speed || 0;
    gSpeed.append('circle').attr('cx', xScale(maxSagX)).attr('cy', syScale(maxSagSpeed)).attr('r', 4).attr('fill', '#22C55E');
    drawTextWithHalo(gSpeed, xScale(maxSagX) + 8, syScale(maxSagSpeed) - 5, `${maxSagSpeed.toFixed(1)} km/h`, '#22C55E', 'start', 'bold', '12px');

    // Finish Speed Point
    const lastP = travelProfile[travelProfile.length - 1];
    if (lastP) {
      gSpeed.append('circle').attr('cx', xScale(lastP.x)).attr('cy', syScale(lastP.speed || 0)).attr('r', 5).attr('fill', '#1A9ADA');
      drawTextWithHalo(
        gSpeed,
        xScale(lastP.x) - 10,
        syScale(lastP.speed || 0) - 10,
        `${(lastP.speed || 0).toFixed(1)} km/h`,
        '#1A9ADA',
        'end',
        'bold',
        '14px'
      );
    }

    // --- Unified Interaction ---
    const interactionOverlay = svg.append('rect')
      .attr('width', width)
      .attr('height', totalHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    interactionOverlay.on('mousemove', (event) => {
      const [mx] = d3.pointer(event);
      const x = xScale.invert(mx - margin.left);
      const boundedX = Math.max(0, Math.min(span, x));
      setHoverX(boundedX);
      setLoadPosition(Math.max(0.01, Math.min(0.99, boundedX / span)));
    }).on('mouseleave', () => {
      setHoverX(null);
    });

    // Load Indicator (Main Chart)
    const loadX = loadPosition * span;
    const loadY = curveData.reduce((prev: Point, curr: Point) => Math.abs(curr.x - loadX) < Math.abs(prev.x - loadX) ? curr : prev).y;
    const loadGroup = gMain.append('g').attr('transform', `translate(${xScale(loadX)},${yScale(loadY)})`);
    
    loadGroup.append('circle').attr('r', 15).attr('fill', '#141414').attr('opacity', 0.15);
    loadGroup.append('circle').attr('r', 7).attr('fill', '#141414');

    // Hover Labels
    if (hoverX !== null) {
      const hX = Math.max(0, Math.min(span, hoverX));
      const p = travelProfile.reduce((prev, curr) => Math.abs(curr.x - hX) < Math.abs(prev.x - hX) ? curr : prev);
      const noLoadP = noLoadCurveData.reduce((prev, curr) => Math.abs(curr.x - hX) < Math.abs(prev.x - hX) ? curr : prev);
      
      // Vertical Guide Line
      svg.append('line')
        .attr('x1', xScale(hX) + margin.left)
        .attr('y1', margin.top)
        .attr('x2', xScale(hX) + margin.left)
        .attr('y2', totalHeight - margin.bottom)
        .attr('stroke', '#141414')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.3);

      // Main Chart Hover Labels
      const drawHoverLabel = (yVal: number, color: string) => {
        const yPos = yScale(yVal);
        gMain.append('circle').attr('cx', xScale(hX)).attr('cy', yPos).attr('r', 5).attr('fill', color);
        drawTextWithHalo(gMain, xScale(hX) + 12, yPos + 4, `${yVal.toFixed(1)}m`, color, 'start', 'bold', '14px');
      };

      drawHoverLabel(p.y, '#141414');
      if (showNoLoadLine) drawHoverLabel(noLoadP.y, '#1A9ADA');
      if (showSafetyLine) drawHoverLabel(p.y - safetyMargin, '#FF4444');

      // Speed Chart Hover Label
      const speed = p.speed || 0;
      gSpeed.append('circle').attr('cx', xScale(hX)).attr('cy', syScale(speed)).attr('r', 5).attr('fill', '#1A9ADA');
      drawTextWithHalo(gSpeed, xScale(hX) + 12, syScale(speed) + 4, `${speed.toFixed(1)} km/h`, '#1A9ADA', 'start', 'bold', '14px');
    }

  }, [curveData, noLoadCurveData, travelProfile, span, startHeight, endHeight, loadPosition, actualLoadWeight, t, maxSpeed, currentSpeedAtLoad, safetyMargin, showNoLoadLine, showFeetLine, showSafetyLine, hoverX]);

  const exportToSvg = () => {
    if (!chartRef.current) return;
    
    const originalSvg = chartRef.current;
    const width = originalSvg.clientWidth || 1200;
    const height = originalSvg.clientHeight || 800;
    const exportHeight = height + 250;

    const combinedSvg = originalSvg.cloneNode(true) as SVGSVGElement;
    combinedSvg.setAttribute('width', width.toString());
    combinedSvg.setAttribute('height', exportHeight.toString());
    combinedSvg.setAttribute('viewBox', `0 0 ${width} ${exportHeight}`);
    combinedSvg.style.backgroundColor = 'white';

    // Add Metadata Section
    const metaG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    metaG.setAttribute('transform', `translate(70, ${height + 40})`);
    metaG.setAttribute('font-family', 'Inter, sans-serif');
    metaG.setAttribute('font-size', '14px');

    const lines = [
      `--- ${t.title.toUpperCase()} REPORT ---`,
      `${t.span}: ${span}m | ${t.dropPercent}: ${dropPercent}% | ${t.temperature}: ${temperature}°C`,
      `${t.startHeight}: ${startHeight}m | ${t.endHeight}: ${endHeight.toFixed(1)}m`,
      `${t.cableType}: ${selectedCable.name}`,
      `${t.tension}: ${tension}kg | ${t.targetSag}: ${targetSagRatio}%`,
      `${t.scenarios}: ${actualLoadWeight}kg`,
      `--- KEY RESULTS ---`,
      `${t.maxSpeed}: ${maxSpeed.toFixed(1)} km/h | ${t.finishSpeed}: ${finishSpeed.toFixed(1)} km/h`,
      `${t.cableLength}: ${results.cableLength.toFixed(1)}m | ${t.safetyFactor}: ${currentSafetyFactor.toFixed(1)}`,
      `GENERATED: ${new Date().toLocaleString()}`,
      `NORWAY PARK ENGINEERING TOOL`
    ];

    lines.forEach((line, i) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('y', (i * 22).toString());
      text.setAttribute('fill', i === 0 || i === 6 ? '#1A9ADA' : '#141414');
      text.setAttribute('font-weight', i === 0 || i === 6 ? 'bold' : 'normal');
      text.textContent = line;
      metaG.appendChild(text);
    });

    combinedSvg.appendChild(metaG);

    const svgData = new XMLSerializer().serializeToString(combinedSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `zipline_report_${span}m_${dropPercent}pct_${new Date().toISOString().split('T')[0]}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };


  return (
    <div className="min-h-screen bg-white text-brand-dark font-sans selection:bg-brand-blue selection:text-white">
      <main className="flex flex-col h-screen overflow-hidden">
        {/* Top Controls Bar */}
        <header className="bg-brand-dark/[0.02] border-b border-brand-dark/10 p-4 shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-none">
          <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <section title={t.geometryTooltip}>
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">
                <Settings size={12} /> {t.geometry}
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <InputGroup label={t.startHeight} value={startHeight} onChange={setStartHeight} unit="m" />
                  <InputGroup label={t.span} value={span} onChange={setSpan} unit="m" />
                  <InputGroup label={t.dropPercent} value={dropPercent} onChange={(v: number) => setDropPercent(Math.max(0, v))} unit="%" step={0.5} />
                </div>
                <div className="space-y-3 pt-2 border-t border-brand-dark/5">
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
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold uppercase opacity-50">{t.tension}</label>
                        <input type="checkbox" checked={autoTension} onChange={(e) => setAutoTension(e.target.checked)} className="accent-brand-blue scale-75" />
                      </div>
                      <InputGroup value={tension} onChange={(v: number) => { setTension(v); setAutoTension(false); }} unit="кг" step={10} />
                    </div>
                    <InputGroup label={t.targetSag} value={targetSagRatio} onChange={setTargetSagRatio} unit="%" step={0.1} />
                    <InputGroup label={t.temperature} value={temperature} onChange={setTemperature} unit="°C" step={1} />
                  </div>
                </div>
              </div>
            </section>

            <section title={t.scenariosTooltip}>
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">
                <Users size={12} /> {t.scenarios}
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <InputGroup label={t.personWeight} value={personWeight} onChange={setPersonWeight} unit="кг" />
                  <InputGroup label={t.equipmentWeight} value={equipmentWeight} onChange={setEquipmentWeight} unit="кг" />
                </div>
                <div className="space-y-1" title={t.poseTooltip}>
                  <label className="text-[9px] font-bold uppercase opacity-50">{t.dragScenario}</label>
                  <select 
                    className="w-full bg-white border border-brand-dark/20 p-1 text-[10px] font-mono focus:outline-none"
                    value={dragScenario.id}
                    onChange={(e) => setDragScenario(DRAG_SCENARIOS.find(ds => ds.id === e.target.value) || DRAG_SCENARIOS[1])}
                  >
                    {DRAG_SCENARIOS.map(ds => <option key={ds.id} value={ds.id}>{(t as any)[ds.id]}</option>)}
                  </select>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={exportToSvg}
                    className="w-full flex items-center justify-center gap-2 border border-brand-dark/20 px-3 py-2 text-[10px] font-bold uppercase hover:bg-brand-blue hover:text-white transition-colors bg-white"
                  >
                    <Globe size={12} /> {t.exportSvg}
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-3 opacity-70">
                <Ruler size={12} /> {t.safetyLevel}
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={showNoLoadLine} onChange={(e) => setShowNoLoadLine(e.target.checked)} className="accent-brand-blue scale-90" />
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.noLoadCable}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={showFeetLine} onChange={(e) => setShowFeetLine(e.target.checked)} className="accent-brand-dark scale-90" />
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.showFeetLine}</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={showSafetyLine} onChange={(e) => setShowSafetyLine(e.target.checked)} className="accent-brand-blue scale-90" />
                    <label className="text-[9px] font-bold uppercase opacity-50">{t.showSafetyLine}</label>
                  </div>
                </div>
                <InputGroup label={t.safetyMargin} value={safetyMargin} onChange={setSafetyMargin} unit="m" step={0.1} />
              </div>
            </section>

          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col p-4 gap-4 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <StatCard label={t.endHeight} value={`${endHeight.toFixed(1)}m`} />
            <StatCard label={t.totalDrop} value={`${(startHeight - endHeight).toFixed(1)}m`} />
            <StatCard label={t.dropPercent} value={`${dropPercent}%`} />
            <StatCard label={t.cableLength} value={`${results.cableLength.toFixed(1)}m`} />
            <StatCard label={t.maxSag} value={`${(Math.max(startHeight, endHeight) - (d3.min(curveData, (d: Point) => d.y) ?? 0)).toFixed(2)}m`} />
            <StatCard label={t.maxSpeed} value={`${maxSpeed.toFixed(0)} км/ч`} highlight={maxSpeed > 60} />
            <StatCard label={t.finishSpeed} value={`${finishSpeed.toFixed(0)} км/ч`} highlight={finishSpeed > 40} />
            <StatCard label={t.safetyFactor} value={currentSafetyFactor.toFixed(1)} highlight={currentSafetyFactor < 3} isDanger={currentSafetyFactor < 3} />
          </div>

          <div ref={containerRef} className="bg-white border border-brand-dark/10 rounded-lg shadow-sm relative overflow-hidden flex flex-col flex-grow min-h-[600px]">
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              <span className="text-[9px] font-bold uppercase bg-brand-dark text-white px-1.5 py-0.5 rounded w-fit">{t.profileView}</span>
            </div>
            <svg ref={chartRef} className="w-full h-full" />
          </div>

          <footer className="flex flex-col sm:flex-row justify-between items-center gap-4 py-2">
            <div className="flex items-center gap-6">
              <button onClick={() => setLang(lang === 'ru' ? 'en' : 'ru')} className="flex items-center gap-2 border border-brand-dark/20 px-2 py-1 text-[9px] font-bold uppercase hover:bg-brand-blue hover:text-white transition-colors bg-white">
                <Globe size={10} /> {lang === 'ru' ? 'English' : 'Русский'}
              </button>
              <div className="hidden sm:flex items-center gap-4">
                <p className="text-[9px] font-bold uppercase opacity-40">{t.safetyWarning}</p>
                <p className="text-[10px] italic serif opacity-60">"{t.warning}"</p>
              </div>
            </div>
            <div className="text-center sm:text-right font-mono text-[8px] opacity-30 leading-tight">
              {t.title} | ROPE: {selectedCable.name}
              <div className="mt-1 font-bold text-brand-blue">NORWAY PARK Стройотдел</div>
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
      {label && <label className="text-[10px] font-bold uppercase opacity-50">{label}</label>}
      <div className="flex items-center gap-1">
        <input type="number" value={value} step={step} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-white border border-brand-dark/20 px-1.5 py-1 text-[13px] font-mono focus:outline-none focus:ring-1 focus:ring-brand-blue" />
        <span className="text-[10px] font-bold opacity-40">{unit}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, badge, isDanger }: { label: string, value: string, highlight?: boolean, badge?: string, isDanger?: boolean }) {
  return (
    <div className={`border-b border-brand-dark/10 pb-1 relative ${highlight ? (isDanger ? 'border-red-600' : 'border-brand-blue') : ''}`}>
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-bold uppercase opacity-40 mb-0.5">{label}</p>
        {badge && <span className="text-[8px] font-bold uppercase bg-brand-lime text-white px-1 rounded-sm">{badge}</span>}
      </div>
      <p className={`text-lg font-mono tracking-tighter ${highlight ? (isDanger ? 'text-red-600 font-bold' : 'text-brand-blue') : ''}`}>{value}</p>
    </div>
  );
}
