declare global {
  interface Window {
    freighterApi: {
      isConnected: () => Promise<boolean>;
      getPublicKey: () => Promise<string>;
      getNetwork: () => Promise<{ network: string; networkPassphrase: string }>;
      signTransaction: (xdr: string, opts?: any) => Promise<string>;
    };
  }
}

export {};
