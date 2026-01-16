// src/types/auth.ts

type User = {
    id: string;
    username: string;
    email: string;
    createdAt: Date;
};


type Session = {
    sessionId: string;
    userId: string;
    createdAt: Date;
    expiresAt: Date;
};


type UserSecurity = {
    userId: string;
    hashedPassword: string;
    securityQuestions: SecurityQuestion[];
};


type SecurityQuestion = {
    question: string;
    answer: string;
};

export { User, Session, UserSecurity, SecurityQuestion };