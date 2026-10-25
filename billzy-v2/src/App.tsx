import React from 'react';
import { HeroUIProvider } from '@heroui/react';
import { HollowHeroDashboard } from './components/HollowHeroDashboard';

export const App: React.FC = () => {
  return (
    <HeroUIProvider>
      <HollowHeroDashboard />
    </HeroUIProvider>
  );
};

export default App;
