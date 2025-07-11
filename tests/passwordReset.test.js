const PasswordResetService = require('../services/passwordResetService');
const UserService = require('../services/userService');

describe('Password Reset Service', () => {
    describe('Security Questions', () => {
        test('should provide sufficiently random security questions', () => {
            const questions = PasswordResetService.getSecurityQuestions();
            
            // Should have multiple questions
            expect(questions.length).toBeGreaterThan(5);
            
            // Questions should encourage specific answers
            const hasSpecificQuestions = questions.some(q => 
                q.includes('combined with') || 
                q.includes('and the') ||
                q.includes('(e.g.,')
            );
            expect(hasSpecificQuestions).toBe(true);
        });

        test('should reject common answers', async () => {
            const commonAnswers = [
                { question: 'Test question', answer: 'The Bible' },
                { question: 'Test question 2', answer: 'blue' },
                { question: 'Test question 3', answer: 'mom' }
            ];

            await expect(
                PasswordResetService.setSecurityQuestions('testuser', commonAnswers)
            ).rejects.toThrow('too common');
        });

        test('should require at least 3 security questions', async () => {
            const insufficientQuestions = [
                { question: 'Test question', answer: 'Specific Answer 123' },
                { question: 'Test question 2', answer: 'Another Specific Answer' }
            ];

            await expect(
                PasswordResetService.setSecurityQuestions('testuser', insufficientQuestions)
            ).rejects.toThrow('at least 3 security questions');
        });

        test('should require minimum answer length', async () => {
            const shortAnswers = [
                { question: 'Test question', answer: 'ab' },
                { question: 'Test question 2', answer: 'Specific Answer' },
                { question: 'Test question 3', answer: 'Another Answer' }
            ];

            await expect(
                PasswordResetService.setSecurityQuestions('testuser', shortAnswers)
            ).rejects.toThrow('at least 3 characters long');
        });
    });

    describe('Password Strength', () => {
        test('should enforce strong password requirements', () => {
            // Test weak passwords
            expect(UserService.isPasswordStrong('password')).toBe(false);
            expect(UserService.isPasswordStrong('Password1')).toBe(false);
            expect(UserService.isPasswordStrong('Password123')).toBe(false);
            
            // Test strong password
            expect(UserService.isPasswordStrong('MySecureP@ssw0rd123')).toBe(true);
        });
    });

    describe('Password Reset Flow', () => {
        test('should require at least 2 correct security answers', async () => {
            const insufficientAnswers = [
                { question: 'Test question', answer: 'wrong answer' }
            ];

            await expect(
                PasswordResetService.validateSecurityAnswers('testuser', insufficientAnswers)
            ).rejects.toThrow('at least 2 security questions');
        });
    });
});

module.exports = {
    testSecurityQuestions: () => {
        console.log('Testing security questions...');
        const questions = PasswordResetService.getSecurityQuestions();
        console.log(`✓ Found ${questions.length} security questions`);
        
        // Check for specificity indicators
        const specificQuestions = questions.filter(q => 
            q.includes('combined with') || 
            q.includes('and the') ||
            q.includes('(e.g.,')
        );
        console.log(`✓ ${specificQuestions.length} questions encourage specific answers`);
        
        return questions.length > 5 && specificQuestions.length > 0;
    }
};