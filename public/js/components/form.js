class FormHandler {
    constructor(formElement, options = {}) {
        this.form = formElement;
        this.options = {
            onSubmit: null,
            ...options
        };
        this.init();
    }

    init() {
        this.setupSubmission();
        this.setupCharacterCounters();
    }

    setupSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();

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

    // Server-side validation handles all validation logic
    // Character counters provide UX feedback only

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

window.FormHandler = FormHandler;