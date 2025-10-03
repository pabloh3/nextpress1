// WordPress-compatible hook system for NextPress
class HookSystem {
  public actions: Map<string, Map<number, Function[]>>;
  public filters: Map<string, Map<number, Function[]>>;

  constructor() {
    this.actions = new Map();
    this.filters = new Map();
  }

  // Add an action hook (WordPress: add_action)
  addAction(tag: string, callback: Function, priority: number = 10) {
    if (!this.actions.has(tag)) {
      this.actions.set(tag, new Map());
    }
    
    const priorityMap = this.actions.get(tag);
    if (!priorityMap) return;
    if (!priorityMap.has(priority)) {
      priorityMap.set(priority, []);
    }
    
    const callbacks = priorityMap.get(priority);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  // Execute action hooks (WordPress: do_action)
  doAction(tag: string, ...args: any[]) {
    if (!this.actions.has(tag)) return;
    
    const priorityMap = this.actions.get(tag);
    if (!priorityMap) return;
    const priorities = Array.from(priorityMap.keys()).sort((a, b) => a - b);
    
    for (const priority of priorities) {
      const callbacks = priorityMap.get(priority);
      if (!callbacks) continue;
      for (const callback of callbacks) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in action hook ${tag}:`, error);
        }
      }
    }
  }

  // Add a filter hook (WordPress: add_filter)
  addFilter(tag: string, callback: Function, priority: number = 10) {
    if (!this.filters.has(tag)) {
      this.filters.set(tag, new Map());
    }
    
    const priorityMap = this.filters.get(tag);
    if (!priorityMap) return;
    if (!priorityMap.has(priority)) {
      priorityMap.set(priority, []);
    }
    
    const callbacks = priorityMap.get(priority);
    if (callbacks) {
      callbacks.push(callback);
    }
  }

  // Apply filter hooks (WordPress: apply_filters)
  applyFilters(tag: string, value: any, ...args: any[]) {
    if (!this.filters.has(tag)) return value;
    
    const priorityMap = this.filters.get(tag);
    if (!priorityMap) return value;
    const priorities = Array.from(priorityMap.keys()).sort((a, b) => a - b);
    
    let filteredValue = value;
    
    for (const priority of priorities) {
      const callbacks = priorityMap.get(priority);
      if (!callbacks) continue;
      for (const callback of callbacks) {
        try {
          filteredValue = callback(filteredValue, ...args);
        } catch (error) {
          console.error(`Error in filter hook ${tag}:`, error);
        }
      }
    }
    
    return filteredValue;
  }

  // Remove an action hook (WordPress: remove_action)
  removeAction(tag: string, callback: Function, priority: number = 10) {
    if (!this.actions.has(tag)) return false;
    
    const priorityMap = this.actions.get(tag);
    if (!priorityMap || !priorityMap.has(priority)) return false;
    
    const callbacks = priorityMap.get(priority);
    if (!callbacks) return false;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Remove a filter hook (WordPress: remove_filter)
  removeFilter(tag: string, callback: Function, priority: number = 10) {
    if (!this.filters.has(tag)) return false;
    
    const priorityMap = this.filters.get(tag);
    if (!priorityMap || !priorityMap.has(priority)) return false;
    
    const callbacks = priorityMap.get(priority);
    if (!callbacks) return false;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      return true;
    }
    
    return false;
  }

  // Check if an action has any callbacks
  hasAction(tag: string) {
    const priorityMap = this.actions.get(tag);
    return this.actions.has(tag) && priorityMap !== undefined && priorityMap.size > 0;
  }

  // Check if a filter has any callbacks
  hasFilter(tag: string) {
    const priorityMap = this.filters.get(tag);
    return this.filters.has(tag) && priorityMap !== undefined && priorityMap.size > 0;
  }

  // Get all registered actions
  getActions() {
    return Array.from(this.actions.keys());
  }

  // Get all registered filters
  getFilters() {
    return Array.from(this.filters.keys());
  }
}

// Global hook system instance
const hooks = new HookSystem();

// WordPress-compatible global functions
(global as any).addAction = hooks.addAction.bind(hooks);
(global as any).doAction = hooks.doAction.bind(hooks);
(global as any).addFilter = hooks.addFilter.bind(hooks);
(global as any).applyFilters = hooks.applyFilters.bind(hooks);
(global as any).removeAction = hooks.removeAction.bind(hooks);
(global as any).removeFilter = hooks.removeFilter.bind(hooks);
(global as any).hasAction = hooks.hasAction.bind(hooks);
(global as any).hasFilter = hooks.hasFilter.bind(hooks);

// Core NextPress hooks
hooks.addAction('init', () => {
  console.log('NextPress initialized');
});

hooks.addAction('wp_loaded', () => {
  console.log('NextPress fully loaded');
});

// Post-related hooks
hooks.addAction('save_post', (post: any) => {
  console.log(`Post saved: ${post.title}`);
});

hooks.addAction('publish_post', (post: any) => {
  console.log(`Post published: ${post.title}`);
});

hooks.addAction('delete_post', (postId: any) => {
  console.log(`Post deleted: ${postId}`);
});

// User-related hooks
hooks.addAction('user_register', (user: any) => {
  console.log(`User registered: ${user.username}`);
});

hooks.addAction('wp_login', (user: any) => {
  console.log(`User logged in: ${user.username}`);
});

hooks.addAction('wp_logout', (user: any) => {
  console.log(`User logged out: ${user.username}`);
});

// Theme hooks
hooks.addAction('switch_theme', (newTheme: any, oldTheme: any) => {
  console.log(`Theme switched from ${oldTheme?.name} to ${newTheme.name}`);
});

// Plugin hooks
hooks.addAction('activate_plugin', (plugin: any) => {
  console.log(`Plugin activated: ${plugin.name}`);
});

hooks.addAction('deactivate_plugin', (plugin: any) => {
  console.log(`Plugin deactivated: ${plugin.name}`);
});

// Content filters
hooks.addFilter('the_content', (content: any) => {
  // Auto-format paragraphs
  return content.replace(/\n\n/g, '</p><p>').replace(/^/, '<p>').replace(/$/, '</p>');
});

hooks.addFilter('the_title', (title: any) => {
  // Trim whitespace from titles
  return title.trim();
});

hooks.addFilter('the_excerpt', (excerpt: any) => {
  // Ensure excerpt ends with ellipsis
  return excerpt.endsWith('...') ? excerpt : excerpt + '...';
});

export default hooks;
