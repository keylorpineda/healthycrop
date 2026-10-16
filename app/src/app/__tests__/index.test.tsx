import React from 'react';
import { render, screen } from '@testing-library/react-native';

import i18n from '@/i18n';
import IndexScreen from '../index';

describe('IndexScreen (Home Landing / Branding)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es');
  });

  it('renders app branding and non-replacement agronomic disclaimer in Spanish', () => {
    render(<IndexScreen />);

    expect(screen.getByTestId('app-title')).toHaveTextContent('HealthyCrop');
    expect(screen.getByTestId('app-tagline')).toHaveTextContent(
      'Diagnóstico de cultivos fuera de línea',
    );
    expect(screen.getByTestId('app-disclaimer')).toHaveTextContent(/no reemplaza el criterio/i);
  });

  it('updates rendered copy when language changes to English', async () => {
    await i18n.changeLanguage('en');
    render(<IndexScreen />);

    expect(screen.getByTestId('app-title')).toHaveTextContent('HealthyCrop');
    expect(screen.getByTestId('app-tagline')).toHaveTextContent('Offline crop diagnostics');
    expect(screen.getByTestId('app-disclaimer')).toHaveTextContent(
      /does not replace the judgment/i,
    );
  });
});
