import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, expect, it } from 'vitest';

import ContributionCity3D from './ContributionCity3D';

describe('ContributionCity3D Empty Fallback', () => {
  const fallbackHeading = /No contribution data available/i;
  const fallbackText = /Contributions will appear here once activity data is loaded/i;

  describe('fallback rendering', () => {
    it('renders fallback when data is null', () => {
      render(<ContributionCity3D data={null as unknown as never[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(fallbackHeading)).toBeInTheDocument();
      expect(screen.getByText(fallbackText)).toBeInTheDocument();
    });

    it('renders fallback when data is undefined', () => {
      render(<ContributionCity3D data={undefined as unknown as never[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(fallbackHeading)).toBeInTheDocument();
      expect(screen.getByText(fallbackText)).toBeInTheDocument();
    });

    it('renders fallback when data is an empty array', () => {
      render(<ContributionCity3D data={[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(fallbackHeading)).toBeInTheDocument();
      expect(screen.getByText(fallbackText)).toBeInTheDocument();
    });

    it('renders fallback when API returns no contribution records', () => {
      render(<ContributionCity3D data={[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(fallbackHeading)).toBeInTheDocument();
      expect(screen.getByText(fallbackText)).toBeInTheDocument();
    });
  });

  describe('runtime safety', () => {
    it('does not throw when data is null', () => {
      expect(() => render(<ContributionCity3D data={null as unknown as never[]} />)).not.toThrow();
    });

    it('does not throw when data is undefined', () => {
      expect(() =>
        render(<ContributionCity3D data={undefined as unknown as never[]} />)
      ).not.toThrow();
    });

    it('does not throw when data is empty', () => {
      expect(() => render(<ContributionCity3D data={[]} />)).not.toThrow();
    });
  });

  describe('visualization suppression', () => {
    it('does not render canvas when no data exists', () => {
      const { container } = render(<ContributionCity3D data={[]} />);

      expect(container.querySelector('canvas')).not.toBeInTheDocument();
    });

    it('does not render interaction controls when no data exists', () => {
      render(<ContributionCity3D data={[]} />);

      expect(screen.queryByText(/Drag to rotate/i)).not.toBeInTheDocument();

      expect(screen.queryByText(/Scroll to zoom/i)).not.toBeInTheDocument();
    });

    it('does not render tooltips when no data exists', () => {
      render(<ContributionCity3D data={[]} />);

      expect(screen.queryByText(/contributions?/i)).not.toBeInTheDocument();
    });
  });
});
