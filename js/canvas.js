/**
 * Модуль Canvas-візуалізації із захистом від сплесків Лагранжа (Ефекту Рунге)
 */
class CanvasRenderer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.padding = 55;
  }

  updateSize() {
    const wrapper = this.canvas.parentElement;
    this.canvas.width = wrapper.clientWidth - 24;
    this.canvas.height = 480;
  }

  computeBounds(points, lsmFn = null) {
    let xMin = Math.min(...points.map(p => p.x));
    let xMax = Math.max(...points.map(p => p.x));
    let yMin = Math.min(...points.map(p => p.y));
    let yMax = Math.max(...points.map(p => p.y));

    let dy = yMax - yMin;
    if (dy === 0) dy = 1;

    // Масштабуємо за точками з розширенням на 20%
    yMin = yMin - dy * 0.20;
    yMax = yMax + dy * 0.20;

    // Враховуємо МНК у розумних межах
    if (lsmFn) {
      const samples = 60;
      const dx = (xMax - xMin) / samples;
      for (let i = 0; i <= samples; i++) {
        const x = xMin + i * dx;
        const y = lsmFn(x);
        if (!isNaN(y) && isFinite(y)) {
          if (y < yMin && y > yMin - dy * 0.5) yMin = y;
          if (y > yMax && y < yMax + dy * 0.5) yMax = y;
        }
      }
    }

    const dx = xMax - xMin || 1;
    return {
      xMin: xMin - dx * 0.05,
      xMax: xMax + dx * 0.05,
      yMin,
      yMax
    };
  }

  toScreen(x, y, bounds) {
    const w = this.canvas.width - 2 * this.padding;
    const h = this.canvas.height - 2 * this.padding;
    const px = this.padding + ((x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * w;
    const py = this.canvas.height - this.padding - ((y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * h;
    return { x: px, y: py };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAxesAndGrid(bounds) {
    const { ctx, canvas, padding } = this;
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Segoe UI';

    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const xVal = bounds.xMin + (i / steps) * (bounds.xMax - bounds.xMin);
      const pX = this.toScreen(xVal, bounds.yMin, bounds);
      ctx.beginPath();
      ctx.moveTo(pX.x, padding);
      ctx.lineTo(pX.x, canvas.height - padding);
      ctx.stroke();
      ctx.fillText(xVal.toFixed(1), pX.x - 10, canvas.height - padding + 18);

      const yVal = bounds.yMin + (i / steps) * (bounds.yMax - bounds.yMin);
      const pY = this.toScreen(bounds.xMin, yVal, bounds);
      ctx.beginPath();
      ctx.moveTo(padding, pY.y);
      ctx.lineTo(canvas.width - padding, pY.y);
      ctx.stroke();
      ctx.fillText(yVal.toFixed(2), padding - 42, pY.y + 4);
    }

    ctx.strokeStyle = '#475569';
    ctx.strokeRect(padding, padding, canvas.width - 2 * padding, canvas.height - 2 * padding);
  }

  drawPoints(points, bounds, activeIndex = -1) {
    const { ctx } = this;
    points.forEach((p, i) => {
      const pt = this.toScreen(p.x, p.y, bounds);
      ctx.beginPath();
      const radius = i === activeIndex ? 8 : 5;
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);

      if (i === activeIndex) {
        ctx.fillStyle = '#fb923c';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
      }
    });
  }

  // Обрізання малювання прямокутником сітки (Clipping)
  drawCurve(evalFn, bounds, color) {
    if (!evalFn) return;
    const { ctx, canvas, padding } = this;

    ctx.save();
    ctx.beginPath();
    ctx.rect(padding, padding, canvas.width - 2 * padding, canvas.height - 2 * padding);
    ctx.clip();

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const startX = bounds.xMin;
    const endX = bounds.xMax;
    const steps = 400;
    const dx = (endX - startX) / steps;

    let first = true;
    for (let i = 0; i <= steps; i++) {
      const x = startX + i * dx;
      const y = evalFn(x);
      if (isNaN(y) || !isFinite(y)) continue;

      const pt = this.toScreen(x, y, bounds);
      if (first) {
        ctx.moveTo(pt.x, pt.y);
        first = false;
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawResiduals(points, lsmFn, bounds, alpha = 1.0) {
    if (!lsmFn) return;
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = `rgba(251, 146, 60, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    points.forEach(p => {
      const yHat = lsmFn(p.x);
      const p1 = this.toScreen(p.x, p.y, bounds);
      const p2 = this.toScreen(p.x, yHat, bounds);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.restore();
  }
}