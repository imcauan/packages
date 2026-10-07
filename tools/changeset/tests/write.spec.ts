import { renderChangeset } from '../src/write.ts';

const makeSut = (): typeof renderChangeset => renderChangeset;

describe('renderChangeset', () => {
  it('should render the front matter and the summary', () => {
    const sut = makeSut();

    const text = sut({
      releases: [
        { name: '@imcauan/logger', bump: 'minor' },
        { name: '@imcauan/environment', bump: 'patch' },
      ],
      summary: 'Add any feature.',
    });

    expect(text).toBe(
      '---\n"@imcauan/logger": minor\n"@imcauan/environment": patch\n---\n\nAdd any feature.\n',
    );
  });
});
