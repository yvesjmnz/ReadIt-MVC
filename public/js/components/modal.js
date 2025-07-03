class Modal {
    constructor(options = {}) {
        this.options = {
            title: 'Modal',
            content: '',
            className: '',
            closable: true,
            ...options
        };
        this.element = null;
        this.isOpen = false;
    }

    create() {
        const modal = document.createElement('div');
        modal.className = `modal ${this.options.className}`;
        modal.innerHTML = `
            <div class="modal-content">
                ${this.options.closable ? '<span class="modal-close">&times;</span>' : ''}
                ${this.options.title ? `<h2 class="modal-title">${this.options.title}</h2>` : ''}
                <div class="modal-body">${this.options.content}</div>
            </div>
        `;

        this.element = modal;
        this.setupEvents();
        return modal;
    }

    setupEvents() {
        if (!this.options.closable) return;

        // Handle close button clicks using event delegation
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
                this.close();
            }
            
            // Close when clicking outside modal content
            if (e.target === this.element) {
                this.close();
            }
        });

        // Handle escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        
        document.addEventListener('keydown', escapeHandler);
    }

    open() {
        if (!this.element) {
            this.create();
        }

        document.body.appendChild(this.element);
        document.body.style.overflow = 'hidden';
        this.isOpen = true;

        // Trigger animation
        requestAnimationFrame(() => {
            this.element.style.display = 'block';
        });

        return this;
    }

    close() {
        if (this.element && this.isOpen) {
            this.element.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.element.remove();
            this.isOpen = false;
        }
        return this;
    }

    setContent(content) {
        if (this.element) {
            const body = this.element.querySelector('.modal-body');
            if (body) {
                body.innerHTML = content;
            }
        }
        return this;
    }

    static confirm(title, message) {
        return new Promise((resolve) => {
            const modal = new Modal({
                title,
                content: `
                    <p>${message}</p>
                    <div class="modal-actions">
                        <button class="btn btn-danger" data-action="confirm">Yes</button>
                        <button class="btn btn-secondary" data-action="cancel">No</button>
                    </div>
                `,
                className: 'modal-confirm'
            });

            modal.open();

            modal.element.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'confirm') {
                    modal.close();
                    resolve(true);
                } else if (action === 'cancel') {
                    modal.close();
                    resolve(false);
                }
            });
        });
    }

    static alert(title, message, type = 'info') {
        const modal = new Modal({
            title,
            content: `
                <div class="alert alert-${type}">
                    <p>${message}</p>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" data-action="ok">OK</button>
                </div>
            `,
            className: 'modal-alert'
        });

        modal.open();

        modal.element.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'ok') {
                modal.close();
            }
        });

        return modal;
    }
}

window.Modal = Modal;