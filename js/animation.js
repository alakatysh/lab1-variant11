/**
 * Модуль керування анімаціями
 */
class AnimationController {
  constructor(renderer, onUpdate) {
    this.renderer = renderer;
    this.onUpdate = onUpdate;
    this.animationId = null;
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  animateLagrange(points, setStatus) {
    this.stop();
    let currentIndex = 1;
    const total = points.length;

    const step = () => {
      if (currentIndex > total) {
        setStatus('Анімацію Лагранжа завершено');
        return;
      }
      setStatus(`Анімація Лагранжа: Додано вузол ${currentIndex} з ${total}`);
      const subPoints = points.slice(0, currentIndex);

      this.onUpdate({
        overridePoints: subPoints,
        activePointIdx: currentIndex - 1,
        customLagrangeFn: (x) => lagrangePolynomial(subPoints, x)
      });

      currentIndex++;
      setTimeout(() => {
        this.animationId = requestAnimationFrame(step);
      }, 600);
    };
    step();
  }

  animateLSM(points, degree, setStatus) {
    this.stop();
    const targetCoeffs = fitLSM(points, degree);
    const duration = 1200;
    const startTime = performance.now();
    const meanY = points.reduce((acc, p) => acc + p.y, 0) / points.length;
    const startCoeffs = [meanY, ...new Array(degree).fill(0)];

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const currentCoeffs = startCoeffs.map((start, i) => start + (targetCoeffs[i] - start) * progress);

      setStatus(`Анімація МНК: Побудова (${Math.round(progress * 100)}%)`);

      this.onUpdate({
        customLsmFn: (x) => evaluateLSM(currentCoeffs, x),
        residualAlpha: progress
      });

      if (progress < 1.0) {
        this.animationId = requestAnimationFrame(frame);
      } else {
        setStatus('Анімацію МНК завершено');
      }
    };
    this.animationId = requestAnimationFrame(frame);
  }
}