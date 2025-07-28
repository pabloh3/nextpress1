/**
 * Test suite for NextPress Hook System
 * Tests WordPress-compatible actions and filters
 */

// Import hook system - we need to mock the global environment
let hooks;

// Mock global functions
global.console = { log: jest.fn(), error: jest.fn() };

beforeEach(() => {
  // Reset the hooks system before each test
  jest.resetModules();
  hooks = require('../server/hooks.js').default;
});

describe('NextPress Hook System', () => {
  describe('Action Hooks', () => {
    test('should register and execute action hooks', () => {
      const callback = jest.fn();
      
      hooks.addAction('test_action', callback);
      hooks.doAction('test_action', 'arg1', 'arg2');
      
      expect(callback).toHaveBeenCalledWith('arg1', 'arg2');
    });

    test('should execute multiple callbacks for same action', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      hooks.addAction('test_action', callback1);
      hooks.addAction('test_action', callback2);
      hooks.doAction('test_action', 'test');
      
      expect(callback1).toHaveBeenCalledWith('test');
      expect(callback2).toHaveBeenCalledWith('test');
    });

    test('should respect priority order', () => {
      const results = [];
      const callback1 = () => results.push('high');
      const callback2 = () => results.push('low');
      
      hooks.addAction('test_action', callback1, 5);
      hooks.addAction('test_action', callback2, 10);
      hooks.doAction('test_action');
      
      expect(results).toEqual(['high', 'low']);
    });

    test('should handle action removal', () => {
      const callback = jest.fn();
      
      hooks.addAction('test_action', callback);
      hooks.removeAction('test_action', callback);
      hooks.doAction('test_action');
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should check if action has callbacks', () => {
      const callback = jest.fn();
      
      expect(hooks.hasAction('test_action')).toBe(false);
      
      hooks.addAction('test_action', callback);
      expect(hooks.hasAction('test_action')).toBe(true);
    });
  });

  describe('Filter Hooks', () => {
    test('should register and apply filter hooks', () => {
      const filter = (value) => value + ' filtered';
      
      hooks.addFilter('test_filter', filter);
      const result = hooks.applyFilters('test_filter', 'original');
      
      expect(result).toBe('original filtered');
    });

    test('should chain multiple filters', () => {
      const filter1 = (value) => value + ' first';
      const filter2 = (value) => value + ' second';
      
      hooks.addFilter('test_filter', filter1);
      hooks.addFilter('test_filter', filter2);
      const result = hooks.applyFilters('test_filter', 'original');
      
      expect(result).toBe('original first second');
    });

    test('should respect filter priority order', () => {
      const filter1 = (value) => value + ' high';
      const filter2 = (value) => value + ' low';
      
      hooks.addFilter('test_filter', filter1, 5);
      hooks.addFilter('test_filter', filter2, 10);
      const result = hooks.applyFilters('test_filter', 'original');
      
      expect(result).toBe('original high low');
    });

    test('should handle filter removal', () => {
      const filter = (value) => value + ' filtered';
      
      hooks.addFilter('test_filter', filter);
      hooks.removeFilter('test_filter', filter);
      const result = hooks.applyFilters('test_filter', 'original');
      
      expect(result).toBe('original');
    });

    test('should return original value if no filters', () => {
      const result = hooks.applyFilters('nonexistent_filter', 'original');
      expect(result).toBe('original');
    });

    test('should pass additional arguments to filters', () => {
      const filter = jest.fn((value, arg1, arg2) => value);
      
      hooks.addFilter('test_filter', filter);
      hooks.applyFilters('test_filter', 'value', 'arg1', 'arg2');
      
      expect(filter).toHaveBeenCalledWith('value', 'arg1', 'arg2');
    });
  });

  describe('WordPress Core Hooks', () => {
    test('should have init action hook', () => {
      expect(hooks.hasAction('init')).toBe(true);
    });

    test('should have wp_loaded action hook', () => {
      expect(hooks.hasAction('wp_loaded')).toBe(true);
    });

    test('should have content filters', () => {
      expect(hooks.hasFilter('the_content')).toBe(true);
      expect(hooks.hasFilter('the_title')).toBe(true);
      expect(hooks.hasFilter('the_excerpt')).toBe(true);
    });

    test('should format content with the_content filter', () => {
      const content = 'Paragraph one.\n\nParagraph two.';
      const filtered = hooks.applyFilters('the_content', content);
      
      expect(filtered).toContain('<p>');
      expect(filtered).toContain('</p>');
    });

    test('should trim titles with the_title filter', () => {
      const title = '  Untrimmed Title  ';
      const filtered = hooks.applyFilters('the_title', title);
      
      expect(filtered).toBe('Untrimmed Title');
    });

    test('should add ellipsis to excerpts', () => {
      const excerpt = 'This is an excerpt';
      const filtered = hooks.applyFilters('the_excerpt', excerpt);
      
      expect(filtered).toBe('This is an excerpt...');
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in action callbacks gracefully', () => {
      const errorCallback = () => { throw new Error('Test error'); };
      const normalCallback = jest.fn();
      
      hooks.addAction('test_action', errorCallback);
      hooks.addAction('test_action', normalCallback);
      
      expect(() => hooks.doAction('test_action')).not.toThrow();
      expect(normalCallback).toHaveBeenCalled();
      expect(global.console.error).toHaveBeenCalledWith(
        'Error in action hook test_action:',
        expect.any(Error)
      );
    });

    test('should handle errors in filter callbacks gracefully', () => {
      const errorFilter = () => { throw new Error('Filter error'); };
      const normalFilter = (value) => value + ' normal';
      
      hooks.addFilter('test_filter', errorFilter);
      hooks.addFilter('test_filter', normalFilter);
      
      const result = hooks.applyFilters('test_filter', 'original');
      
      expect(result).toBe('original normal');
      expect(global.console.error).toHaveBeenCalledWith(
        'Error in filter hook test_filter:',
        expect.any(Error)
      );
    });
  });

  describe('Hook Registry', () => {
    test('should list all registered actions', () => {
      hooks.addAction('custom_action1', () => {});
      hooks.addAction('custom_action2', () => {});
      
      const actions = hooks.getActions();
      expect(actions).toContain('custom_action1');
      expect(actions).toContain('custom_action2');
    });

    test('should list all registered filters', () => {
      hooks.addFilter('custom_filter1', (v) => v);
      hooks.addFilter('custom_filter2', (v) => v);
      
      const filters = hooks.getFilters();
      expect(filters).toContain('custom_filter1');
      expect(filters).toContain('custom_filter2');
    });
  });
});
