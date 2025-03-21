import { IClientSideProvider, INetwork } from '@ijstech/eth-wallet';

export interface IExtendedNetwork extends INetwork {
	symbol?: string;
	env?: string;
	explorerName?: string;
	explorerTxUrl?: string;
	explorerAddressUrl?: string;
	isDisabled?: boolean;
};

export interface INetworkConfig {
  chainName?: string;
  chainId: number;
}

export enum WalletPlugin {
	MetaMask = 'metamask',
	WalletConnect = 'walletconnect',
	Email = 'email',
	Google = 'google',
	Ton = 'tonwallet'
}

export interface IWalletPlugin {
	name: string;
	displayName?: string;
	image?: string;
	packageName?: string;
	provider: IClientSideProvider;
}

export interface IPackage {
  module: string;
  script?: string;
}
