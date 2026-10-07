import type { TestTypeReporterOptions } from '@imcauan/test-setup/vitest';

export const unitIntegrationTestTypes: TestTypeReporterOptions = {
  defaultLabel: { label: 'unit', color: 'cyan' },
  labels: [
    { pattern: /\.spec\.[cm]?[tj]sx?$/, label: 'unit', color: 'cyan' },
    {
      pattern: /\.test\.[cm]?[tj]sx?$/,
      label: 'integration',
      color: 'green',
    },
  ],
};

export const browserTestType: TestTypeReporterOptions = {
  defaultLabel: { label: 'browser', color: 'magenta' },
};

export const integrationTestType: TestTypeReporterOptions = {
  defaultLabel: { label: 'integration', color: 'green' },
};

export const apiIntegrationTestTypes: TestTypeReporterOptions = {
  defaultLabel: { label: 'integration', color: 'green' },
  labels: [
    {
      pattern: /\.e2e[-.]spec\.[cm]?[tj]sx?$/,
      label: 'e2e',
      color: 'magenta',
    },
    {
      pattern: /\.test\.[cm]?[tj]sx?$/,
      label: 'integration',
      color: 'green',
    },
  ],
};
