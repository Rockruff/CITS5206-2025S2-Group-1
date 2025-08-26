import { useEffect, useState } from "react";

/**
 * Returns true only on the client side.
 * Useful to render components that use `window` or `document`.
 */
export function useClientOnly(): boolean {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Wraps a component so it only renders on the client
 */
export function withClientOnly<P extends object>(Component: React.ComponentType<P>) {
  const Wrapped: React.FC<P> = (props) => {
    const isClient = useClientOnly();
    if (!isClient) return null;
    return <Component {...props} />;
  };

  return Wrapped;
}
