const pluginController = require('../../controllers/pluginController');

describe('Plugin Ecosystem Sandbox Runtime', () => {
  it('executes simple mathematical formulas securely', () => {
    const code = `
      const discount = context.price * 0.1;
      result.discountedPrice = context.price - discount;
    `;
    const context = { price: 100 };

    const res = pluginController.executeSandbox(code, context);
    expect(res.discountedPrice).toBe(90);
  });

  it('blocks environment credential reads (process.env isolation)', () => {
    const code = `
      try {
        result.env = process.env;
      } catch (err) {
        result.error = err.message;
      }
    `;
    
    const res = pluginController.executeSandbox(code, {});
    expect(res.error).toBeDefined();
  });

  it('throws exceptions if execution execution attempts require blocks', () => {
    const code = `
      try {
        const fs = require('fs');
      } catch (err) {
        result.error = err.message;
      }
    `;

    const res = pluginController.executeSandbox(code, {});
    expect(res.error).toContain('require is not defined');
  });
});
