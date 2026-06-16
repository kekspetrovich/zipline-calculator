import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { 
  Settings, Users, Ruler, ArrowDown, Info, Globe, Compass, 
  Wind, Shield, ShieldCheck, ShieldAlert, Thermometer, Gauge, HelpCircle, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  simulateZipline, calculateOptimalTension, calculateAirDensity,
  ROPE_DATABASE, Point, ZiplineInput, ZiplineResults 
} from './utils/physics';

type Language = 'ru' | 'en';

const IMG_1xK43 = "data:image/webp;base64,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";
const IMG_1x37 = "data:image/webp;base64,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";
const IMG_1x19 = "data:image/webp;base64,UklGRr4FAABXRUJQVlA4ILIFAACQHACdASpQAFAAPrFKnEmnJKKhMLdtUOAWCWkAFIh9s/6Do1IKrqL7zRAvEbUC9Z7p2AD8q/tX6ycgmkC0APEnzs/UX/p9wj+Z/2frXftv7OzhSJMu5VvGVtRXzKDqiOIuZypC7XZ8qkPlNl8Gy0TtkJFYOP2LcKWbT5Qx+COiaYWVw8AXWI/relgTdhtfABo01NqJhTXvFIleeu9SxtnjDMKegv4k1TLxPNQCG3Xy01RWJHiqeJj9lm8L8n9/pzXSi+x0rY9gonnFiOI8G47i7fOg/ycVipAz+u7GKKcUUQIP+rMgr5CFHJNa/sAA/v8SAkPqf7m4hv7B3yFw7OskN33X1/9o4ZcvC1/7W2wPu74lDGxBs1dTocxhduMg2ar0Zf2aj+URmHLOoRw/lHwpLL/UlT8RgzchY75ltabknnsN1EiNoALtk4Ky5ZOAkI/wGSz2eUus/mUGCUGp6HKOzx3kS6FUItAhQe0xBEVjJOPIEyvTU4/rmpNp8vRyzM8/Dn4JV21yUqCLn95LV8r7TQTVXfW09BEd4V4mMPxDSLEgSiK9eSfvl3dqQbmCMpHBey9Pl94hLnBl34lQmfPvG+y1+tK545x6J14uIJM4BZzN6uwJSTWkIzfh+gMo3jh/8oyf6dlXR3359jjmtmF825Db6W2f2jvFlIzP5/UEBgGajSOTGlueLENoSCX9I2UvWRU60npjI1eCQdOe/2OZphhlGpS8n83MlsNouU6kRxvLp31U5ByvVtr2CyKrNnAJcvObL/DzAtPPaK7dtQUKlFNF7po1mYYeAGp4ocYyC/+9417nxyV0Z9OTe7sIZJO86jmmwb+VLmQ9/q0CNisqCUZQUU06FWAL/GC3j6WXWilcsWCiBSJfeDC9BAPtgjyLL1jZgK4mQqm2a6p9MDY8PAeBTX/kh9et6Z29ZC0ftL3qv9eYZjpV2NOVBefc/cA/HoGR59rx0bO1/7ipb8WvKjT6g6G1nV1qt/ocS8tU5ghkkPniEJwCPwYVoiLxkrbMVmGvmrTHeIINpuCLXjzCpI97qqj0uNed1LB9+yHe+FEouX2XtAOdXfm1oAAvQiz2nNAYem2pTrnxkV7M4T8nFcyWBitz/EeAz35OnSXfgXziob4olGTT9OfIgQKWJ67JQUTw1DVa+wZpzyFvZY4smk352Qzh36k+jaB0uuFieLfGxLcPoOnm91m80sGrBS3rVty1vkk3JTVUVyJO0gzaECbVsYFu+93RkUHv3yfxHLOlx9SUY2S6wFc04KfGTHojCpd8ectKTTU6csLFPZGl2EtB4saWId3xZzlAbni5H01KsdtPLbvomfyW5U6ks4WdBrmtlrn1XWFjlCknjMmQ8IXWvj94AGuXmy/7ZAPGkwFnZGrlEMVLqq/zOjJmmrnBnMM2rdJSKmamDfDDztPz7dJ+vmFmKtuqxCZQiD24h7czGe6Fw1WddtUyqzgJrF+AtUWvTMRPESW4vjwpYNHUK9kx+GvnYX9lsQaeKv27e+kF/lJMxvnFsJn7gLOpg9Yc3VUCVv6MiRHX26uTj9l4IGp8SE+k8hr8K97pwoCf5U969Wq8jOba81HFsXAbrAoE8VUa97bEEO9IyHuM5LmZyhgEDutWmG45C8E8YYg3jmfluMglcvL3oxXZ+0kwOzDS57V6R2gLcYeikAtYTVf0pSJlQ6T782peFDjQw5rWDIp42H7nnxUofwSQqMv92XxXOqxLDJRPt77ZcY67UmMkn61urykiC4Vt5dHTVIZCvAz50rqVKT1Z+mFLHBKOVAA5wM+XDiiVi+ipg7ABIN0mE6rSJsBvxf9NWzsMADY5gxVF6dbXCP/S1ArmsDTDzt1jnp5w73V/tDBRrMOD/8e/8r5+cATlAXmujHiZSq3NU29rOCe/xt79xf7hdvK+7lex4b2xwZpZPsAeUmBcos4AAAA=";

const DRAG_SCENARIOS = [
  { id: 'superman', area: 0.15, cd: 0.5, nameEn: 'Superman', nameRu: 'Супермен' },
  { id: 'sitting', area: 0.50, cd: 1.0, nameEn: 'Sitting', nameRu: 'Сидя' },
  { id: 'star', area: 0.90, cd: 1.2, nameEn: 'Star', nameRu: 'Звезда' },
];

const translations = {
  ru: {
    title: 'Калькулятор Зиплайна Pro',
    subtitle: 'Высокоточный Физический Движок v2.0',
    geometry: 'Геометрия и профиль',
    startHeight: 'Высота старта',
    span: 'Длина пролета',
    dropPercent: 'Уклон',
    endHeight: 'Высота финиша',
    totalDrop: 'Перепад высот',
    cableLength: 'Длина троса',
    maxSag: 'Макс. провис',
    speed: 'Скорость',
    maxSpeed: 'Макс. скорость',
    finishSpeed: 'Скорость на финише',
    avgSpeed: 'Средняя скорость',
    travelTime: 'Время спуска',
    safetyFactor: 'Запас прочности',
    anchorReactions: 'Нагрузки на опоры',
    startAnchor: 'Опора СТАРТ',
    endAnchor: 'Опора ФИНИШ',
    horiz: 'Гор.',
    vert: 'Верт.',
    cableType: 'Выбор каната',
    ropeDia: 'Диаметр каната',
    layType: 'Тип свивки',
    grade: 'Маркировочная группа',
    massPerM: 'Масса 1 м',
    breakingLoad: 'Разрывное усилие',
    custom: 'Другой трос',
    customSub: 'ручной ввод',
    tension: 'Натяжение',
    autoTension: 'Авто-натяжение',
    targetSag: 'Целевой провис',
    pulleySection: 'Блок и ролики',
    sheave1: 'Шкив 1',
    sheave2: 'Шкив 2',
    bearingEff: 'КПД подшипников',
    sheaveMat: 'Материал роликов',
    steel: 'Сталь',
    polyacetal: 'Полиацеталь',
    riderSection: 'Посетитель',
    riderMass: 'Масса тела',
    dragCd: 'Коэффициент Cd',
    dragArea: 'Лобовое сечение',
    atmoSection: 'Атмосфера',
    altitude: 'Высота н.у.м.',
    temperature: 'Температура',
    humidity: 'Влажность',
    windSection: 'Параметры ветра',
    windSpeed: 'Скорость ветра',
    windDir: 'Направление',
    noWind: 'Без ветра',
    withWind: 'С ветром',
    brakingTitle: 'Тормозной путь (ASTM F2291 / EN 15567)',
    comfortG: 'Комфортное торможение (1.5G)',
    recommendedG: 'Рекомендуемый предел (2.5G)',
    maxG: 'Максимум ASTM (6.0G)',
    warning: 'Всегда консультируйтесь с сертифицированным инженером перед монтажом. Проект строительного отдела Norway Park.',
    exportSvg: 'Экспорт SVG отчета',
    m: 'м',
    mm: 'мм',
    kg: 'кг',
    kgm: 'кг/м',
    kn: 'кН',
    ms: 'м/с',
    kmh: 'км/ч',
    sec: 'сек',
    linesToggle: 'Отображение линий',
    showUnloaded: 'Канат без нагрузки',
    showFeetLine: 'Канат под нагрузкой',
    showSafetyLine: 'Линия безопасности',
    safetyMargin: 'Зазор безопасности',
    pose: 'Поза (CdA)',
    weightChart: 'Зависимость от массы',
    airDensity: 'Плотность воздуха',
    profileView: 'Профиль трассы',
  },
  en: {
    title: 'Zipline Calculator Pro',
    subtitle: 'High-Fidelity Physics Engine v2.0',
    geometry: 'Geometry & Profile',
    startHeight: 'Start Height',
    span: 'Span Length',
    dropPercent: 'Gradient',
    endHeight: 'End Height',
    totalDrop: 'Total Drop',
    cableLength: 'Cable Length',
    maxSag: 'Max Sag',
    speed: 'Speed',
    maxSpeed: 'Max Speed',
    finishSpeed: 'Finish Speed',
    avgSpeed: 'Average Speed',
    travelTime: 'Travel Time',
    safetyFactor: 'Safety Factor',
    anchorReactions: 'Anchor Reactions',
    startAnchor: 'START Anchor',
    endAnchor: 'END Anchor',
    horiz: 'Horiz',
    vert: 'Vert',
    cableType: 'Cable Selection',
    ropeDia: 'Cable Diameter',
    layType: 'Lay Type',
    grade: 'Grade / Strength',
    massPerM: 'Mass per meter',
    breakingLoad: 'Breaking Load',
    custom: 'Custom Cable',
    customSub: 'manual input',
    tension: 'Tension',
    autoTension: 'Auto-tension',
    targetSag: 'Target Sag',
    pulleySection: 'Trolley & Sheaves',
    sheave1: 'Sheave 1',
    sheave2: 'Sheave 2',
    bearingEff: 'Bearing Efficiency',
    sheaveMat: 'Sheave Material',
    steel: 'Steel',
    polyacetal: 'Polyacetal',
    riderSection: 'Rider Parameters',
    riderMass: 'Rider Mass',
    dragCd: 'Cd Coeff',
    dragArea: 'Frontal Area',
    atmoSection: 'Atmosphere',
    altitude: 'Altitude ASL',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSection: 'Wind Vector',
    windSpeed: 'Wind Speed',
    windDir: 'Direction',
    noWind: 'No Wind',
    withWind: 'With Wind',
    brakingTitle: 'Braking Distance (ASTM F2291 / EN 15567)',
    comfortG: 'Comfort Decel (1.5G)',
    recommendedG: 'Recommended Limit (2.5G)',
    maxG: 'ASTM Max Limit (6.0G)',
    warning: 'Always verify calculations with a certified engineer. Norway Park engineering project.',
    exportSvg: 'Export SVG Report',
    m: 'm',
    mm: 'mm',
    kg: 'kg',
    kgm: 'kg/m',
    kn: 'kN',
    ms: 'm/s',
    kmh: 'km/h',
    sec: 'sec',
    linesToggle: 'Lines Visibility',
    showUnloaded: 'Unloaded Profile',
    showFeetLine: 'Loaded Profile',
    showSafetyLine: 'Safety Line',
    safetyMargin: 'Safety Clearance',
    pose: 'Rider Pose (CdA)',
    weightChart: 'Mass Profiles',
    airDensity: 'Air Density',
    profileView: 'Cable Profile',
  },
  de: {
    title: 'Zipline-Rechner Pro',
    subtitle: 'Präzisions-Physik-Engine v2.0',
    geometry: 'Geometrie & Profil',
    startHeight: 'Starthöhe',
    span: 'Spannweite',
    dropPercent: 'Gefälle',
    endHeight: 'Zielhöhe',
    totalDrop: 'Höhenunterschied',
    cableLength: 'Seillänge',
    maxSag: 'Max. Durchhang',
    speed: 'Geschwindigkeit',
    maxSpeed: 'Höchstgeschw.',
    finishSpeed: 'Endgeschw.',
    avgSpeed: 'Durchschnittsgeschw.',
    travelTime: 'Fahrzeit',
    safetyFactor: 'Sicherheitsfaktor',
    anchorReactions: 'Ankerlasten',
    startAnchor: 'Anker START',
    endAnchor: 'Anker ZIEL',
    horiz: 'Horiz',
    vert: 'Vert',
    cableType: 'Seilauswahl',
    ropeDia: 'Seildurchmesser',
    layType: 'Schlagart',
    grade: 'Festigkeitsklasse',
    massPerM: 'Gewicht pro Meter',
    breakingLoad: 'Bruchkraft',
    custom: 'Anderes Seil',
    customSub: 'manuelle Eingabe',
    tension: 'Vorspannung',
    autoTension: 'Auto-Spannung',
    targetSag: 'Ziel-Durchhang',
    pulleySection: 'Rollen & Scheiben',
    sheave1: 'Scheibe 1',
    sheave2: 'Scheibe 2',
    bearingEff: 'Lagerwirkungsgrad',
    sheaveMat: 'Scheibenmaterial',
    steel: 'Stahl',
    polyacetal: 'Polyacetal',
    riderSection: 'Besucherdaten',
    riderMass: 'Besuchermasse',
    dragCd: 'Cd-Wert',
    dragArea: 'Stirnfläche',
    atmoSection: 'Atmosphäre',
    altitude: 'Höhe ü.M.',
    temperature: 'Temperatur',
    humidity: 'Luftfeuchtigkeit',
    windSection: 'Windvektor',
    windSpeed: 'Windgeschw.',
    windDir: 'Richtung',
    noWind: 'Ohne Wind',
    withWind: 'Mit Wind',
    brakingTitle: 'Bremsweg (ASTM F2291 / EN 15567)',
    comfortG: 'Komfort (1.5G)',
    recommendedG: 'Empfohlen (2.5G)',
    maxG: 'ASTM Max (6.0G)',
    warning: 'Vor der Installation immer einen zertifizierten Ingenieur konsultieren. Norwegen Park Engineering.',
    exportSvg: 'SVG-Bericht exportieren',
    m: 'm',
    mm: 'mm',
    kg: 'kg',
    kgm: 'kg/m',
    kn: 'kN',
    ms: 'm/s',
    kmh: 'km/h',
    sec: 'Sek',
    linesToggle: 'Linienanzeige',
    showUnloaded: 'Unbelastetes Profil',
    showFeetLine: 'Belastetes Profil',
    showSafetyLine: 'Sicherheitslinie',
    safetyMargin: 'Sicherheitsabstand',
    pose: 'Körperhaltung (CdA)',
    weightChart: 'Massenprofile',
    airDensity: 'Luftdichte',
    profileView: 'Seilprofil',
  },
  fr: {
    title: 'Calculateur de Tyrolienne Pro',
    subtitle: 'Moteur Physique de Haute Précision v2.0',
    geometry: 'Géométrie & Profil',
    startHeight: 'Hauteur de départ',
    span: 'Longueur du câble',
    dropPercent: 'Pente',
    endHeight: "Hauteur d'arrivée",
    totalDrop: 'Dénivelé total',
    cableLength: 'Longueur du câble',
    maxSag: 'Flèche max',
    speed: 'Vitesse',
    maxSpeed: 'Vitesse max',
    finishSpeed: 'Vitesse finale',
    avgSpeed: 'Vitesse moyenne',
    travelTime: 'Temps de trajet',
    safetyFactor: 'Facteur de sécurité',
    anchorReactions: 'Charges aux ancrages',
    startAnchor: 'Ancrage DÉPART',
    endAnchor: 'Ancrage ARRIVÉE',
    horiz: 'Horiz',
    vert: 'Vert',
    cableType: 'Choix du câble',
    ropeDia: 'Diamètre du câble',
    layType: 'Type de câblage',
    grade: 'Grade / Résistance',
    massPerM: 'Masse par mètre',
    breakingLoad: 'Charge de rupture',
    custom: 'Câble personnalisé',
    customSub: 'saisie manuelle',
    tension: 'Tension',
    autoTension: 'Auto-tension',
    targetSag: 'Flèche cible',
    pulleySection: 'Poulie & Réas',
    sheave1: 'Réa 1',
    sheave2: 'Réa 2',
    bearingEff: 'Rendement roulement',
    sheaveMat: 'Matériau réa',
    steel: 'Acier',
    polyacetal: 'Polyacétal',
    riderSection: 'Paramètres du passager',
    riderMass: 'Masse du passager',
    dragCd: 'Coeff Cd',
    dragArea: 'Surface frontale',
    atmoSection: 'Atmosphère',
    altitude: 'Altitude',
    temperature: 'Température',
    humidity: 'Humidité',
    windSection: 'Vecteur vent',
    windSpeed: 'Vitesse du vent',
    windDir: 'Direction',
    noWind: 'Sans vent',
    withWind: 'Avec vent',
    brakingTitle: 'Distance de freinage (ASTM F2291 / EN 15567)',
    comfortG: 'Confort (1.5G)',
    recommendedG: 'Limite recommandée (2.5G)',
    maxG: 'Max ASTM (6.0G)',
    warning: 'Consultez toujours un ingénieur certifié avant l\'installation. Projet d\'ingénierie Norway Park.',
    exportSvg: 'Exporter le rapport SVG',
    m: 'm',
    mm: 'mm',
    kg: 'kg',
    kgm: 'kg/m',
    kn: 'kN',
    ms: 'm/s',
    kmh: 'km/h',
    sec: 'sec',
    linesToggle: 'Visibilité des lignes',
    showUnloaded: 'Profil non chargé',
    showFeetLine: 'Profil chargé',
    showSafetyLine: 'Ligne de sécurité',
    safetyMargin: 'Marge de sécurité',
    pose: 'Position (CdA)',
    weightChart: 'Profils de masse',
    airDensity: 'Densité de l\'air',
    profileView: 'Profil du câble',
  }
};

const APP_VERSION = "2.1.0";

export default function App() {
  const [lang, setLang] = useState<Language>('ru');
  const t = translations[lang];

  // Tab selections
  const [activeInputTab, setActiveInputTab] = useState<'geo' | 'pulley' | 'wind' | 'display'>('geo');
  const [activeChartTab, setActiveChartTab] = useState<'profile' | 'speed' | 'mass'>('profile');

  // Input states
  const [startHeight, setStartHeight] = useState(15);
  const [span, setSpan] = useState(100);
  const [dropPercent, setDropPercent] = useState(4);
  const endHeight = startHeight - (span * dropPercent) / 100;

  // Cable states
  const [ropeType, setRopeType] = useState<string>('1xK43');
  const [ropeDiameter, setRopeDiameter] = useState<number>(12);
  const [customWeight, setCustomWeight] = useState<number>(0.86);
  const [customBreaking, setCustomBreaking] = useState<number>(156);
  const [customDiameter, setCustomDiameter] = useState<number>(12);

  // Tension states
  const [autoTension, setAutoTension] = useState(true);
  const [targetSagRatio, setTargetSagRatio] = useState(2);
  const [tensionKg, setTensionKg] = useState(800);

  // Trolley & Sheaves
  const [sheaveDiameter1, setSheaveDiameter1] = useState(60);
  const [sheaveDiameter2, setSheaveDiameter2] = useState(60);
  const [sheaveMaterial, setSheaveMaterial] = useState<'steel' | 'polyacetal'>('polyacetal');
  const [bearingEfficiency, setBearingEfficiency] = useState(95);

  // Rider states
  const [riderMass, setRiderMass] = useState(80);
  const [dragCd, setDragCd] = useState(1.0);
  const [dragArea, setDragArea] = useState(0.5);
  const [posePreset, setPosePreset] = useState<string>('sitting');

  // Atmosphere states
  const [altitude, setAltitude] = useState(100);
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(50);

  // Wind states
  const [windSpeed, setWindSpeed] = useState(0);
  const [windDirection, setWindDirection] = useState(180); // 180 = headwind, 0 = tailwind
  const [draggingWind, setDraggingWind] = useState(false);

  // Interaction
  const [loadPosition, setLoadPosition] = useState(0.5); // 0 to 1
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Lines toggles
  const [showUnloaded, setShowUnloaded] = useState(true);
  const [showFeetLine, setShowFeetLine] = useState(true);
  const [showSafetyLine, setShowSafetyLine] = useState(true);
  const [safetyMargin, setSafetyMargin] = useState(1.5);

  // Compass interaction
  const compassRef = useRef<SVGSVGElement>(null);

  // Derive rope parameters
  const ropeParams = useMemo(() => {
    if (ropeType === 'custom') {
      return {
        name: t.custom,
        construction: '1×19',
        layType: 'Custom',
        grade: 'Custom',
        weight: customWeight,
        breaking: customBreaking,
        diameter: customDiameter
      };
    }
    const db = ROPE_DATABASE[ropeType];
    const d = db.diameters[ropeDiameter];
    return {
      name: db.name,
      construction: db.construction,
      layType: db.layType,
      grade: db.grade,
      weight: d.weight,
      breaking: d.breaking,
      diameter: ropeDiameter
    };
  }, [ropeType, ropeDiameter, customWeight, customBreaking, customDiameter, t]);

  // Air density derived
  const airDensity = useMemo(() => {
    return calculateAirDensity(altitude, temperature, humidity);
  }, [altitude, temperature, humidity]);

  // Auto-tension effect
  useEffect(() => {
    if (autoTension) {
      const optimal = calculateOptimalTension(span, ropeParams.weight, targetSagRatio / 100, riderMass);
      setTensionKg(Math.round(optimal));
    }
  }, [autoTension, span, ropeParams.weight, targetSagRatio, riderMass]);

  // Zipline calculations results
  const results: ZiplineResults = useMemo(() => {
    const input: ZiplineInput = {
      span,
      hStart: startHeight,
      hEnd: endHeight,
      tensionKg,
      ropeWeight: ropeParams.weight,
      ropeDiameter: ropeParams.diameter,
      ropeBreakingLoadKn: ropeParams.breaking,
      sheaveDiameter1,
      sheaveDiameter2,
      bearingEfficiency: bearingEfficiency / 100,
      sheaveMaterial,
      riderMass,
      dragCd,
      dragArea,
      altitude,
      temperature,
      humidity,
      windSpeed,
      windDirection,
      loadPositionX: loadPosition * span
    };
    return simulateZipline(input);
  }, [
    span, startHeight, endHeight, tensionKg, ropeParams,
    sheaveDiameter1, sheaveDiameter2, bearingEfficiency, sheaveMaterial,
    riderMass, dragCd, dragArea, altitude, temperature, humidity,
    windSpeed, windDirection, loadPosition
  ]);

  // Preset changer
  const handlePoseChange = (presetId: string) => {
    setPosePreset(presetId);
    const preset = DRAG_SCENARIOS.find(p => p.id === presetId);
    if (preset) {
      setDragCd(preset.cd);
      setDragArea(preset.area);
    }
  };

  // Compass mouse helper
  const handleCompassMove = (clientX: number, clientY: number) => {
    if (!compassRef.current) return;
    const rect = compassRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    // Convert to 0-360 starting from top (North) clockwise
    angle = (angle + 90 + 360) % 360;
    setWindDirection(Math.round(angle));
  };

  const handleCompassMouseDown = (e: React.MouseEvent) => {
    setDraggingWind(true);
    handleCompassMove(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggingWind(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingWind) {
        handleCompassMove(e.clientX, e.clientY);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [draggingWind]);

  // Synchronised vertical guide x coordinate calculation
  const synchronisedX = hoverX !== null ? hoverX : loadPosition * span;

  // Chart layout dimensions
  const chartW = 700;
  const chartH = 320;
  const padding = { top: 40, right: 30, bottom: 40, left: 50 };

  // Profile Chart rendering variables
  const minY = useMemo(() => {
    const values = [
      ...results.points.map(p => p.y),
      ...results.unloadedPoints.map(p => p.y),
      ...results.travelProfile.map(p => p.y - safetyMargin)
    ];
    const absoluteMin = Math.min(...values, 0);
    return absoluteMin > 5 ? absoluteMin - 4 : Math.max(-10, absoluteMin - 2);
  }, [results, safetyMargin]);

  const maxY = Math.max(startHeight, endHeight) + 4;

  const xScale = d3.scaleLinear().domain([0, span]).range([padding.left, chartW - padding.right]);
  const yScale = d3.scaleLinear().domain([minY, maxY]).range([chartH - padding.bottom, padding.top]);

  const profileLineGen = d3.line<Point>().x(d => xScale(d.x)).y(d => yScale(d.y)).curve(d3.curveMonotoneX);

  const pathLoaded = profileLineGen(results.points);
  const pathUnloaded = profileLineGen(results.unloadedPoints);
  const pathFeet = profileLineGen(results.travelProfile);
  const pathSafety = profileLineGen(results.travelProfile.map(p => ({ x: p.x, y: p.y - safetyMargin })));

  // Profile mouse dragging helper
  const handleProfileMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const xVal = xScale.invert(mx);
    const boundedX = Math.max(0, Math.min(span, xVal));
    setHoverX(boundedX);
    setLoadPosition(boundedX / span);
  };

  const handleProfileMouseLeave = () => {
    setHoverX(null);
  };

  // Speed charts logic
  const maxVkmh = useMemo(() => {
    const values = [
      ...results.travelProfile.map(p => (p.v || 0) * 3.6),
      ...results.ptsNW.map(p => (p.v || 0) * 3.6)
    ];
    return Math.ceil(Math.max(...values, 10) / 10) * 10;
  }, [results]);

  const ySpeedScale = d3.scaleLinear().domain([0, maxVkmh]).range([chartH - padding.bottom, padding.top]);
  const speedLineGen = d3.line<Point>().x(d => xScale(d.x)).y(d => ySpeedScale((d.v || 0) * 3.6)).curve(d3.curveMonotoneX);

  const speedWithWindPath = speedLineGen(results.travelProfile);
  const speedNoWindPath = speedLineGen(results.ptsNW);

  // Mass charts logic
  const maxMassVkmh = useMemo(() => {
    const values = [
      ...results.ptsW40.map(p => (p.v || 0) * 3.6),
      ...results.ptsW120.map(p => (p.v || 0) * 3.6),
      ...results.travelProfile.map(p => (p.v || 0) * 3.6)
    ];
    return Math.ceil(Math.max(...values, 10) / 10) * 10;
  }, [results]);

  const yMassSpeedScale = d3.scaleLinear().domain([0, maxMassVkmh]).range([chartH - padding.bottom, padding.top]);
  const massLineGen = d3.line<Point>().x(d => xScale(d.x)).y(d => yMassSpeedScale((d.v || 0) * 3.6)).curve(d3.curveMonotoneX);

  const mass40Path = massLineGen(results.ptsW40);
  const massUserPath = massLineGen(results.travelProfile);
  const mass120Path = massLineGen(results.ptsW120);

  // Braking calculations
  const brakeDistances = useMemo(() => {
    const gVal = 9.81;
    const vF40 = results.ptsW40[results.ptsW40.length - 1].v || 0;
    const vFU = results.finishSpeed;
    const vF120 = results.ptsW120[results.ptsW120.length - 1].v || 0;

    const calcD = (v: number, gLim: number) => v > 0.05 ? (v * v) / (2 * gLim * gVal) : 0;

    return {
      w40: { v: vF40, d15: calcD(vF40, 1.5), d25: calcD(vF40, 2.5), d60: calcD(vF40, 6.0) },
      wUser: { v: vFU, d15: calcD(vFU, 1.5), d25: calcD(vFU, 2.5), d60: calcD(vFU, 6.0) },
      w120: { v: vF120, d15: calcD(vF120, 1.5), d25: calcD(vF120, 2.5), d60: calcD(vF120, 6.0) }
    };
  }, [results]);

  // Export report as SVG
  const handleExportSvg = () => {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('width', '800');
    svgEl.setAttribute('height', '1000');
    svgEl.setAttribute('viewBox', '0 0 800 1000');
    svgEl.style.backgroundColor = '#FFFFFF';

    // SVG Header
    const titleG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    titleG.setAttribute('transform', 'translate(40, 60)');
    
    const titleT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleT.setAttribute('font-family', 'Roboto, sans-serif');
    titleT.setAttribute('font-size', '24px');
    titleT.setAttribute('font-weight', 'bold');
    titleT.setAttribute('fill', '#1A9ADA');
    titleT.textContent = t.title.toUpperCase();
    titleG.appendChild(titleT);

    const subtitleT = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    subtitleT.setAttribute('x', '0');
    subtitleT.setAttribute('y', '25');
    subtitleT.setAttribute('font-family', 'monospace');
    subtitleT.setAttribute('font-size', '12px');
    subtitleT.setAttribute('fill', '#999');
    subtitleT.textContent = t.subtitle;
    titleG.appendChild(subtitleT);
    svgEl.appendChild(titleG);

    // Text metadata rows
    const dataG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    dataG.setAttribute('transform', 'translate(40, 140)');
    dataG.setAttribute('font-family', 'monospace');
    dataG.setAttribute('font-size', '13px');

    const lines = [
      `--- ${t.geometry.toUpperCase()} ---`,
      `${t.span}: ${span}${t.m} | ${t.dropPercent}: ${dropPercent}% | ${t.cableLength}: ${results.cableLength.toFixed(1)}${t.m}`,
      `${t.startHeight}: ${startHeight}${t.m} | ${t.endHeight}: ${endHeight.toFixed(1)}${t.m}`,
      `--- ${t.cableType.toUpperCase()} ---`,
      `Model: ${ropeParams.name} (${ropeParams.diameter}${t.mm}) | weight: ${ropeParams.weight}${t.kgm}`,
      `breaking load: ${ropeParams.breaking}${t.kn} | safety factor: ${results.safetyFactor.toFixed(1)}`,
      `--- ${t.riderSection.toUpperCase()} ---`,
      `weight: ${riderMass}${t.kg} | CdA: ${dragArea.toFixed(2)}${t.m2} | pose: ${posePreset}`,
      `--- ${t.windSection.toUpperCase()} ---`,
      `wind speed: ${windSpeed}${t.ms} | angle: ${windDirection}°`,
      `--- ${t.speed.toUpperCase()} ---`,
      `max speed: ${(results.maxSpeed * 3.6).toFixed(1)} ${t.kmh} | finish speed: ${(results.finishSpeed * 3.6).toFixed(1)} ${t.kmh}`,
      `travel time: ${results.totalTime.toFixed(1)} ${t.sec}`,
      `-----------------------------------------`,
      `Report generated by Norway Park Engineering Tool`,
      `Date: ${new Date().toLocaleString()}`
    ];

    lines.forEach((line, i) => {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', (i * 24).toString());
      text.setAttribute('fill', line.startsWith('---') ? '#1A9ADA' : '#323332');
      text.setAttribute('font-weight', line.startsWith('---') ? 'bold' : 'normal');
      text.textContent = line;
      dataG.appendChild(text);
    });

    svgEl.appendChild(dataG);

    // Draw profile line
    const drawingG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    drawingG.setAttribute('transform', 'translate(40, 560)');
    
    // Background box
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', '720');
    rect.setAttribute('height', '300');
    rect.setAttribute('fill', '#FCFCFA');
    rect.setAttribute('stroke', '#E0E0DC');
    drawingG.appendChild(rect);

    // Scale mapping for SVG export (simple coordinates mapping)
    const exportX = (x: number) => 50 + (x / span) * 620;
    const exportY = (y: number) => 250 - ((y - minY) / (maxY - minY)) * 200;

    // Cable path
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const pD = results.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${exportX(p.x)},${exportY(p.y)}`).join(' ');
    path.setAttribute('d', pD);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#1A9ADA');
    path.setAttribute('stroke-width', '4');
    drawingG.appendChild(path);

    // Unloaded cable path
    const uPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const uPD = results.unloadedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${exportX(p.x)},${exportY(p.y)}`).join(' ');
    uPath.setAttribute('d', uPD);
    uPath.setAttribute('fill', 'none');
    uPath.setAttribute('stroke', '#1A9ADA');
    uPath.setAttribute('stroke-width', '1');
    uPath.setAttribute('opacity', '0.5');
    drawingG.appendChild(uPath);

    // Anchors
    const startC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startC.setAttribute('cx', exportX(0).toString());
    startC.setAttribute('cy', exportY(startHeight).toString());
    startC.setAttribute('r', '6');
    startC.setAttribute('fill', '#323332');
    drawingG.appendChild(startC);

    const endC = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    endC.setAttribute('cx', exportX(span).toString());
    endC.setAttribute('cy', exportY(endHeight).toString());
    endC.setAttribute('r', '6');
    endC.setAttribute('fill', '#323332');
    drawingG.appendChild(endC);

    svgEl.appendChild(drawingG);

    // Serialize and download
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svgEl);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zipline_calculation_report_${span}m.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      {/* Top Header */}
      <header className="bg-slate-900 text-white py-4 px-6 shadow-md shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-tight text-brand-blue flex items-center gap-2">
              <Gauge className="text-brand-blue" /> {t.title}
            </h1>
            <p className="text-[10px] font-mono text-slate-400 tracking-wider uppercase mt-0.5">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex bg-slate-800 p-0.5 rounded border border-slate-700">
              {(['ru', 'en', 'de', 'fr'] as const).map((l) => (
                <button 
                  key={l}
                  onClick={() => setLang(l)} 
                  className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors ${lang === l ? 'bg-brand-blue text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Export SVG */}
            <button 
              onClick={handleExportSvg}
              className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue/90 text-white px-4 py-1.5 rounded text-xs font-bold font-mono transition-colors shadow-sm"
            >
              <Download size={14} /> {t.exportSvg}
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Input Panels (Tabs) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Tab Selection */}
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm shrink-0">
            <button 
              onClick={() => setActiveInputTab('geo')}
              className={`flex-1 flex justify-center items-center gap-1 py-2 rounded text-xs font-bold tracking-tight transition-colors ${activeInputTab === 'geo' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Settings size={14} /> {lang === 'ru' ? 'Трасса' : 'Geometry'}
            </button>
            <button 
              onClick={() => setActiveInputTab('pulley')}
              className={`flex-1 flex justify-center items-center gap-1 py-2 rounded text-xs font-bold tracking-tight transition-colors ${activeInputTab === 'pulley' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Users size={14} /> {lang === 'ru' ? 'Ролики' : 'Trolley'}
            </button>
            <button 
              onClick={() => setActiveInputTab('wind')}
              className={`flex-1 flex justify-center items-center gap-1 py-2 rounded text-xs font-bold tracking-tight transition-colors ${activeInputTab === 'wind' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Compass size={14} /> {lang === 'ru' ? 'Ветер' : 'Wind'}
            </button>
            <button 
              onClick={() => setActiveInputTab('display')}
              className={`flex-1 flex justify-center items-center gap-1 py-2 rounded text-xs font-bold tracking-tight transition-colors ${activeInputTab === 'display' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Ruler size={14} /> {lang === 'ru' ? 'Линии' : 'Clearance'}
            </button>
          </div>

          {/* Tab Content Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm min-h-[460px]">
            <AnimatePresence mode="wait">
              {activeInputTab === 'geo' && (
                <motion.div 
                  key="geo"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.geometry}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label={t.startHeight} value={startHeight} onChange={setStartHeight} unit="m" />
                    <InputGroup label={t.span} value={span} onChange={setSpan} unit="m" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label={t.dropPercent} value={dropPercent} onChange={(v) => setDropPercent(Math.max(0, v))} unit="%" step={0.5} />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t.endHeight}</label>
                      <div className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 font-mono text-sm font-semibold">{endHeight.toFixed(1)}{t.m}</div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.cableType}</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {Object.keys(ROPE_DATABASE).map(k => {
                        const active = ropeType === k;
                        const db = ROPE_DATABASE[k];
                        const img = k === '1xK43' ? IMG_1xK43 : (k === '1x37' ? IMG_1x37 : IMG_1x19);
                        return (
                          <button 
                            key={k} 
                            onClick={() => setRopeType(k)} 
                            className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-colors ${active ? 'border-brand-blue bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                          >
                            <img src={img} alt={db.name} className="w-12 h-12 object-contain rounded opacity-90" />
                            <span className="text-[10px] font-bold font-mono text-slate-800 mt-1.5">{db.name}</span>
                            <span className="text-[8px] font-mono text-slate-400">{db.construction}</span>
                          </button>
                        );
                      })}
                      <button 
                        onClick={() => setRopeType('custom')} 
                        className={`flex flex-col items-center justify-center p-2 border rounded-lg transition-colors ${ropeType === 'custom' ? 'border-brand-blue bg-blue-50/50' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <div className="w-12 h-12 flex items-center justify-center text-xl text-slate-400 border border-dashed border-slate-300 rounded-full bg-slate-50">+</div>
                        <span className="text-[10px] font-bold font-mono text-slate-800 mt-1.5">{t.custom}</span>
                        <span className="text-[8px] font-mono text-slate-400">{t.customSub}</span>
                      </button>
                    </div>

                    {ropeType !== 'custom' ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">{t.ropeDia}</label>
                          <select 
                            value={ropeDiameter} 
                            onChange={e => setRopeDiameter(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue"
                          >
                            {[12, 14, 16, 18].map(d => <option key={d} value={d}>{d} {t.mm}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase">{t.layType}</span><span className="font-semibold text-slate-700 leading-tight mt-0.5">{ropeParams.layType}</span></div>
                          <div className="flex flex-col"><span className="text-[9px] text-slate-400 uppercase">{t.grade}</span><span className="font-semibold text-slate-700 leading-tight mt-0.5">{ropeParams.grade}</span></div>
                          <div className="flex flex-col mt-2"><span className="text-[9px] text-slate-400 uppercase">{t.massPerM}</span><span className="font-semibold text-slate-700 leading-tight mt-0.5">{ropeParams.weight} {t.kgm}</span></div>
                          <div className="flex flex-col mt-2"><span className="text-[9px] text-slate-400 uppercase">{t.breakingLoad}</span><span className="font-semibold text-slate-700 leading-tight mt-0.5">{ropeParams.breaking} {t.kn}</span></div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <InputGroup label={t.ropeDia} value={customDiameter} onChange={setCustomDiameter} unit="mm" />
                          <InputGroup label={t.massPerM} value={customWeight} onChange={setCustomWeight} unit="kg/m" step={0.01} />
                          <InputGroup label={t.breakingLoad} value={customBreaking} onChange={setCustomBreaking} unit="kN" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.tension}</h3>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={autoTension} 
                          onChange={e => setAutoTension(e.target.checked)}
                          className="accent-brand-blue rounded scale-100"
                        />
                        {t.autoTension}
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputGroup 
                        label={t.tension} 
                        value={tensionKg} 
                        onChange={(v) => { setTensionKg(v); setAutoTension(false); }} 
                        unit="кг" 
                        step={10} 
                      />
                      <InputGroup 
                        label={t.targetSag} 
                        value={targetSagRatio} 
                        onChange={setTargetSagRatio} 
                        unit="%" 
                        step={0.5} 
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeInputTab === 'pulley' && (
                <motion.div 
                  key="pulley"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.pulleySection}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label={t.sheave1} value={sheaveDiameter1} onChange={setSheaveDiameter1} unit="mm" />
                    <InputGroup label={t.sheave2} value={sheaveDiameter2} onChange={setSheaveDiameter2} unit="mm" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <InputGroup label={t.bearingEff} value={bearingEfficiency} onChange={setBearingEfficiency} unit="%" />
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{t.sheaveMat}</label>
                      <select 
                        value={sheaveMaterial} 
                        onChange={e => setSheaveMaterial(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue"
                      >
                        <option value="polyacetal">{t.polyacetal}</option>
                        <option value="steel">{t.steel}</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.riderSection}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <InputGroup label={t.riderMass} value={riderMass} onChange={setRiderMass} unit="кг" />
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t.pose}</label>
                        <select 
                          value={posePreset}
                          onChange={e => handlePoseChange(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue"
                        >
                          {DRAG_SCENARIOS.map(ds => (
                            <option key={ds.id} value={ds.id}>{lang === 'ru' ? ds.nameRu : ds.nameEn}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InputGroup label={t.dragCd} value={dragCd} onChange={setDragCd} unit="" step={0.1} />
                      <InputGroup label={t.dragArea} value={dragArea} onChange={setDragArea} unit="m²" step={0.05} />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeInputTab === 'wind' && (
                <motion.div 
                  key="wind"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.windSection}</h3>
                  
                  <div className="flex flex-col sm:flex-row gap-6 items-center justify-center py-2 bg-slate-50 rounded-lg border border-slate-100">
                    {/* Compass Dial */}
                    <div className="relative w-[180px] h-[180px] select-none">
                      <svg 
                        ref={compassRef} 
                        viewBox="0 0 180 180" 
                        onMouseDown={handleCompassMouseDown}
                        className="w-full h-full cursor-crosshair"
                      >
                        <circle cx="90" cy="90" r="80" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
                        <circle cx="90" cy="90" r="70" fill="none" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="3,3" />
                        
                        {/* Compass labels */}
                        <text x="90" y="24" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">N</text>
                        <text x="90" y="166" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">S</text>
                        <text x="24" y="94" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">W</text>
                        <text x="166" y="94" textAnchor="middle" fill="#94A3B8" fontSize="10" fontWeight="bold">E</text>

                        {/* Zipline Track direction marker (from Start Left to Finish Right) */}
                        <line x1="30" y1="90" x2="150" y2="90" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5,3" />
                        <path d="M148,86 L156,90 L148,94 Z" fill="#CBD5E1" />
                        <text x="140" y="80" fontSize="8" fill="#94A3B8" fontWeight="bold">ZIPLINE</text>

                        {/* Wind Direction Arrow */}
                        <g transform={`translate(90,90) rotate(${windDirection})`}>
                          <line x1="0" y1="-65" x2="0" y2="60" stroke="#1A9ADA" strokeWidth="3" />
                          <path d="M-6,-55 L0,-72 L6,-55 Z" fill="#1A9ADA" />
                          <circle cx="0" cy="0" r="6" fill="#1A9ADA" stroke="#FFFFFF" strokeWidth="2" />
                        </g>
                      </svg>
                      
                      {/* Interactive Angle HUD inside compass center */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none bg-slate-900/90 text-white font-mono text-[10px] px-1.5 py-0.5 rounded shadow">
                        {windDirection}°
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 w-full px-4 sm:px-0">
                      <InputGroup label={t.windSpeed} value={windSpeed} onChange={setWindSpeed} unit="м/с" step={1} />
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{t.windDir} (°)</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="360" 
                          value={windDirection}
                          onChange={e => setWindDirection(Number(e.target.value))}
                          className="w-full accent-brand-blue" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.atmoSection}</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <InputGroup label={t.altitude} value={altitude} onChange={setAltitude} unit="м" />
                      <InputGroup label={t.temperature} value={temperature} onChange={setTemperature} unit="°C" />
                      <InputGroup label={t.humidity} value={humidity} onChange={setHumidity} unit="%" />
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono bg-slate-50 p-2.5 rounded border border-slate-100">
                      <span className="text-slate-500">{t.airDensity}:</span>
                      <span className="font-bold text-slate-800">{airDensity} кг/м³</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeInputTab === 'display' && (
                <motion.div 
                  key="display"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.linesToggle}</h3>
                  
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showUnloaded} 
                        onChange={e => setShowUnloaded(e.target.checked)}
                        className="accent-brand-blue rounded scale-110"
                      />
                      {t.showUnloaded}
                    </label>
                    
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showFeetLine} 
                        onChange={e => setShowFeetLine(e.target.checked)}
                        className="accent-brand-blue rounded scale-110"
                      />
                      {t.showFeetLine}
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={showSafetyLine} 
                        onChange={e => setShowSafetyLine(e.target.checked)}
                        className="accent-brand-blue rounded scale-110"
                      />
                      {t.showSafetyLine}
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <InputGroup label={t.safetyMargin} value={safetyMargin} onChange={setSafetyMargin} unit="m" step={0.1} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN: Output Stats, Tabs & Visualizations */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Key Stat Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
            <StatCard label={t.endHeight} value={`${endHeight.toFixed(1)} ${t.m}`} />
            <StatCard label={t.cableLength} value={`${results.cableLength.toFixed(1)} ${t.m}`} />
            <StatCard 
              label={t.maxSpeed} 
              value={`${(results.maxSpeed * 3.6).toFixed(1)} ${t.kmh}`} 
              highlight={results.maxSpeed * 3.6 > 60} 
            />
            <StatCard 
              label={t.finishSpeed} 
              value={`${(results.finishSpeed * 3.6).toFixed(1)} ${t.kmh}`} 
              highlight={results.finishSpeed * 3.6 > 6}
              isDanger={results.finishSpeed * 3.6 > 12}
            />
            <StatCard 
              label={t.safetyFactor} 
              value={results.safetyFactor.toFixed(1)} 
              highlight={results.safetyFactor < 3} 
              isDanger={results.safetyFactor < 2.5} 
            />
          </div>

          {/* Safety Status Message */}
          {(() => {
            const fv = results.finishSpeed * 3.6;
            const stopped = results.travelProfile[results.travelProfile.length - 1].stopped;
            
            let status: { bg: string, border: string, text: string, icon: any, msg: string };
            
            if (stopped) {
              status = { 
                bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600', 
                icon: <ShieldAlert size={18} />, 
                msg: lang === 'ru' ? 'Посетитель останавливается на трассе. Требуется система эвакуации.' : 
                     lang === 'de' ? 'Besucher stoppt auf der Strecke. Evakuierungssystem erforderlich.' :
                     lang === 'fr' ? "Le passager s'arrête sur le parcours. Système d'évacuation requis." :
                     'Rider stops on course. Evacuation system required.'
              };
            } else if (fv <= 6) {
              status = { 
                bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', 
                icon: <ShieldCheck size={18} />, 
                msg: lang === 'ru' ? `Безопасная скорость финиша (${fv.toFixed(1)} км/ч). Соответствует EN 15567-1 (≤ 6 км/ч).` : 
                     lang === 'de' ? `Sichere Endgeschwindigkeit (${fv.toFixed(1)} km/h). Entspricht EN 15567-1 (≤ 6 km/h).` :
                     lang === 'fr' ? `Vitesse finale sécurisée (${fv.toFixed(1)} km/h). Conforme à EN 15567-1 (≤ 6 km/h).` :
                     `Safe finish speed (${fv.toFixed(1)} km/h). Complies with EN 15567-1 (≤ 6 km/h).`
              };
            } else if (fv <= 12) {
              status = { 
                bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', 
                icon: <ShieldAlert size={18} />, 
                msg: lang === 'ru' ? `Внимание! Скорость финиша (${fv.toFixed(1)} км/ч) выше нормы для пассивного торможения. Требуется активная тормозная система.` : 
                     lang === 'de' ? `Achtung! Endgeschwindigkeit (${fv.toFixed(1)} km/h) über dem Limit für passives Bremsen. Aktives Bremssystem erforderlich.` :
                     lang === 'fr' ? `Attention! Vitesse finale (${fv.toFixed(1)} km/h) supérieure à la limite de freinage passif. Système de freinage actif requis.` :
                     `Warning! Finish speed (${fv.toFixed(1)} km/h) exceeds passive braking limit. Active braking system required.`
              };
            } else {
              status = { 
                bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', 
                icon: <ShieldAlert size={18} />, 
                msg: lang === 'ru' ? `ОПАСНО! Скорость финиша (${fv.toFixed(1)} км/ч) значительно превышает безопасный предел. Необходима надежная тормозная система.` : 
                     lang === 'de' ? `GEFÄHRLICH! Endgeschwindigkeit (${fv.toFixed(1)} km/h) weit über dem Sicherheitslimit. Zuverlässiges Bremssystem notwendig.` :
                     lang === 'fr' ? `DANGEREUX! Vitesse finale (${fv.toFixed(1)} km/h) bien au-delà de la limite de sécurité. Système de freinage fiable nécessaire.` :
                     `DANGEROUS! Finish speed (${fv.toFixed(1)} km/h) well beyond safety limit. Reliable braking system required.`
              };
            }

            return (
              <div className={`${status.bg} ${status.border} ${status.text} border rounded-xl p-4 flex gap-3 items-start shadow-sm`}>
                <div className="shrink-0 mt-0.5">{status.icon}</div>
                <p className="text-xs font-bold leading-relaxed">{status.msg}</p>
              </div>
            );
          })()}

          {/* Charts tab section */}
          <div className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2">
              <button 
                onClick={() => setActiveChartTab('profile')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-colors ${activeChartTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                {t.profileView}
              </button>
              <button 
                onClick={() => setActiveChartTab('speed')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-colors ${activeChartTab === 'speed' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                {t.speed}
              </button>
              <button 
                onClick={() => setActiveChartTab('mass')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-colors ${activeChartTab === 'mass' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-200/50'}`}
              >
                {t.weightChart}
              </button>
            </div>

            <div className="p-4 relative min-h-[360px] flex justify-center items-center">
              {/* Tab 1: Profile view */}
              {activeChartTab === 'profile' && (
                <svg 
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  onMouseMove={handleProfileMouseMove}
                  onMouseLeave={handleProfileMouseLeave}
                  className="w-full h-auto select-none cursor-crosshair"
                >
                  {/* Grid Lines */}
                  {xScale.ticks(10).map(v => (
                    <line key={v} x1={xScale(v)} y1={padding.top} x2={xScale(v)} y2={chartH - padding.bottom} stroke="#F1F5F9" strokeWidth="1" />
                  ))}
                  {yScale.ticks(6).map(v => (
                    <line key={v} x1={padding.left} y1={yScale(v)} x2={chartW - padding.right} y2={yScale(v)} stroke="#F1F5F9" strokeWidth="1" />
                  ))}

                  {/* Ground Level Line */}
                  <line 
                    x1={padding.left} 
                    y1={yScale(0)} 
                    x2={chartW - padding.right} 
                    y2={yScale(0)} 
                    stroke="#475569" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />
                  <text x={chartW - padding.right - 10} y={yScale(0) - 6} fill="#94A3B8" fontSize="8" fontWeight="bold">GROUND LEVEL</text>

                  {/* Loaded cable curve with speed-based coloring */}
                  {results.points.length > 1 && results.points.map((p, i) => {
                    if (i === 0) return null;
                    const prev = results.points[i - 1];
                    const midX = (p.x + prev.x) / 2;
                    // Find speed at this midX from travelProfile
                    const speedP = results.travelProfile.reduce((prev, curr) => Math.abs(curr.x - midX) < Math.abs(prev.x - midX) ? curr : prev);
                    const speed = (speedP.v || 0);
                    const maxV = results.maxSpeed || 0.1;
                    const fr = speed / maxV;
                    const hue = Math.round((1 - fr) * 240); // 240 (blue) to 0 (red)
                    const color = `hsl(${hue}, 85%, 50%)`;

                    return (
                      <line 
                        key={i}
                        x1={xScale(prev.x)} 
                        y1={yScale(prev.y)} 
                        x2={xScale(p.x)} 
                        y2={yScale(p.y)} 
                        stroke={color} 
                        strokeWidth="3" 
                        strokeLinecap="round"
                      />
                    );
                  })}
                  
                  {/* Unloaded cable curve */}
                  {showUnloaded && pathUnloaded && <path d={pathUnloaded} fill="none" stroke="#1A9ADA" strokeWidth="1" opacity="0.4" />}
                  
                  {/* Loaded traveler envelope */}
                  {showFeetLine && pathFeet && <path d={pathFeet} fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6" />}
                  
                  {/* Safety boundary */}
                  {showSafetyLine && pathSafety && <path d={pathSafety} fill="none" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.6" />}

                  {/* Start/Finish Anchor dots */}
                  <circle cx={xScale(0)} cy={yScale(startHeight)} r="5" fill="#1E293B" />
                  <text x={xScale(0) - 8} y={yScale(startHeight) - 8} fontSize="9" fontWeight="bold" fill="#1E293B" textAnchor="end">{startHeight.toFixed(0)}m</text>

                  <circle cx={xScale(span)} cy={yScale(endHeight)} r="5" fill="#1E293B" />
                  <text x={xScale(span) + 8} y={yScale(endHeight) - 8} fontSize="9" fontWeight="bold" fill="#1E293B" textAnchor="start">{endHeight.toFixed(1)}m</text>

                  {/* Draggable Rider indicator */}
                  {(() => {
                    const riderX = loadPosition * span;
                    // Find corresponding Y coordinate from results.points
                    const pt = results.points.reduce((prev, curr) => Math.abs(curr.x - riderX) < Math.abs(prev.x - riderX) ? curr : prev);
                    return (
                      <g transform={`translate(${xScale(pt.x)}, ${yScale(pt.y)})`}>
                        <circle cx="0" cy="0" r="14" fill="#1A9ADA" fillOpacity="0.15" />
                        <circle cx="0" cy="0" r="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
                      </g>
                    );
                  })()}

                  {/* Curser HUD display */}
                  {hoverX !== null && (() => {
                    const hoverP = results.points.reduce((prev, curr) => Math.abs(curr.x - hoverX) < Math.abs(prev.x - hoverX) ? curr : prev);
                    const speedP = results.travelProfile.reduce((prev, curr) => Math.abs(curr.x - hoverX) < Math.abs(prev.x - hoverX) ? curr : prev);
                    
                    return (
                      <g>
                        {/* Guide line */}
                        <line x1={xScale(hoverX)} y1={padding.top} x2={xScale(hoverX)} y2={chartH - padding.bottom} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />
                        
                        {/* Speed badge */}
                        <rect x={xScale(hoverX) - 40} y={padding.top - 24} width="80" height="18" rx="3" fill="#1E293B" />
                        <text x={xScale(hoverX)} y={padding.top - 12} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          {((speedP.v || 0) * 3.6).toFixed(1)} km/h
                        </text>
                        
                        {/* Height indicator */}
                        <circle cx={xScale(hoverX)} cy={yScale(hoverP.y)} r="4" fill="#1A9ADA" stroke="#FFFFFF" strokeWidth="1.5" />
                        <text x={xScale(hoverX) + 8} y={yScale(hoverP.y) + 3} fill="#1E293B" fontSize="9" fontWeight="bold" fontFamily="monospace">
                          {hoverP.y.toFixed(1)}m
                        </text>

                        {/* Position badge on axis */}
                        <rect x={xScale(hoverX) - 20} y={chartH - padding.bottom + 4} width="40" height="14" rx="2" fill="#64748B" />
                        <text x={xScale(hoverX)} y={chartH - padding.bottom + 14} textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          {hoverX.toFixed(0)}m
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axes */}
                  <line x1={padding.left} y1={chartH - padding.bottom} x2={chartW - padding.right} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  {yScale.ticks(6).map(v => (
                    <text key={v} x={padding.left - 8} y={yScale(v) + 3} textAnchor="end" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}
                  {/* X Axis Labels */}
                  {xScale.ticks(10).map(v => (
                    <text key={v} x={xScale(v)} y={chartH - padding.bottom + 14} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}
                </svg>
              )}

              {/* Tab 2: Speed comparison chart */}
              {activeChartTab === 'speed' && (
                <svg 
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  onMouseMove={handleProfileMouseMove}
                  onMouseLeave={handleProfileMouseLeave}
                  className="w-full h-auto select-none cursor-crosshair"
                >
                  {/* Grid Lines */}
                  {xScale.ticks(10).map(v => (
                    <line key={v} x1={xScale(v)} y1={padding.top} x2={xScale(v)} y2={chartH - padding.bottom} stroke="#F1F5F9" strokeWidth="1" />
                  ))}
                  {ySpeedScale.ticks(5).map(v => (
                    <line key={v} x1={padding.left} y1={ySpeedScale(v)} x2={chartW - padding.right} y2={ySpeedScale(v)} stroke="#F1F5F9" strokeWidth="1" />
                  ))}

                  {/* Speed curves */}
                  {speedIdealPath && <path d={speedIdealPath} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />}
                  {speedAeroPath && <path d={speedAeroPath} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.8" />}
                  {speedNoWindPath && <path d={speedNoWindPath} fill="none" stroke="#334155" strokeWidth="2.5" />}
                  {speedWithWindPath && <path d={speedWithWindPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" />}

                  {/* Vertical synchronised cursor */}
                  <line x1={xScale(synchronisedX)} y1={padding.top} x2={xScale(synchronisedX)} y2={chartH - padding.bottom} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Hover dots and tooltips */}
                  {(() => {
                    const pW = results.travelProfile.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    const pNW = results.ptsNW.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    const pA = results.ptsAero.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    const pI = results.ptsIdeal.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    
                    return (
                      <g>
                        <circle cx={xScale(synchronisedX)} cy={ySpeedScale((pNW.v || 0) * 3.6)} r="4" fill="#334155" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx={xScale(synchronisedX)} cy={ySpeedScale((pW.v || 0) * 3.6)} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                        
                        <rect x={xScale(synchronisedX) + 8} y={ySpeedScale((pW.v || 0) * 3.6) - 18} width="160" height="40" rx="3" fill="#1E293B" />
                        <text x={xScale(synchronisedX) + 14} y={ySpeedScale((pW.v || 0) * 3.6) - 2} fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          WIND: {((pW.v || 0) * 3.6).toFixed(1)} {t.kmh} | NO: {((pNW.v || 0) * 3.6).toFixed(1)}
                        </text>
                        <text x={xScale(synchronisedX) + 14} y={ySpeedScale((pW.v || 0) * 3.6) + 10} fill="#94A3B8" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          AERO: {((pA.v || 0) * 3.6).toFixed(1)} | IDEAL: {((pI.v || 0) * 3.6).toFixed(1)}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axes */}
                  <line x1={padding.left} y1={chartH - padding.bottom} x2={chartW - padding.right} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  {ySpeedScale.ticks(5).map(v => (
                    <text key={v} x={padding.left - 8} y={ySpeedScale(v) + 3} textAnchor="end" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}
                  {/* X Axis Labels */}
                  {xScale.ticks(10).map(v => (
                    <text key={v} x={xScale(v)} y={chartH - padding.bottom + 14} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}

                  {/* Chart Legend */}
                  <g transform={`translate(${padding.left + 20}, ${padding.top + 10})`}>
                    <line x1="0" y1="5" x2="15" y2="5" stroke="#3B82F6" strokeWidth="3" />
                    <text x="20" y="8" fill="#475569" fontSize="9" fontWeight="bold">{t.withWind}</text>
                    
                    <line x1="100" y1="5" x2="115" y2="5" stroke="#334155" strokeWidth="3" />
                    <text x="120" y="8" fill="#475569" fontSize="9" fontWeight="bold">{t.noWind}</text>

                    <line x1="200" y1="5" x2="215" y2="5" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="2,2" />
                    <text x="220" y="8" fill="#475569" fontSize="9" fontWeight="bold">AERO</text>

                    <line x1="280" y1="5" x2="295" y2="5" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x="300" y="8" fill="#475569" fontSize="9" fontWeight="bold">IDEAL</text>
                  </g>
                </svg>
              )}

              {/* Tab 3: Mass Profiles */}
              {activeChartTab === 'mass' && (
                <svg 
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  onMouseMove={handleProfileMouseMove}
                  onMouseLeave={handleProfileMouseLeave}
                  className="w-full h-auto select-none cursor-crosshair"
                >
                  {/* Grid Lines */}
                  {xScale.ticks(10).map(v => (
                    <line key={v} x1={xScale(v)} y1={padding.top} x2={xScale(v)} y2={chartH - padding.bottom} stroke="#F1F5F9" strokeWidth="1" />
                  ))}
                  {yMassSpeedScale.ticks(5).map(v => (
                    <line key={v} x1={padding.left} y1={yMassSpeedScale(v)} x2={chartW - padding.right} y2={yMassSpeedScale(v)} stroke="#F1F5F9" strokeWidth="1" />
                  ))}

                  {/* Speed curves */}
                  {mass40Path && <path d={mass40Path} fill="none" stroke="#10B981" strokeWidth="2.5" />}
                  {massUserPath && <path d={massUserPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" />}
                  {mass120Path && <path d={mass120Path} fill="none" stroke="#EF4444" strokeWidth="2.5" />}

                  {/* Vertical synchronised cursor */}
                  <line x1={xScale(synchronisedX)} y1={padding.top} x2={xScale(synchronisedX)} y2={chartH - padding.bottom} stroke="#94A3B8" strokeWidth="1" strokeDasharray="3,3" />

                  {/* Hover dots and tooltips */}
                  {(() => {
                    const p40 = results.ptsW40.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    const pUser = results.travelProfile.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    const p120 = results.ptsW120.reduce((prev, curr) => Math.abs(curr.x - synchronisedX) < Math.abs(prev.x - synchronisedX) ? curr : prev);
                    return (
                      <g>
                        <circle cx={xScale(synchronisedX)} cy={yMassSpeedScale((p40.v || 0) * 3.6)} r="4" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx={xScale(synchronisedX)} cy={yMassSpeedScale((pUser.v || 0) * 3.6)} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
                        <circle cx={xScale(synchronisedX)} cy={yMassSpeedScale((p120.v || 0) * 3.6)} r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                        
                        <rect x={xScale(synchronisedX) + 8} y={yMassSpeedScale((pUser.v || 0) * 3.6) - 18} width="160" height="26" rx="3" fill="#1E293B" />
                        <text x={xScale(synchronisedX) + 14} y={yMassSpeedScale((pUser.v || 0) * 3.6) - 2} fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
                          40kg: {((p40.v || 0) * 3.6).toFixed(0)} | User: {((pUser.v || 0) * 3.6).toFixed(0)} | 120kg: {((p120.v || 0) * 3.6).toFixed(0)}
                        </text>
                      </g>
                    );
                  })()}

                  {/* Axes */}
                  <line x1={padding.left} y1={chartH - padding.bottom} x2={chartW - padding.right} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />
                  <line x1={padding.left} y1={padding.top} x2={padding.left} y2={chartH - padding.bottom} stroke="#CBD5E1" strokeWidth="1.5" />

                  {/* Y Axis Labels */}
                  {yMassSpeedScale.ticks(5).map(v => (
                    <text key={v} x={padding.left - 8} y={yMassSpeedScale(v) + 3} textAnchor="end" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}
                  {/* X Axis Labels */}
                  {xScale.ticks(10).map(v => (
                    <text key={v} x={xScale(v)} y={chartH - padding.bottom + 14} textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold" fontFamily="monospace">{v}</text>
                  ))}

                  {/* Chart Legend */}
                  <g transform={`translate(${padding.left + 20}, ${padding.top + 10})`}>
                    <line x1="0" y1="5" x2="15" y2="5" stroke="#10B981" strokeWidth="3" />
                    <text x="20" y="8" fill="#475569" fontSize="9" fontWeight="bold">40 {t.kg}</text>
                    
                    <line x1="90" y1="5" x2="105" y2="5" stroke="#3B82F6" strokeWidth="3" />
                    <text x="110" y="8" fill="#475569" fontSize="9" fontWeight="bold">{riderMass} {t.kg}</text>

                    <line x1="180" y1="5" x2="195" y2="5" stroke="#EF4444" strokeWidth="3" />
                    <text x="200" y="8" fill="#475569" fontSize="9" fontWeight="bold">120 {t.kg}</text>
                  </g>
                </svg>
              )}
            </div>
          </div>

          {/* Bottom Grid: Braking Distance & Anchor Loads */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 shrink-0">
            
            {/* Braking Distances Section */}
            <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Shield className="text-brand-blue" size={14} /> {t.brakingTitle}
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400">
                      <th className="py-2 font-medium">{lang === 'ru' ? 'Режим замедления' : 'Deceleration limit'}</th>
                      <th className="py-2 text-center font-medium">40 {t.kg} ({(brakeDistances.w40.v * 3.6).toFixed(0)} {t.kmh})</th>
                      <th className="py-2 text-center font-medium">{riderMass} {t.kg} ({(brakeDistances.wUser.v * 3.6).toFixed(0)} {t.kmh})</th>
                      <th className="py-2 text-center font-medium">120 {t.kg} ({(brakeDistances.w120.v * 3.6).toFixed(0)} {t.kmh})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-700">
                    <tr>
                      <td className="py-3 text-emerald-600 font-semibold">{t.comfortG}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w40.d15.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold text-slate-900">{brakeDistances.wUser.d15.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w120.d15.toFixed(1)}</span>{t.m}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-amber-600 font-semibold">{t.recommendedG}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w40.d25.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold text-slate-900">{brakeDistances.wUser.d25.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w120.d25.toFixed(1)}</span>{t.m}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-rose-600 font-semibold">{t.maxG}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w40.d60.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold text-slate-900">{brakeDistances.wUser.d60.toFixed(1)}</span>{t.m}</td>
                      <td className="py-3 text-center"><span className="text-sm font-bold">{brakeDistances.w120.d60.toFixed(1)}</span>{t.m}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Progress bars visual G-force indicators for the user's weight */}
              <div className="mt-6 space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase">{lang === 'ru' ? 'Зоны торможения для твоего веса' : 'Braking zones for selected rider weight'}</h4>
                
                {(() => {
                  const maxD = Math.max(brakeDistances.wUser.d15, 2);
                  const pct = (d: number) => (d / maxD) * 100;
                  return (
                    <div className="space-y-2.5">
                      <div className="relative h-5 bg-slate-100 rounded overflow-hidden border border-slate-200">
                        {/* Green 1.5G */}
                        <div style={{ width: `${pct(brakeDistances.wUser.d15)}%` }} className="absolute left-0 top-0 h-full bg-emerald-100" />
                        {/* Orange 2.5G */}
                        <div style={{ width: `${pct(brakeDistances.wUser.d25)}%` }} className="absolute left-0 top-0 h-full bg-amber-100" />
                        {/* Red 6G */}
                        <div style={{ width: `${pct(brakeDistances.wUser.d60)}%` }} className="absolute left-0 top-0 h-full bg-rose-200" />

                        {/* Labels overlay */}
                        {brakeDistances.wUser.d60 > 0.1 && (
                          <div style={{ left: `${pct(brakeDistances.wUser.d60)}%` }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-rose-800">
                            {brakeDistances.wUser.d60.toFixed(1)}m
                          </div>
                        )}
                        {brakeDistances.wUser.d25 > 0.1 && (
                          <div style={{ left: `${pct(brakeDistances.wUser.d25)}%` }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-800">
                            {brakeDistances.wUser.d25.toFixed(1)}m
                          </div>
                        )}
                        {brakeDistances.wUser.d15 > 0.1 && (
                          <div style={{ left: `${pct(brakeDistances.wUser.d15)}%` }} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-emerald-800">
                            {brakeDistances.wUser.d15.toFixed(1)}m
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-4 text-[9px] font-mono text-slate-400 justify-end">
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-200 rounded-sm" />6G (ASTM)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 rounded-sm" />2.5G (EN)</span>
                        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 rounded-sm" />1.5G (Comfort)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Anchor Reactions Reactions */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <ShieldCheck className="text-brand-blue" size={14} /> {t.anchorReactions}
                </h2>
                
                <div className="space-y-4 font-mono">
                  {/* Start Anchor */}
                  <div className="border-b border-slate-100 pb-2.5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">{t.startAnchor}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">{t.horiz}</span>
                        <p className="font-bold text-slate-700">{results.reactions.start.horizontal.toFixed(0)} кг</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">{t.vert}</span>
                        <p className="font-bold text-slate-700">{results.reactions.start.vertical.toFixed(0)} кг</p>
                      </div>
                    </div>
                  </div>

                  {/* End Anchor */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1.5">{t.endAnchor}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">{t.horiz}</span>
                        <p className="font-bold text-slate-700">{results.reactions.end.horizontal.toFixed(0)} кг</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase">{t.vert}</span>
                        <p className="font-bold text-slate-700">{results.reactions.end.vertical.toFixed(0)} кг</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety warning */}
              <div className="mt-6 border-t border-slate-100 pt-3 flex gap-2 items-start text-[9px] text-slate-400 italic">
                <Info size={14} className="shrink-0 text-slate-400 mt-0.5" />
                <p>{t.warning}</p>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

function InputGroup({ label, value, onChange, unit, step = 1 }: any) {
  return (
    <div className="space-y-1">
      {label && <label className="text-[10px] font-bold text-slate-500 uppercase">{label}</label>}
      <div className="flex items-center gap-1.5">
        <input 
          type="number" 
          value={value} 
          step={step} 
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)} 
          className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand-blue" 
        />
        {unit && <span className="text-[10px] font-mono font-bold text-slate-400">{unit}</span>}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, isDanger }: { label: string, value: string, highlight?: boolean, isDanger?: boolean }) {
  return (
    <div className={`bg-white border rounded-xl p-4 shadow-sm flex flex-col justify-between ${highlight ? (isDanger ? 'border-red-500 bg-red-50/20' : 'border-brand-blue bg-blue-50/10') : 'border-slate-200'}`}>
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <p className={`text-xl font-bold font-mono tracking-tight mt-1.5 ${highlight ? (isDanger ? 'text-red-600' : 'text-brand-blue') : 'text-slate-800'}`}>
        {value}
      </p>
    </div>
  );
}
