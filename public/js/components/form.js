class FormHandler {
    constructor(formElement, options = {}) {
        this.form = formElement;
        this.options = {
            onSubmit: null,
            validation: {},
            ...options
        };
        this.init();
    }

    init() {
        this.setupValidation();
        this.setupSubmission();
        this.setupCharacterCounters();
    }

    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    setupSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!this.validateForm()) {
                return;
            }

            const submitBtn = this.form.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';
            }

            try {
                if (this.options.onSubmit) {
                    await this.options.onSubmit(this.getFormData());
                }
            } catch (error) {
                NotificationSystem.error(error.message || 'An error occurred');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }

    setupCharacterCounters() {
        const fields = this.form.querySelectorAll('[data-max-length]');
        fields.forEach(field => {
            const maxLength = parseInt(field.dataset.maxLength);
            const counterId = field.dataset.counter;
            const counter = counterId ? document.getElementById(counterId) : null;

            if (counter) {
                const updateCounter = () => {
                    const length = field.value.length;
                    counter.textContent = `${length}/${maxLength}`;
                    
                    if (length > maxLength * 0.9) {
                        counter.className = 'char-counter warning';
                    } else if (length > maxLength * 0.8) {
                        counter.className = 'char-counter caution';
                    } else {
                        counter.className = 'char-counter';
                    }
                };

                field.addEventListener('input', updateCounter);
                updateCounter(); // Initial count
            }
        });
    }

    validateField(field) {
        const rules = this.options.validation[field.name] || [];
        const value = field.value.trim();

        for (const rule of rules) {
            const result = rule(value, field);
            if (result !== true) {
                this.showFieldError(field, result);
                return false;
            }
        }

        this.clearFieldError(field);
        return true;
    }

    validateForm() {
        const fields = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const error = document.createElement('div');
        error.className = 'field-error';
        error.textContent = message;
        
        field.parentNode.appendChild(error);
        field.classList.add('field-invalid');
    }

    clearFieldError(field) {
        const error = field.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
        field.classList.remove('field-invalid');
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    reset() {
        this.form.reset();
        this.form.querySelectorAll('.field-error').forEach(error => error.remove());
        this.form.querySelectorAll('.field-invalid').forEach(field => {
            field.classList.remove('field-invalid');
        });
    }
}

// Common validation rules
const ValidationRules = {
    required: (value) => value.length > 0 || 'This field is required',
    
    minLength: (min) => (value) => 
        value.length >= min || `Minimum ${min} characters required`,
    
    maxLength: (max) => (value) => 
        value.length <= max || `Maximum ${max} characters allowed`,
    
    noSpecialChars: (value) => 
        !/[!@#$%^&*(),.?":{}|<>]/g.test(value) || 'Special characters not allowed',
    
    email: (value) => 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format'
};

window.FormHandler = FormHandler;
window.ValidationRules = ValidationRules;