/**
 * Математичні алгоритми: Інтерполяція Лагранжа, МНК та метрики
 */

// Інтерполяційний поліном Лагранжа
function lagrangePolynomial(points, x) {
  let result = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    let term = points[i].y;
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        term *= (x - points[j].x) / (points[i].x - points[j].x);
      }
    }
    result += term;
  }
  return result;
}

// Апроксимація методом найменших квадратів (МНК)
function fitLSM(points, degree) {
  const m = degree;
  const N = points.length;
  const ATA = Array.from({ length: m + 1 }, () => new Array(m + 1).fill(0));
  const ATY = new Array(m + 1).fill(0);

  for (let i = 0; i <= m; i++) {
    for (let j = 0; j <= m; j++) {
      let sum = 0;
      for (let k = 0; k < N; k++) sum += Math.pow(points[k].x, i + j);
      ATA[i][j] = sum;
    }
    let sumY = 0;
    for (let k = 0; k < N; k++) sumY += points[k].y * Math.pow(points[k].x, i);
    ATY[i] = sumY;
  }
  return solveGauss(ATA, ATY);
}

// Розв'язок СЛАР методом Гаусса з вибором головного елемента
function solveGauss(A, B) {
  const n = B.length;
  const M = A.map((row, i) => [...row, B[i]]);

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) maxRow = k;
    }
    [M[i], M[maxRow]] = [M[maxRow], M[i]];
    if (Math.abs(M[i][i]) < 1e-12) continue;

    for (let k = i + 1; k < n; k++) {
      const c = -M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) {
        if (i === j) M[k][j] = 0;
        else M[k][j] += c * M[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) sum -= M[i][j] * x[j];
    x[i] = sum / M[i][i];
  }
  return x;
}

function evaluateLSM(coeffs, x) {
  return coeffs.reduce((acc, c, i) => acc + c * Math.pow(x, i), 0);
}

function calculateMetrics(points, evalFn) {
  const N = points.length;
  let sumSqErr = 0;
  let sumAbsErr = 0;

  points.forEach(p => {
    const yHat = evalFn(p.x);
    const r = p.y - yHat;
    sumSqErr += r * r;
    sumAbsErr += Math.abs(r);
  });

  return {
    rmse: Math.sqrt(sumSqErr / N),
    mae: sumAbsErr / N
  };
}

function formatLSMFormula(coeffs) {
  return 'y = ' + coeffs.map((c, i) => {
    const sign = c >= 0 ? (i === 0 ? '' : ' + ') : ' - ';
    const val = Math.abs(c).toFixed(4);
    if (i === 0) return `${val}`;
    if (i === 1) return `${sign}${val}·x`;
    return `${sign}${val}·x^${i}`;
  }).join('');
}