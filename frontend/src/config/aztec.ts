// src/config/aztec.ts
interface AztecConfig {
  pxeUrl: string;
  network: 'sandbox' | 'testnet' | 'mainnet';
  contractAddresses: Record<string, string>;
}

const config: AztecConfig = {
  pxeUrl: process.env.REACT_APP_PXE_URL || 'https://aztec-alpha-testnet-fullnode.zkv.xyz',
  network: (process.env.REACT_APP_NETWORK as any) || 'testnet',
  contractAddresses: {
    ProfileRegistry: process.env.REACT_APP_PROFILE_REGISTRY_ADDRESS || 
      '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
    PrivateSocials: process.env.REACT_APP_PRIVATE_SOCIALS_ADDRESS || 
      '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
  }
};

export default config;
