// src/contracts/index.ts
import ProfileRegistryArtifact from '../artifacts/AztlanProfileRegistry.json' assert { type: 'json' };
import PrivateSocialArtifact from '../artifacts/AztlanPrivateSocial.json' assert { type: 'json' };

export const CONTRACT_ADDRESSES = {
  ProfileRegistry: '0x2dc4889b4091dc91d37f103128ab68b17f0b37533bbe66ba4f69f32781b23468',
  PrivateSocials: '0x208719c6c69469c79fd098b79534f0218b1628e3bbbaffbedad7f52d57b2d154'
};

export const CONTRACT_ARTIFACTS = {
  ProfileRegistry: ProfileRegistryArtifact,
  PrivateSocials: PrivateSocialArtifact
};

export const getContract = async (contractName, wallet) => {
  const address = CONTRACT_ADDRESSES[contractName];
  const artifact = CONTRACT_ARTIFACTS[contractName];
  
  if (!address || !artifact) {
    throw new Error(`Contract ${contractName} not found`);
  }
  
  return await Contract.at(address, artifact, wallet);
};
