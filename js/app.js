/**
 * Головний скрипт логіки UI та подій
 */
document.addEventListener('DOMContentLoaded', () => {
  const renderer = new CanvasRenderer('chart-canvas');
  let currentDatasetKey = 'ds5';
  let currentViewMode = 'all';
  let lsmDegree = 2;

  const datasetButtons = document.querySelectorAll('#dataset-toggle .btn');
  const viewButtons = document.querySelectorAll('#view-toggle .btn');
  const degreeSelect = document.getElementById('degree-select');
  const btnAnimLagrange = document.getElementById('btn-anim-lagrange');
  const btnAnimLSM = document.getElementById('btn-anim-lsm');
  const btnReset = document.getElementById('btn-reset');
  const animStatus = document.getElementById('anim-status');
  const lsmEqElement = document.getElementById('lsm-equation');
  const rmseElement = document.getElementById('metric-rmse');
  const maeElement = document.getElementById('metric-mae');
  const tooltip = document.getElementById('tooltip');

  const animController = new AnimationController(renderer, (params) => {
    renderScene(params);
  });

  function renderScene(options = {}) {
    renderer.updateSize();

    const points = options.overridePoints || DATASETS[currentDatasetKey];
    const activePointIdx = options.activePointIdx ?? -1;

    const lagrangeFn = options.customLagrangeFn || ((x) => lagrangePolynomial(points, x));
    const lsmCoeffs = fitLSM(points, lsmDegree);
    const lsmFn = options.customLsmFn || ((x) => evaluateLSM(lsmCoeffs, x));

    lsmEqElement.textContent = formatLSMFormula(lsmCoeffs);
    const metrics = calculateMetrics(points, lsmFn);
    rmseElement.textContent = metrics.rmse.toFixed(4);
    maeElement.textContent = metrics.mae.toFixed(4);

    const bounds = renderer.computeBounds(points, lsmFn);

    renderer.clear();
    renderer.drawAxesAndGrid(bounds);

    // Відображення МНК та залишків
    if (currentViewMode === 'all' || currentViewMode === 'lsm') {
      const alpha = options.residualAlpha ?? 1.0;
      renderer.drawResiduals(points, lsmFn, bounds, alpha);
      renderer.drawCurve(lsmFn, bounds, '#4ade80');
    }

    // Відображення Лагранжа
    if (currentViewMode === 'all' || currentViewMode === 'lagrange') {
      renderer.drawCurve(lagrangeFn, bounds, '#c084fc');
    }

    // Вузли
    renderer.drawPoints(points, bounds, activePointIdx);

    renderer.currentBounds = bounds;
    renderer.currentPoints = points;
    renderer.currentLsmFn = lsmFn;
  }

  // Ресайз вікна
  window.addEventListener('resize', () => renderScene());

  // Вибір датасету
  datasetButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      datasetButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentDatasetKey = e.target.dataset.dataset;
      animController.stop();
      animStatus.textContent = 'Готовий до роботи';
      renderScene();
    });
  });

  // Вибір режиму
  viewButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      viewButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentViewMode = e.target.dataset.view;
      renderScene();
    });
  });

  // Зміна степеня
  degreeSelect.addEventListener('change', (e) => {
    lsmDegree = parseInt(e.target.value, 10);
    renderScene();
  });

  // Кнопки анімації
  btnAnimLagrange.addEventListener('click', () => {
    animController.animateLagrange(DATASETS[currentDatasetKey], (msg) => {
      animStatus.textContent = msg;
    });
  });

  btnAnimLSM.addEventListener('click', () => {
    animController.animateLSM(DATASETS[currentDatasetKey], lsmDegree, (msg) => {
      animStatus.textContent = msg;
    });
  });

  btnReset.addEventListener('click', () => {
    animController.stop();
    animStatus.textContent = 'Готовий до роботи';
    renderScene();
  });

  // Інтерактивні підказки (Tooltip)
  renderer.canvas.addEventListener('mousemove', (e) => {
    const rect = renderer.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const bounds = renderer.currentBounds;
    const points = renderer.currentPoints;
    if (!bounds || !points) return;

    let found = false;
    points.forEach(p => {
      const pt = renderer.toScreen(p.x, p.y, bounds);
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);

      if (dist < 10) {
        const yHat = renderer.currentLsmFn(p.x);
        const residual = p.y - yHat;

        tooltip.style.left = `${mouseX + 15}px`;
        tooltip.style.top = `${mouseY + 15}px`;
        tooltip.innerHTML = `
          <strong>Точка (${p.x}, ${p.y})</strong><br/>
          МНК ŷ: ${yHat.toFixed(3)}<br/>
          Залишок r: ${residual.toFixed(3)}
        `;
        tooltip.classList.remove('hidden');
        found = true;
      }
    });

    if (!found) tooltip.classList.add('hidden');
  });

  renderer.canvas.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
  });

  // Початковий рендеринг
  renderScene();
});