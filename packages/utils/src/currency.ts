/**
 * Format a number as Indian Rupees (INR).
 * @example formatINR(150000) => "₹1,50,000"
 */
export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to paise (smallest unit for Razorpay).
 * @example rupeesToPaise(1500) => 150000
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Convert paise to rupees.
 * @example paiseToRupees(150000) => 1500
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}
