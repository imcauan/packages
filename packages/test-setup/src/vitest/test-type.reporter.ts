import { DefaultReporter, TestCase, TestModule, TestSuite } from 'vitest/node';

export type TestTypeLabelColor =
  | 'blue'
  | 'cyan'
  | 'green'
  | 'magenta'
  | 'yellow';

type TestEntity = TestCase | TestModule | TestSuite;

export type TestTypeLabel = {
  label: string;
  color?: TestTypeLabelColor;
};

export type TestTypeRule = TestTypeLabel & {
  pattern: RegExp;
};

export type TestTypeReporterOptions = {
  defaultLabel: TestTypeLabel;
  labels?: TestTypeRule[];
  summary?: boolean;
};

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const WHITE = '\x1b[97m';
const BLACK = '\x1b[30m';

export class TestTypeReporter extends DefaultReporter {
  constructor(private readonly testTypeOptions: TestTypeReporterOptions) {
    super(testTypeOptions);
  }

  protected override getEntityPrefix(entity: TestEntity): string {
    return `${super.getEntityPrefix(entity)} ${this.formatLabel(entity)}`;
  }

  private formatLabel(entity: TestEntity): string {
    const testType = this.getTestType(entity);
    const label = ` ${testType.label} `;

    if (process.env.NO_COLOR) {
      return `[${testType.label}]`;
    }

    return `${this.backgroundColor(testType)}${this.foregroundColor(testType)}${BOLD}${label}${RESET}`;
  }

  private getTestType(entity: TestEntity): TestTypeLabel {
    const moduleId =
      entity.type === 'module' ? entity.moduleId : entity.module.moduleId;

    return (
      this.testTypeOptions.labels?.find(({ pattern }) =>
        pattern.test(moduleId),
      ) ?? this.testTypeOptions.defaultLabel
    );
  }

  private backgroundColor(testType: TestTypeLabel): string {
    switch (testType.color) {
      case 'blue':
        return '\x1b[44m';
      case 'green':
        return '\x1b[42m';
      case 'magenta':
        return '\x1b[45m';
      case 'yellow':
        return '\x1b[43m';
      case 'cyan':
      default:
        return '\x1b[46m';
    }
  }

  private foregroundColor(testType: TestTypeLabel): string {
    return testType.color === 'yellow' ? BLACK : WHITE;
  }
}
