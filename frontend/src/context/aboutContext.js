import { createContext, useContext } from 'react';

// Lets any screen open the About panel without passing a handler through
// every page component. App provides the opener.
export const AboutContext = createContext(() => {});

export function useOpenAbout() {
  return useContext(AboutContext);
}
