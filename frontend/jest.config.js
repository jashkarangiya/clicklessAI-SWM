const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

const config = {
    coverageProvider: 'v8',
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./jest.setup.js'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'jest-transform-stub',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            'jest-transform-stub',
    },
    testMatch: ['<rootDir>/src/tests/**/*.test.{ts,tsx}'],
};

module.exports = createJestConfig(config);
