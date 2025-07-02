module.exports = {
    // Check if two values are equal
    eq: function(a, b) {
        return a === b;
    },
    
    // Check if array includes a value
    includes: function(array, value) {
        if (!Array.isArray(array)) return false;
        return array.includes(value);
    },
    
    // Logical OR operation
    or: function() {
        const args = Array.prototype.slice.call(arguments, 0, -1); // Remove options object
        return args.some(arg => !!arg);
    },
    
    // Logical AND operation
    and: function() {
        const args = Array.prototype.slice.call(arguments, 0, -1); // Remove options object
        return args.every(arg => !!arg);
    },
    
    // Logical NOT operation
    not: function(value) {
        return !value;
    },
    
    // Check if value is not equal
    ne: function(a, b) {
        return a !== b;
    },
    
    // Check if value is greater than
    gt: function(a, b) {
        return a > b;
    },
    
    // Check if value is less than
    lt: function(a, b) {
        return a < b;
    },
    
    // Format date
    formatDate: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString();
    },
    
    // Format date with time
    formatDateTime: function(date) {
        if (!date) return '';
        return new Date(date).toLocaleString();
    },
    
    // Truncate text
    truncate: function(text, length) {
        if (!text) return '';
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },
    
    // Capitalize first letter
    capitalize: function(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    },
    
    // Check if user is moderator or creator
    isModerator: function(userRole) {
        return userRole === 'moderator' || userRole === 'creator';
    },
    
    // Check if user is creator
    isCreator: function(userRole) {
        return userRole === 'creator';
    },
    
    // Get role display name
    getRoleDisplay: function(role) {
        switch(role) {
            case 'creator': return '👑 Creator';
            case 'moderator': return '🛡️ Moderator';
            case 'member': return '👤 Member';
            default: return '👥 Guest';
        }
    },
    
    // Check if user can moderate (is creator or moderator)
    canModerate: function(userRole, postAuthor, currentUser) {
        return userRole === 'creator' || 
               userRole === 'moderator' || 
               (postAuthor && currentUser && postAuthor === currentUser);
    },
    
    // JSON stringify for debugging
    json: function(context) {
        return JSON.stringify(context);
    }
};