// src/hooks/useContractMethod.ts
import { useState, useCallback } from 'react';
import { useWalletStore } from '../store/walletStore';

export const useContractMethod = (contractName, methodName) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const getContract = useWalletStore(state => state.getContract);

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const contract = await getContract(contractName);
      const tx = await contract.methods[methodName](...args).send();
      const receipt = await tx.wait();
      
      if (receipt.status === 'success') {
        return receipt;
      } else {
        throw new Error(`Transaction failed: ${receipt.error || 'Unknown error'}`);
      }
    } catch (err) {
      const errorMessage = err.message || 'Transaction failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [contractName, methodName, getContract]);

  return { execute, isLoading, error };
};

// Usage example
export const useCreateProfile = () => {
  return useContractMethod('ProfileRegistry', 'create_profile');
};

export const useCreatePost = () => {
  return useContractMethod('PrivateSocials', 'create_post');
};
