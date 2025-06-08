// src/utils/aztecCache.ts
class AztecCache {
  private contracts = new Map();
  private accounts = new Map();
  private static instance: AztecCache;

  static getInstance(): AztecCache {
    if (!AztecCache.instance) {
      AztecCache.instance = new AztecCache();
    }
    return AztecCache.instance;
  }

  cacheContract(address: string, contract: any) {
    this.contracts.set(address, contract);
  }

  getContract(address: string) {
    return this.contracts.get(address);
  }

  cacheAccount(address: string, account: any) {
    this.accounts.set(address, account);
  }

  getAccount(address: string) {
    return this.accounts.get(address);
  }

  clear() {
    this.contracts.clear();
    this.accounts.clear();
  }
}

export const aztecCache = AztecCache.getInstance();
