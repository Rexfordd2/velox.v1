/**
 * Savitzky-Golay filter coefficients for different window sizes and polynomial orders
 * These are pre-calculated for common configurations
 */
const COEFFICIENTS: { [key: string]: number[] } = {
  '5_2': [-0.0857, 0.3429, 0.4857, 0.3429, -0.0857], // 5-point window, 2nd order
  '7_2': [-0.0952, 0.1429, 0.2857, 0.3333, 0.2857, 0.1429, -0.0952],
  '9_2': [-0.0909, 0.0606, 0.1688, 0.2338, 0.2554, 0.2338, 0.1688, 0.0606, -0.0909]
};

/**
 * Apply Savitzky-Golay filter to smooth time series data
 * @param data Input time series data
 * @param windowSize Size of the smoothing window (must be odd)
 * @param order Polynomial order
 * @returns Smoothed data
 */
export function savitzkyGolay(
  data: number[],
  windowSize: number,
  order: number
): number[] {
  const key = `${windowSize}_${order}`;
  const coefficients = COEFFICIENTS[key];
  
  if (!coefficients) {
    throw new Error(`No pre-calculated coefficients for window size ${windowSize} and order ${order}`);
  }

  const halfWindow = Math.floor(windowSize / 2);
  const result: number[] = [];

  // Handle edges with padding
  const paddedData = [
    ...Array(halfWindow).fill(data[0]),
    ...data,
    ...Array(halfWindow).fill(data[data.length - 1])
  ];

  // Apply filter
  for (let i = halfWindow; i < paddedData.length - halfWindow; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += paddedData[i - halfWindow + j] * coefficients[j];
    }
    result.push(sum);
  }

  return result;
} 