export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function numberToWordsIndian(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';

  const singleDigits = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return singleDigits[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit !== 0 ? ' ' + singleDigits[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += singleDigits[hundred] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let remaining = integerPart;
  let words = '';

  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;

  const hundreds = remaining;

  if (crores > 0) {
    words += convertTwoDigits(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertThreeDigits(hundreds) + ' ';
  }

  words = words.trim() + ' Rupees';

  if (decimalPart > 0) {
    words += ' and ' + convertTwoDigits(decimalPart) + ' Paise';
  }

  return words + ' Only';
}
