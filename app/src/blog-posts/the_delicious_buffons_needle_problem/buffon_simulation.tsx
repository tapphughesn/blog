import { useRef, useEffect, useState, useLayoutEffect } from 'react';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 600;
const H_LINES = [75, 225, 375, 525];

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#F5F5DC';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  for (const y of H_LINES) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function hitsLine(my: number, angle: number, halfLen: number) {
  const y1 = my + halfLen * Math.sin(angle);
  const y2 = my - halfLen * Math.sin(angle);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return H_LINES.some(hy => hy >= minY && hy <= maxY);
}

interface SimStats {
  dropped: number;
  crossings: number;
  lengthRatio: number;
}

interface Props {
  show_controls?: boolean;
  show_readout?: boolean;
  show_pi_estimation?: boolean;
}

export default function buffon_simulation({ show_controls = true, show_readout = true, show_pi_estimation = true }: Props = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(10);
  const [lengthRatio, setLengthRatio] = useState(show_controls ? 0.5 : 2 / 3);
  const [stats, setStats] = useState<SimStats | null>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawBackground(ctx);
  }, []);

  useLayoutEffect(() => {
    const widthObserver = new ResizeObserver(() => {
      if (!outerRef.current) return;
      setScale(Math.min(1, outerRef.current.offsetWidth / CANVAS_WIDTH));
    });
    const heightObserver = new ResizeObserver(() => {
      if (!innerRef.current) return;
      setInnerHeight(innerRef.current.offsetHeight);
    });
    if (outerRef.current) widthObserver.observe(outerRef.current);
    if (innerRef.current) heightObserver.observe(innerRef.current);
    return () => { widthObserver.disconnect(); heightObserver.disconnect(); };
  }, []);

  const handleDrop = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx);
    const halfLen = (lengthRatio * 150) / 2;
    let crossings = 0;

    for (let i = 0; i < count; i++) {
      const mx = Math.random() * CANVAS_WIDTH;
      const my = Math.random() * CANVAS_HEIGHT;
      const angle = Math.random() * Math.PI;

      const crossed = hitsLine(my, angle, halfLen);
      if (crossed) crossings++;
      ctx.strokeStyle = crossed ? '#FF0000' : '#B7410E';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx + halfLen * Math.cos(angle), my + halfLen * Math.sin(angle));
      ctx.lineTo(mx - halfLen * Math.cos(angle), my - halfLen * Math.sin(angle));
      ctx.stroke();
    }

    setStats({ dropped: count, crossings, lengthRatio });
  };

  return (
    <div ref={outerRef} style={{ width: '100%', height: innerHeight * scale, overflow: 'hidden' }}>
    <div ref={innerRef} className="blog-post-interactive-component" style={{ width: CANVAS_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
      <div className="blog-post-interactive-component__controls">
        {show_controls && <>
          <label className="blog-post-interactive-component__label">
            num needles:
            <input
              type="number"
              min={1}
              max={1000}
              value={count}
              onChange={e => setCount(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
            />
          </label>
          <label className="blog-post-interactive-component__label">
            needle length: {lengthRatio.toFixed(2)}
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.01}
              value={lengthRatio}
              onChange={e => setLengthRatio(parseFloat(e.target.value))}
            />
          </label>
        </>}
        <button className="blog-post-interactive-component__button" onClick={handleDrop}>Drop!</button>
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      {show_readout && stats && (() => {
        const estimatedP = stats.crossings / stats.dropped;
        const realP = (2 * stats.lengthRatio) / Math.PI;
        const estimatedPi = (2 * stats.lengthRatio * stats.dropped) / stats.crossings;
        return (
          <table className="blog-post-interactive-component__stats">
            <tbody>
              <tr><td>Needles dropped</td><td>{stats.dropped}</td></tr>
              <tr><td>Crossings</td><td>{stats.crossings}</td></tr>
              <tr><td>{show_pi_estimation ? 'Real' : 'Value of'} <i>p</i></td><td>{realP.toFixed(7)}</td></tr>
              {show_pi_estimation ? <>
                <tr><td>Estimated <i>p</i></td><td>{estimatedP.toFixed(7)}</td></tr>
                <tr><td>Estimation error for <i>p</i></td><td>{(((estimatedP - realP) / realP) * 100).toFixed(7)}%</td></tr>
                <tr><td>Estimated π</td><td>{estimatedPi.toFixed(7)}</td></tr>
                <tr><td>Estimation error for π</td><td>{(((estimatedPi - Math.PI) / Math.PI) * 100).toFixed(7)}%</td></tr>
              </> : <>
                <tr><td>Expected crossings</td><td>{(realP * stats.dropped).toFixed(7)}</td></tr>
              </>}
            </tbody>
          </table>
        );
      })()}
    </div>
    </div>
  );
}
