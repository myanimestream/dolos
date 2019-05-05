module.exports = {
    browser: true,
    roots: [
        "<rootDir>/src"
    ],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node"
    ],
    moduleNameMapper: {
        "^dolos(.*)$": "<rootDir>/src$1",
    },
    setupFiles: [
        "jest-webextension-mock"
    ],
    reporters: ["default", "jest-junit"],
};
