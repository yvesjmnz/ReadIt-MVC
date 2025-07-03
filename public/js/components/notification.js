class NotificationSystem {
    static init() {
        if (!document.getElementById('notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
    }

    static show(message, type = 'info') {
        this.init();
        
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove
        const autoRemove = setTimeout(() => {
            this.remove(notification);
        }, 5000);
        
        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoRemove);
            this.remove(notification);
        });

        return notification;
    }

    static remove(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }

    static success(message) {
        return this.show(message, 'success');
    }

    static error(message) {
        return this.show(message, 'error');
    }

    static warning(message) {
        return this.show(message, 'warning');
    }

    static info(message) {
        return this.show(message, 'info');
    }
}

window.NotificationSystem = NotificationSystem;