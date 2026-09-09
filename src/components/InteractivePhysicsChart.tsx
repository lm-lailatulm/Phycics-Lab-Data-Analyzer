import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, RotateCcw, AlertCircle } from 'lucide-react';

interface Point {
  x: number;
  y: number;
  label?: string;
}

interface ChartCurve {
  type: 'linear' | 'hyperbolic' | 'sinusoidal' | 'none';
  slope?: number;
  intercept?: number;
  coefficient?: number; // y = coeff / x
  omega?: number;       // y = amp * cos(omega * x), velocity = -amp * omega * sin(omega * x)
  amplitude?: number;
}

interface InteractivePhysicsChartProps {
  points: Point[];
  curve?: ChartCurve;
  points2?: Point[];
  curve2?: ChartCurve;
  legend1?: string;
  legend2?: string;
  xLabel: string;
  yLabel: string;
  xUnit?: string;
  yUnit?: string;
  title: string;
  subtitle?: string;
  presetXMin?: number;
  presetXMax?: number;
  presetYMin?: number;
  presetYMax?: number;
}

export default function InteractivePhysicsChart({
  points,
  curve = { type: 'none' },
  points2,
  curve2,
  legend1,
  legend2,
  xLabel,
  yLabel,
  xUnit = '',
  yUnit = '',
  title,
  subtitle,
  presetXMin,
  presetXMax,
  presetYMin,
  presetYMax,
}: InteractivePhysicsChartProps) {
  // Zoom & Pan states
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0); // fraction of span (-1 to 1)
  const [panY, setPanY] = useState<number>(0);

  // Drag states for manual panning
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Hovered point coordinates
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    label?: string;
    index?: number;
    seriesIndex?: number;
    cx: number;
    cy: number;
    isCurveValue?: boolean;
    curveLabel?: string;
  } | null>(null);

  // Default width and height of the SVG viewport coordinate system
  const width = 500;
  const height = 300;
  const padding = 55;

  // Zoom bounds
  const maxZoom = 15;
  const minZoom = 0.5;

  // Calculate coordinates bounds based on data points
  const baseBounds = useMemo(() => {
    // Determine raw minimums and maximums
    let xMin = presetXMin !== undefined ? presetXMin : 0;
    let xMax = presetXMax !== undefined ? presetXMax : 10;
    let yMin = presetYMin !== undefined ? presetYMin : 0;
    let yMax = presetYMax !== undefined ? presetYMax : 10;

    const allX = [...points.map(p => p.x)];
    const allY = [...points.map(p => p.y)];

    if (points2) {
      allX.push(...points2.map(p => p.x));
      allY.push(...points2.map(p => p.y));
    }

    const xValues = allX.filter(x => isFinite(x));
    const yValues = allY.filter(y => isFinite(y));

    // For sinusoidal curve, time series range is typically 0 to 5s, amplitude is +/- max
    if (curve.type === 'sinusoidal' && curve.amplitude && curve.omega) {
      xMin = 0;
      xMax = 5.0; // 5 seconds default
      const amp = curve.amplitude;
      const velAmp = amp * curve.omega;
      const extMax = Math.max(amp, velAmp) * 1.25;
      yMin = -extMax;
      yMax = extMax;
    } else if (xValues.length > 0) {
      const xMinPoints = Math.min(...xValues);
      const xMaxPoints = Math.max(...xValues);
      const yMinPoints = Math.min(...yValues);
      const yMaxPoints = Math.max(...yValues);

      const xSpan = xMaxPoints - xMinPoints || 1;
      const ySpan = yMaxPoints - yMinPoints || 1;

      // Add 20% breathing space
      xMin = presetXMin !== undefined ? presetXMin : Math.max(0, xMinPoints - xSpan * 0.15);
      xMax = presetXMax !== undefined ? presetXMax : xMaxPoints + xSpan * 0.15;
      yMin = presetYMin !== undefined ? presetYMin : Math.max(0, yMinPoints - ySpan * 0.15);
      yMax = presetYMax !== undefined ? presetYMax : yMaxPoints + ySpan * 0.15;
    }

    return { xMin, xMax, yMin, yMax };
  }, [points, points2, curve, presetXMin, presetXMax, presetYMin, presetYMax]);

  // Adjust bounds dynamically using active Zoom and Pan equations
  const activeDomain = useMemo(() => {
    const { xMin, xMax, yMin, yMax } = baseBounds;
    const xSpan = xMax - xMin;
    const ySpan = yMax - yMin;

    // Shift viewport center based on user panning
    const xCenter = xMin + xSpan * 0.5 + panX * xSpan;
    const yCenter = yMin + ySpan * 0.5 + panY * ySpan;

    // Compute zoomed range spans
    const zoomedXSpan = xSpan / zoom;
    const zoomedYSpan = ySpan / zoom;

    return {
      xMin: xCenter - zoomedXSpan * 0.5,
      xMax: xCenter + zoomedXSpan * 0.5,
      yMin: yCenter - zoomedYSpan * 0.5,
      yMax: yCenter + zoomedYSpan * 0.5,
    };
  }, [baseBounds, zoom, panX, panY]);

  // Map coordinate values to SVG pixels
  const xScale = (coordX: number) => {
    const { xMin, xMax } = activeDomain;
    const pct = (coordX - xMin) / (xMax - xMin);
    return padding + pct * (width - 2 * padding);
  };

  const yScale = (coordY: number) => {
    const { yMin, yMax } = activeDomain;
    const pct = (coordY - yMin) / (yMax - yMin);
    // In SVG, 0 is at top, so mirror the y coordinate
    return height - padding - pct * (height - 2 * padding);
  };

  // Map pixels back to coordinates
  const pixelToCoord = (px: number, py: number) => {
    const { xMin, xMax, yMin, yMax } = activeDomain;
    
    const xPct = (px - padding) / (width - 2 * padding);
    const yPct = (height - padding - py) / (height - 2 * padding);

    return {
      x: xMin + xPct * (xMax - xMin),
      y: yMin + yPct * (yMax - yMin),
    };
  };

  // Zoom manipulation handlers
  const handleZoom = (factor: number) => {
    setZoom(z => Math.max(minZoom, Math.min(maxZoom, z * factor)));
  };

  const resetZoomAndPan = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setHoveredPoint(null);
  };

  // Pan action triggered by mouse dragging
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    setIsDragging(true);
    
    // Get cursor position in SVG coordinates
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    dragStart.current = {
      x,
      y,
      panX,
      panY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!svgRef.current) return;
    
    // 1. If dragging, perform pan transition
    if (isDragging) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const dx = x - dragStart.current.x;
      const dy = y - dragStart.current.y;

      // Sensitivity maps to container scale
      const deltaPanX = (-dx / (width - 2 * padding)) / zoom;
      const deltaPanY = (dy / (height - 2 * padding)) / zoom;

      setPanX(dragStart.current.panX + deltaPanX);
      setPanY(dragStart.current.panY + deltaPanY);
      return;
    }

    // 2. Otherwise, check for hovering close to curve (for continuous coordinate tracking)
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert pixel position to model coordinates
    const curCoord = pixelToCoord(clientX, clientY);

    // Keep hover only if within boundaries
    if (clientX < padding || clientX > width - padding || clientY < padding || clientY > height - padding) {
      setHoveredPoint(null);
      return;
    }

    // Check if we are close to any defined data points
    let foundPoint = false;
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (!isFinite(p.x) || !isFinite(p.y)) continue;
      const cx = xScale(p.x);
      const cy = yScale(p.y);
      const dist = Math.sqrt((cx - clientX) ** 2 + (cy - clientY) ** 2);
      
      if (dist < 12) {
        setHoveredPoint({
          x: p.x,
          y: p.y,
          label: p.label || (legend1 ? `${legend1}` : undefined),
          index: i,
          seriesIndex: 1,
          cx,
          cy,
          isCurveValue: false
        });
        foundPoint = true;
        break;
      }
    }

    if (!foundPoint && points2) {
      for (let i = 0; i < points2.length; i++) {
        const p = points2[i];
        if (!isFinite(p.x) || !isFinite(p.y)) continue;
        const cx = xScale(p.x);
        const cy = yScale(p.y);
        const dist = Math.sqrt((cx - clientX) ** 2 + (cy - clientY) ** 2);
        
        if (dist < 12) {
          setHoveredPoint({
            x: p.x,
            y: p.y,
            label: p.label || (legend2 ? `${legend2}` : undefined),
            index: i,
            seriesIndex: 2,
            cx,
            cy,
            isCurveValue: false
          });
          foundPoint = true;
          break;
        }
      }
    }

    // If no exact scatter point hovered, we can compute the curves' values!
    if (!foundPoint) {
      let closestCurve: { y: number; x: number; label: string; seriesIndex: number } | null = null;
      let minCurveDist = 25; // max pixel threshold
      
      const checkCurve = (c: ChartCurve | undefined, seriesIdx: number, lName: string) => {
        if (!c || c.type === 'none') return;
        const targetX = curCoord.x;
        let targetY = 0;
        let validCurve = false;

        if (c.type === 'linear' && c.slope !== undefined && c.intercept !== undefined) {
          targetY = c.slope * targetX + c.intercept;
          validCurve = isFinite(targetY);
        } else if (c.type === 'hyperbolic' && c.coefficient !== undefined) {
          if (targetX !== 0) {
            targetY = c.coefficient / targetX;
            validCurve = isFinite(targetY);
          }
        } else if (c.type === 'sinusoidal' && c.amplitude !== undefined && c.omega !== undefined) {
          targetY = c.amplitude * Math.cos(c.omega * targetX);
          validCurve = isFinite(targetY);
        }

        if (validCurve) {
          const cy = yScale(targetY);
          const distToCurve = Math.abs(cy - clientY);
          if (distToCurve < minCurveDist) {
            minCurveDist = distToCurve;
            closestCurve = {
              x: targetX,
              y: targetY,
              label: lName,
              seriesIndex: seriesIdx
            };
          }
        }
      };

      checkCurve(curve, 1, legend1 || 'Kurva Teoritis 1');
      checkCurve(curve2, 2, legend2 || 'Kurva Teoritis 2');

      if (closestCurve) {
        const item: { x: number; y: number; label: string; seriesIndex: number } = closestCurve;
        setHoveredPoint({
          x: item.x,
          y: item.y,
          label: 'Titik Kurva Teoritis',
          curveLabel: item.label,
          cx: clientX,
          cy: yScale(item.y),
          isCurveValue: true,
          seriesIndex: item.seriesIndex
        });
      } else {
        setHoveredPoint(null);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    handleZoom(zoomFactor);
  };

  // Construct dynamic grid lines and labels according to the active domain
  const gridLines = useMemo(() => {
    const lines = [];
    const steps = 5;
    const { xMin, xMax, yMin, yMax } = activeDomain;

    // Horizontals (Y coordinates)
    for (let i = 0; i <= steps; i++) {
      const val = yMin + (i * (yMax - yMin)) / steps;
      if (!isFinite(val)) continue;
      lines.push({
        type: 'horizontal',
        y: yScale(val),
        val: val.toFixed(3),
      });
    }

    // Verticals (X coordinates)
    for (let i = 0; i <= steps; i++) {
      const val = xMin + (i * (xMax - xMin)) / steps;
      if (!isFinite(val)) continue;
      lines.push({
        type: 'vertical',
        x: xScale(val),
        val: val.toFixed(3),
      });
    }

    return lines;
  }, [activeDomain]);

  // Construct curve rendering points based on coordinates list
  const getCurvePath = (c: ChartCurve | undefined) => {
    if (!c || c.type === 'none') return '';
    const { xMin, xMax } = activeDomain;
    const segments = 120; // smoothness division
    const pts = [];

    const xStep = (xMax - xMin) / segments;

    for (let i = 0; i <= segments; i++) {
      const x = xMin + i * xStep;
      let y = 0;
      let valid = false;

      if (c.type === 'linear' && c.slope !== undefined && c.intercept !== undefined) {
        y = c.slope * x + c.intercept;
        valid = isFinite(y);
      } else if (c.type === 'hyperbolic' && c.coefficient !== undefined) {
        if (x !== 0) {
          y = c.coefficient / x;
          valid = isFinite(y) && y > (activeDomain.yMin - 0.5 * (activeDomain.yMax - activeDomain.yMin)) && y < (activeDomain.yMax + 0.5 * (activeDomain.yMax - activeDomain.yMin));
        }
      } else if (c.type === 'sinusoidal' && c.amplitude !== undefined && c.omega !== undefined) {
        y = c.amplitude * Math.cos(c.omega * x);
        valid = isFinite(y);
      }

      if (valid) {
        pts.push(`${xScale(x)},${yScale(y)}`);
      }
    }

    if (pts.length < 2) return '';
    return `M ${pts.join(' L ')}`;
  };

  const curvePathD = useMemo(() => getCurvePath(curve), [activeDomain, curve]);
  const curve2PathD = useMemo(() => getCurvePath(curve2), [activeDomain, curve2]);

  // If curve is sinusoidal, let's also compute a second curve for Velocity if demanded
  const velocityPathD = useMemo(() => {
    if (curve.type !== 'sinusoidal' || curve.amplitude === undefined || curve.omega === undefined) return '';
    const { xMin, xMax } = activeDomain;
    const segments = 120;
    const pts = [];
    const xStep = (xMax - xMin) / segments;

    for (let i = 0; i <= segments; i++) {
      const x = xMin + i * xStep;
      // v(t) = -A * omega * sin(omega * t)
      const y = -curve.amplitude * curve.omega * Math.sin(curve.omega * x);
      pts.push(`${xScale(x)},${yScale(y)}`);
    }

    return `M ${pts.join(' L ')}`;
  }, [activeDomain, curve]);

  // Double check if bounds are valid, to avoid NaN crashes
  const isValidToRender = points.length > 0 || curve.type === 'sinusoidal';

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm relative flex flex-col justify-between">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
        <div>
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
            {title}
          </h4>
          {subtitle && <p className="text-[10px] text-slate-500 font-medium">{subtitle}</p>}
        </div>

        {/* Dynamic Zoom & Pan Controller Panel */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm self-end sm:self-auto select-none">
          <button
            onClick={() => handleZoom(1.2)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition"
            title="Perbesar Grafik (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition"
            title="Perkecil Grafik (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoomAndPan}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 transition flex items-center gap-1 text-[10px] font-semibold px-1.5"
            title="Kembalikan Tampilan Awal"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <div className="border-l border-slate-100 h-4 mx-0.5" />
          <div className="text-[9px] font-mono font-medium px-2 py-0.5 rounded bg-slate-50 border text-slate-500">
            {zoom.toFixed(1)}x
          </div>
        </div>
      </div>

      {/* SVG Plot Wrapper */}
      <div className="relative w-full overflow-hidden flex items-center justify-center bg-white rounded-xl border border-slate-100">
        {!isValidToRender ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs font-sans p-6 text-center gap-2">
            <AlertCircle className="w-6 h-6 text-slate-350" />
            <span>Masukkan data pada tabel input terlebih dahulu untuk menggambar visualisasi grafik interaktif.</span>
          </div>
        ) : (
          <div className="w-full relative select-none">
            {/* Draggable hint */}
            <div className="absolute top-2 left-2 flex items-center gap-1 text-[9px] text-slate-400 bg-slate-50/80 px-2 py-1 rounded-md backdrop-blur-xs font-sans leading-none pointer-events-none">
              <Move className="w-3 h-3" />
              <span>Geser grafik untuk pan • Scroll untuk zoom</span>
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${width} ${height}`}
              className={`w-full h-auto overflow-visible cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {/* SVG Mask Definition to crop data drawing elements neatly behind padding edges */}
              <defs>
                <clipPath id="chart-area-clip">
                  <rect
                    x={padding}
                    y={padding}
                    width={width - 2 * padding}
                    height={height - 2 * padding}
                  />
                </clipPath>
              </defs>

              {/* Draw Dynamic Gridlines inside active visual region */}
              {gridLines.map((line, idx) => (
                <React.Fragment key={idx}>
                  {line.type === 'horizontal' ? (
                    isFinite(line.y) && line.y >= padding && line.y <= height - padding && (
                      <>
                        <line
                          x1={padding}
                          y1={line.y}
                          x2={width - padding}
                          y2={line.y}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                        <text
                          x={padding - 6}
                          y={line.y + 3}
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {line.val}
                        </text>
                      </>
                    )
                  ) : (
                    isFinite(line.x) && line.x >= padding && line.x <= width - padding && (
                      <>
                        <line
                          x1={line.x}
                          y1={padding}
                          x2={line.x}
                          y2={height - padding}
                          stroke="#f1f5f9"
                          strokeWidth="1"
                        />
                        <text
                          x={line.x}
                          y={height - padding + 12}
                          fill="#94a3b8"
                          fontSize="8"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          {line.val}
                        </text>
                      </>
                    )
                  )}
                </React.Fragment>
              ))}

              {/* Draw Main Frame Axes */}
              <line
                x1={padding}
                y1={padding}
                x2={padding}
                y2={height - padding}
                stroke="#64748b"
                strokeWidth="1"
              />
              <line
                x1={padding}
                y1={height - padding}
                x2={width - padding}
                y2={height - padding}
                stroke="#64748b"
                strokeWidth="1"
              />

              {/* Draw Curves & Points with clip path applied */}
              <g clipPath="url(#chart-area-clip)">
                {/* 1. Draw Simulated Theoretical Fit Curves */}
                {curvePathD && (
                  <path
                    d={curvePathD}
                    fill="none"
                    stroke={curve.type === 'sinusoidal' ? '#3b82f6' : '#2563eb'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="opacity-90"
                  />
                )}

                {/* Optional Second Theoretical Fit Curve (e.g. for f2) */}
                {curve2PathD && (
                  <path
                    d={curve2PathD}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    className="opacity-90"
                  />
                )}

                {/* Second Curve for Velocity in sinusoidal simulations */}
                {velocityPathD && (
                  <path
                    d={velocityPathD}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    className="opacity-75"
                  />
                )}

                {/* 2. Scatter points of raw trials data */}
                {curve.type !== 'sinusoidal' &&
                  points.map((p, idx) => {
                    if (!isFinite(p.x) || !isFinite(p.y)) return null;
                    const cx = xScale(p.x);
                    const cy = yScale(p.y);
                    const isHovered = hoveredPoint?.index === idx && hoveredPoint?.seriesIndex === 1;

                    return (
                      <g key={`p1-${idx}`}>
                        {/* Hover halo ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 10 : 0}
                          fill="#bfdbfe"
                          opacity="0.5"
                          className="transition-all duration-150"
                        />
                        {/* Interactive trigger circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 5.5 : 4}
                          fill={isHovered ? '#1d4ed8' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="transition-all duration-150 shadow-xs"
                        />
                      </g>
                    );
                  })}

                {/* Scatter points for second series if provided */}
                {points2 &&
                  points2.map((p, idx) => {
                    if (!isFinite(p.x) || !isFinite(p.y)) return null;
                    const cx = xScale(p.x);
                    const cy = yScale(p.y);
                    const isHovered = hoveredPoint?.index === idx && hoveredPoint?.seriesIndex === 2;

                    return (
                      <g key={`p2-${idx}`}>
                        {/* Hover halo ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 10 : 0}
                          fill="#a7f3d0"
                          opacity="0.5"
                          className="transition-all duration-150"
                        />
                        {/* Interactive trigger circle */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 5.5 : 4}
                          fill={isHovered ? '#047857' : '#10b981'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="transition-all duration-150 shadow-xs"
                        />
                      </g>
                    );
                  })}

                {/* Hover guideline markers projected to both axes */}
                {hoveredPoint && isFinite(hoveredPoint.cx) && isFinite(hoveredPoint.cy) && (
                  <>
                    <line
                      x1={padding}
                      y1={hoveredPoint.cy}
                      x2={hoveredPoint.cx}
                      y2={hoveredPoint.cy}
                      stroke={hoveredPoint.seriesIndex === 2 ? '#10b981' : '#3b82f6'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                    <line
                      x1={hoveredPoint.cx}
                      y1={height - padding}
                      x2={hoveredPoint.cx}
                      y2={hoveredPoint.cy}
                      stroke={hoveredPoint.seriesIndex === 2 ? '#10b981' : '#3b82f6'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.8"
                    />
                    <circle
                      cx={hoveredPoint.cx}
                      cy={hoveredPoint.cy}
                      r="4.5"
                      fill="#e11d48"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </>
                )}
              </g>

              {/* Optional Legend inside the SVG top-right corner */}
              {(legend1 || legend2) && (
                <g transform={`translate(${width - padding - 105}, ${padding + 10})`} className="opacity-95 text-[8px] font-sans">
                  <rect
                    width="100"
                    height={(legend1 && legend2) ? 38 : 22}
                    rx="4"
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  {legend1 && (
                    <g transform="translate(8, 12)">
                      <line x1="0" y1="0" x2="12" y2="0" stroke="#2563eb" strokeWidth="2.5" />
                      <circle cx="6" cy="0" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                      <text x="18" y="2.5" fill="#334155" fontSize="8" fontWeight="bold">
                        {legend1}
                      </text>
                    </g>
                  )}
                  {legend2 && (
                    <g transform={`translate(8, ${legend1 ? 26 : 12})`}>
                      <line x1="0" y1="0" x2="12" y2="0" stroke="#10b981" strokeWidth="2.5" />
                      <circle cx="6" cy="0" r="3.5" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                      <text x="18" y="2.5" fill="#334155" fontSize="8" fontWeight="bold">
                        {legend2}
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Axis Labeling texts */}
              <text
                x={width / 2}
                y={height - 6}
                fill="#475569"
                fontSize="9"
                fontWeight="extrabold"
                textAnchor="middle"
              >
                {xLabel} {xUnit ? `(${xUnit})` : ''}
              </text>
              <text
                transform={`rotate(-90, 13, ${height / 2})`}
                x="13"
                y={height / 2}
                fill="#475569"
                fontSize="9"
                fontWeight="extrabold"
                textAnchor="middle"
              >
                {yLabel} {yUnit ? `(${yUnit})` : ''}
              </text>
            </svg>
          </div>
        )}
      </div>

      {/* Coordinate Tooltip Overlay */}
      <div className="h-9 mt-2 flex items-center justify-center border-t border-slate-100 pt-2 select-none">
        {hoveredPoint ? (
          <div className="bg-slate-900 text-white text-[10px] sm:text-xs font-mono px-3.5 py-1 rounded-lg shadow-md flex gap-4 animate-fadeIn">
            {hoveredPoint.label && (
              <span className={`font-bold ${hoveredPoint.seriesIndex === 2 ? 'text-emerald-400' : 'text-blue-400'}`}>
                {hoveredPoint.isCurveValue ? `${hoveredPoint.label} (${hoveredPoint.curveLabel})` : hoveredPoint.label}:
              </span>
            )}
            <span>
              <strong>X:</strong> {hoveredPoint.x.toFixed(4)} {xUnit}
            </span>
            <span>
              <strong>Y:</strong> {hoveredPoint.y.toFixed(4)} {yUnit}
            </span>
            {hoveredPoint.seriesIndex === 1 && curve.type === 'linear' && curve.slope !== undefined && curve.intercept !== undefined && !hoveredPoint.isCurveValue && (
              <span className="opacity-75">
                <strong>Pred Y:</strong> {(curve.slope * hoveredPoint.x + curve.intercept).toFixed(4)}
              </span>
            )}
            {hoveredPoint.seriesIndex === 2 && curve2 && curve2.type === 'linear' && curve2.slope !== undefined && curve2.intercept !== undefined && !hoveredPoint.isCurveValue && (
              <span className="opacity-75">
                <strong>Pred Y:</strong> {(curve2.slope * hoveredPoint.x + curve2.intercept).toFixed(4)}
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 italic font-sans flex items-center gap-1.5 justify-center">
            Dekatkan kursor/sentuh titik data untuk melihat koordinat presisi.
          </span>
        )}
      </div>
    </div>
  );
}
