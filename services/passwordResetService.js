const bcrypt = require('bcryptjs');
const User = require('../models/User');
const UserService = require('./userService');
const logger = require('./loggerService');

class PasswordResetService {
    // Predefined security questions that encourage unique answers
    static getSecurityQuestions() {
        return [
            "What was the name of your first pet and the street you lived on when you got them? (e.g., 'Fluffy Oak Street')",
            "What is the title of your favorite book combined with the author's last name? (e.g., 'Dune Herbert')",
            "What was your childhood nickname combined with your birth month? (e.g., 'Buddy March')",
            "What is your mother's maiden name combined with the city where you were born? (e.g., 'Smith Chicago')",
            "What was the make and color of your first car? (e.g., 'Honda Blue')",
            "What is the name of the hospital where you were born combined with your birth year? (e.g., 'General 1990')",
            "What was your favorite teacher's last name and the subject they taught? (e.g., 'Johnson Math')",
            "What is the name of your best friend from childhood combined with their favorite color? (e.g., 'Sarah Green')",
            "What was the first concert you attended and the year? (e.g., 'Beatles 1995')",
            "What is your favorite movie combined with the year it was released? (e.g., 'Inception 2010')"
        ];
    }

    static async setSecurityQuestions(username, questionsAndAnswers, ip = null) {
        try {
            if (!Array.isArray(questionsAndAnswers) || questionsAndAnswers.length < 3) {
                throw new Error('You must set at least 3 security questions');
            }

            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }

            // Validate answers are not too common or short
            for (const qa of questionsAndAnswers) {
                if (!qa.question || !qa.answer) {
                    throw new Error('Question and answer are required');
                }
                
                const answer = qa.answer.trim().toLowerCase();
                if (answer.length < 3) {
                    throw new Error('Security answers must be at least 3 characters long');
                }

                // Check for common answers
                const commonAnswers = [
                    'the bible', 'bible', 'harry potter', 'god', 'jesus', 'mom', 'dad', 
                    'mother', 'father', 'blue', 'red', 'green', 'black', 'white',
                    'john', 'mary', 'mike', 'sarah', 'david', 'love', 'money', 'family'
                ];
                
                if (commonAnswers.includes(answer)) {
                    throw new Error(`"${qa.answer}" is too common. Please provide a more specific answer.`);
                }
            }

            // Hash the answers
            const hashedQuestions = await Promise.all(
                questionsAndAnswers.map(async (qa) => ({
                    question: qa.question,
                    answer: await bcrypt.hash(qa.answer.trim().toLowerCase(), 10),
                    createdAt: new Date()
                }))
            );

            user.securityQuestions = hashedQuestions;
            await user.save();
            
            return true;
        } catch (error) {
            logger.logSecurityQuestionsSetupFailure(username, error.message, ip);
            throw error;
        }
    }

    static async validateSecurityAnswers(username, answersProvided, ip = null) {
        try {
            const user = await User.findOne({ username });
            if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
                throw new Error('No security questions found for this user');
            }

            if (answersProvided.length < 2) {
                throw new Error('You must answer at least 2 security questions correctly');
            }

            let correctAnswers = 0;
            
            for (const providedAnswer of answersProvided) {
                const question = user.securityQuestions.find(q => 
                    q.question === providedAnswer.question
                );
                
                if (question) {
                    const isValid = await bcrypt.compare(
                        providedAnswer.answer.trim().toLowerCase(), 
                        question.answer
                    );
                    if (isValid) {
                        correctAnswers++;
                    }
                }
            }

            if (correctAnswers < 2) {
                throw new Error('Insufficient correct answers to security questions');
            }

            return true;
        } catch (error) {
            logger.logSecurityQuestionsValidationFailure(username, error.message, ip);
            throw error;
        }
    }

    static async resetPassword(username, newPassword, securityAnswers, ip = null) {
        try {
            // Validate security answers first
            await this.validateSecurityAnswers(username, securityAnswers, ip);

            const user = await User.findOne({ username });
            if (!user) {
                throw new Error('User not found');
            }

            // Use existing password validation from UserService
            if (!UserService.isPasswordStrong(newPassword)) {
                throw new Error('New password is not strong enough.');
            }

            // Check password history
            for (const old of user.passwordHistory || []) {
                if (await bcrypt.compare(newPassword, old.hash)) {
                    throw new Error('You cannot reuse a previously used password.');
                }
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedNewPassword;
            user.passwordLastChanged = new Date();
            user.failedAttempts = 0; // Reset failed attempts
            user.lockUntil = undefined; // Remove any account lock

            // Update password history
            user.passwordHistory = user.passwordHistory || [];
            user.passwordHistory.push({ 
                hash: hashedNewPassword, 
                changedAt: new Date() 
            });
            if (user.passwordHistory.length > 5) {
                user.passwordHistory.shift();
            }

            await user.save();
            return true;
        } catch (error) {
            logger.logPasswordResetFailure(username, error.message, ip);
            throw error;
        }
    }

    static async getUserSecurityQuestions(username) {
        const user = await User.findOne({ username });
        if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
            return [];
        }

        // Return only the questions, not the answers
        return user.securityQuestions.map(q => ({
            question: q.question
        }));
    }
}

module.exports = PasswordResetService;