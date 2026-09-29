/* Uma única notação para saldo, produção, preços, histórico e ranking. */
(function (root) {
  const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const units = ['mil', 'mi', 'bi', 'tri', 'quadri', 'quinti', 'sexti', 'septi', 'octi', 'noni', 'deci',
    'undec', 'dodec', 'tredec', 'quatdec', 'quindec', 'sexdec', 'septdec', 'octdec', 'nondec', 'viginti'];
  const scales = units.map((suffix, i) => ({ suffix, size: 10 ** ((i + 1) * 3) }));
  function scientific(value) {
    const [mantissa, exponent] = value.toExponential(2).split('e');
    return decimal.format(Number(mantissa)) + 'e' + exponent;
  }
  function format(value, fractional = false) {
    if (Number.isNaN(value)) return '0';
    if (!Number.isFinite(value)) return value < 0 ? '−∞' : '∞';
    const sign = value < 0 ? '−' : '';
    const magnitude = Math.abs(value);
    if (magnitude < 1000) return sign + decimal.format(fractional ? magnitude : Math.floor(magnitude));
    if (magnitude >= 1e66) return sign + scientific(magnitude);
    let index = scales.findLastIndex(unit => magnitude >= unit.size);
    // 999,999 mi arredonda para 1 bi, em vez de aparecer como 1.000 mi.
    if (Math.round(magnitude / scales[index].size * 100) >= 100000) index++;
    if (index >= scales.length) return sign + scientific(magnitude);
    return sign + decimal.format(magnitude / scales[index].size) + ' ' + scales[index].suffix;
  }
  const api = { format, formatFraction: value => format(value, true) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CajuNumbers = api;
})(typeof window !== 'undefined' ? window : globalThis);
