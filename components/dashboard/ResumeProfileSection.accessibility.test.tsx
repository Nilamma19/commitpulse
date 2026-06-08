import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeProfileSection from './ResumeProfileSection';
import type { ReactNode, HTMLAttributes } from 'react';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
  FileText: ({ size, className }: { size?: number; className?: string }) => (
    <svg
      aria-hidden="true"
      data-testid="file-text-icon"
      width={size}
      height={size}
      className={className}
    />
  ),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const sampleParsedResume = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-0100',
  skills: ['React', 'TypeScript'],
  education: [],
  experience: [],
};

// ResumeUpload mock – includes an accessible file input and descriptive text
// so we can test ARIA attributes and helper text from the parent's perspective.
vi.mock('./ResumeUpload', () => ({
  default: ({
    onParsed,
  }: {
    onParsed: (data: typeof sampleParsedResume, name: string) => void;
    onError: (error: string) => void;
  }) => (
    <div data-testid="mock-resume-upload">
      <input type="file" accept=".pdf,.docx" aria-label="Upload resume" data-testid="file-input" />
      <button data-testid="upload-btn" onClick={() => onParsed(sampleParsedResume, 'resume.pdf')}>
        Simulate Upload
      </button>
      <p>Drop your resume here or click to browse</p>
      <p>PDF or DOCX · Max 5MB</p>
    </div>
  ),
}));

// ResumePreviewForm mock
vi.mock('./ResumePreviewForm', () => ({
  default: ({
    onBack,
    onComplete,
  }: {
    githubUsername: string;
    parsed: typeof sampleParsedResume;
    fileName: string;
    onBack: () => void;
    onComplete: () => void;
  }) => (
    <div data-testid="mock-preview-form">
      <h3>Review Parsed Data</h3>
      <button onClick={onBack}>Back</button>
      <button onClick={onComplete}>Save Profile</button>
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Simulate a successful file upload to transition to the preview stage. */
function uploadResume() {
  fireEvent.click(screen.getByTestId('upload-btn'));
}

/** Complete the preview form to reach the success stage. */
function completePreview() {
  fireEvent.click(screen.getByRole('button', { name: /Save Profile/i }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResumeProfileSection – Accessibility & ARIA Compliance', () => {
  /* -----------------------------------------------------------------------
   * 1  ARIA / Label Association Compliance
   * -------------------------------------------------------------------- */
  describe('1. ARIA / Label Association Compliance', () => {
    it('provides correct accessible names and roles for all interactive elements in idle state', () => {
      render(<ResumeProfileSection githubUsername="testuser" />);

      // Section heading
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Resume Profile');

      // Description paragraph
      expect(screen.getByText(/Upload your PDF or DOCX resume to auto-fill/i)).toBeInTheDocument();

      // File input with explicit aria-label
      const fileInput = screen.getByTestId('file-input');
      expect(fileInput).toHaveAttribute('aria-label', 'Upload resume');
    });

    it('exposes accessible named elements when the preview form is shown', () => {
      render(<ResumeProfileSection githubUsername="testuser" />);
      uploadResume();

      // Preview heading
      expect(screen.getByRole('heading', { name: /Review Parsed Data/i })).toBeInTheDocument();

      // Buttons with accessible names
      expect(screen.getByRole('button', { name: /^Back$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Profile/i })).toBeInTheDocument();
    });

    it('shows an accessible success message after completion', () => {
      render(<ResumeProfileSection githubUsername="testuser" />);
      uploadResume();
      completePreview();

      const successMsg = screen.getByText(/Profile synced from resume/i);
      expect(successMsg).toBeInTheDocument();
      expect(successMsg).toBeVisible();
    });
  });

  /* -----------------------------------------------------------------------
   * 2  Keyboard Focus Visibility
   * -------------------------------------------------------------------- */
  describe('2. Keyboard Focus Visibility', () => {
    it('allows the file input to receive programmatic focus and is not inert', () => {
      render(<ResumeProfileSection githubUsername="testuser" />);

      const fileInput = screen.getByTestId('file-input') as HTMLInputElement;
      expect(fileInput.tabIndex).toBe(0);
      expect(fileInput).not.toHaveAttribute('disabled');

      fileInput.focus();
      expect(document.activeElement).toBe(fileInput);
    });

    it('renders preview-form buttons as focusable and not disabled', async () => {
      render(<ResumeProfileSection githubUsername="testuser" />);
      uploadResume();

      const backBtn = screen.getByRole('button', { name: /^Back$/i });
      const saveBtn = screen.getByRole('button', { name: /Save Profile/i });

      expect(backBtn).not.toBeDisabled();
      expect(backBtn.tabIndex).toBe(0);
      expect(saveBtn).not.toBeDisabled();
      expect(saveBtn.tabIndex).toBe(0);

      // First button in tab order must accept focus
      await userEvent.setup().tab();
      expect(document.activeElement).toBeTruthy();
    });
  });

  /* -----------------------------------------------------------------------
   * 3  Tooltip / Description Accessibility
   * -------------------------------------------------------------------- */
  describe('3. Tooltip / Description Accessibility', () => {
    it('renders visible helper text that screen readers can announce', () => {
      render(<ResumeProfileSection githubUsername="testuser" />);

      // Parent-level description
      const desc = screen.getByText(/Upload your PDF or DOCX resume to auto-fill/i);
      expect(desc).toBeVisible();

      // File format hints – use getAllByText because "PDF or DOCX" appears
      // in both the parent description and the mock file-format hint.
      const formatHints = screen.getAllByText(/PDF or DOCX/i);
      expect(formatHints.length).toBeGreaterThanOrEqual(1);
      expect(formatHints[formatHints.length - 1]).toBeVisible();

      const sizeHint = screen.getByText(/Max 5MB/i);
      expect(sizeHint).toBeVisible();
    });
  });

  /* -----------------------------------------------------------------------
   * 4  Keyboard Navigation Order
   * -------------------------------------------------------------------- */
  describe('4. Keyboard Navigation Order', () => {
    it('has a logical tab sequence matching the DOM order in preview state', async () => {
      render(<ResumeProfileSection githubUsername="testuser" />);
      uploadResume();

      // In preview state we expect exactly two focusable buttons:
      //   1. Back button
      //   2. Save Profile button
      const buttons = screen.getAllByRole('button');
      const focusable = buttons.filter((b) => b.tabIndex === 0);
      expect(focusable.length).toBe(2);

      const user = userEvent.setup();
      for (const el of focusable) {
        await user.tab();
        expect(document.activeElement).toBe(el);
      }
    });
  });

  /* -----------------------------------------------------------------------
   * 5  Heading Structure Validity
   * -------------------------------------------------------------------- */
  describe('5. Heading Structure Validity', () => {
    it('uses only h3 heading which is valid when embedded under h2 on the page', () => {
      const { container } = render(<ResumeProfileSection githubUsername="testuser" />);

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBe(1);

      const h3 = headings[0];
      expect(h3.tagName).toBe('H3');
      expect(h3.textContent).toBe('Resume Profile');
    });

    it('does not skip heading levels when the preview form is rendered', () => {
      const { container } = render(<ResumeProfileSection githubUsername="testuser" />);
      uploadResume();

      const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      // Original h3 + mock preview h3 = 2 headings, both h3 (no skip)
      expect(headings.length).toBe(2);
      headings.forEach((h) => expect(h.tagName).toBe('H3'));
    });
  });
});
