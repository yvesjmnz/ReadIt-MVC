class DropdownManager {
    constructor() {
        this.init();
    }

    init() {
        DOMUtils.ready(() => {
            this.setupGlobalDropdownHandlers();
        });
    }

    setupGlobalDropdownHandlers() {
        // Handle dropdown clicks
        DOMUtils.delegate(document, '.dropdown', 'click', this.handleDropdownClick.bind(this));
        
        // Close dropdowns when clicking outside
        DOMUtils.on(document, 'click', this.handleDocumentClick.bind(this));
        
        // Close dropdowns on escape key
        DOMUtils.on(document, 'keydown', this.handleEscapeKey.bind(this));
    }

    handleDropdownClick(e) {
        e.stopPropagation();
        const dropdown = e.currentTarget;
        const content = dropdown.querySelector('.dropdown-content');
        
        if (!content) return;

        // Close all other dropdowns first
        this.closeAllDropdowns(content);
        
        // Toggle current dropdown
        DOMUtils.toggleClass(content, 'show');
    }

    handleDocumentClick(e) {
        // Close all dropdowns if clicking outside
        if (!e.target.closest('.dropdown')) {
            this.closeAllDropdowns();
        }
    }

    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            this.closeAllDropdowns();
        }
    }

    closeAllDropdowns(except = null) {
        const dropdowns = $$('.dropdown-content.show');
        dropdowns.forEach(dropdown => {
            if (dropdown !== except) {
                DOMUtils.removeClass(dropdown, 'show');
            }
        });
    }

    // Public method to programmatically close all dropdowns
    static closeAll() {
        const dropdowns = $$('.dropdown-content.show');
        dropdowns.forEach(dropdown => {
            DOMUtils.removeClass(dropdown, 'show');
        });
    }

    // Public method to open a specific dropdown
    static open(dropdownElement) {
        const content = dropdownElement.querySelector('.dropdown-content');
        if (content) {
            // Close others first
            DropdownManager.closeAll();
            DOMUtils.addClass(content, 'show');
        }
    }

    // Public method to close a specific dropdown
    static close(dropdownElement) {
        const content = dropdownElement.querySelector('.dropdown-content');
        if (content) {
            DOMUtils.removeClass(content, 'show');
        }
    }
}

// Initialize global dropdown manager
new DropdownManager();

// Export for use in other components
window.DropdownManager = DropdownManager;