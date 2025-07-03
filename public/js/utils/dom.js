class DOMUtils {
    static $(selector, context = document) {
        return context.querySelector(selector);
    }

    static $$(selector, context = document) {
        return Array.from(context.querySelectorAll(selector));
    }

    static create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        if (content) {
            element.innerHTML = content;
        }

        return element;
    }

    static on(element, event, handler, options = {}) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        
        if (element) {
            element.addEventListener(event, handler, options);
        }
    }

    static off(element, event, handler) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        
        if (element) {
            element.removeEventListener(event, handler);
        }
    }

    static delegate(parent, selector, event, handler) {
        this.on(parent, event, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler.call(target, e);
            }
        });
    }

    static hide(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.style.display = 'none';
        }
    }

    static show(element, display = 'block') {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.style.display = display;
        }
    }

    static toggle(element) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            const isHidden = element.style.display === 'none' || 
                           getComputedStyle(element).display === 'none';
            this[isHidden ? 'show' : 'hide'](element);
        }
    }

    static addClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.add(className);
        }
    }

    static removeClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.remove(className);
        }
    }

    static toggleClass(element, className) {
        if (typeof element === 'string') {
            element = this.$(element);
        }
        if (element) {
            element.classList.toggle(className);
        }
    }

    static ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

window.DOMUtils = DOMUtils;
window.$ = DOMUtils.$;
window.$$ = DOMUtils.$$;