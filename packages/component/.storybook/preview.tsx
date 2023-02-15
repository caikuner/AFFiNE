import React from 'react';
import { useDarkMode } from 'storybook-dark-mode';
import { getLightTheme, ThemeProvider } from '../src';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

const lightTheme = getLightTheme('page');
const darkTheme = getLightTheme('page');

export const decorators = [
  (Story: React.ComponentType) => {
    const isDark = useDarkMode();
    return (
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <Story />
      </ThemeProvider>
    );
  },
];
