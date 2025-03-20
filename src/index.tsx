import { Module, Container, customModule, customElements, ControlElement, application } from '@ijstech/components';
import { } from '@ijstech/eth-contract';
import { INetworkConfig, IWalletPlugin } from './interface';
import ScomDappContainer from '@scom/scom-dapp-container';
import ScomContractDeployerDeployer from './deployer';
import configData from './defaultData';
import { INetwork, Wallet } from '@ijstech/eth-wallet';

declare global {
	namespace JSX {
		interface IntrinsicElements {
			['i-scom-contract-deployer-widget']: ContractDeployerElement;
		}
	}
}

interface ContractDeployerElement extends ControlElement {
	networks?: INetworkConfig[];
	wallets?: IWalletPlugin[];
	contract?: string;
	defaultChainId?: number;
}

interface IData {
	networks?: INetworkConfig[];
	wallets?: IWalletPlugin[];
	contract?: string;
	defaultChainId?: number;
}

@customModule
@customElements('i-scom-contract-deployer-widget')
export default class ScomContractDeployer extends Module {
	private dappContainer: ScomDappContainer;
	private deployer: ScomContractDeployerDeployer;
	
	private _data: IData = {};
	private rpcWalletId: string = '';

	constructor(parent?: Container, options?: any) {
		super(parent, options);
	};

	get networks() {
		return this._data?.networks ?? configData.defaultData.networks;
	}
	set networks(value: INetworkConfig[]) {
		this._data.networks = value;
	}

	get wallets() {
		return this._data?.wallets ?? configData.defaultData.wallets;
	}
	set wallets(value: any[]) {
		this._data.wallets = value;
	}

	get contract() {
		return this._data?.contract;
	}
	set contract(value: string) {
		this._data.contract = value;
	}

	get defaultChainId() {
		return this._data?.defaultChainId ?? configData.defaultData.defaultChainId;
	}
	set defaultChainId(value: number) {
		this._data.defaultChainId = value;
	}

	async setData(data: IData) {
		this._data = data;
		if (this.contract) this.deployer.setData(this.contract);
		if (this.dappContainer) {
			this.initRpcWallet(this.defaultChainId);
			await this.dappContainer.setData({
				networks: this.networks,
				wallets: this.wallets,
				showFooter: false,
				showHeader: true,
				defaultChainId: this.defaultChainId,
				rpcWalletId: this.rpcWalletId,
				showWalletNetwork: true
			})
		}
	}

	private initRpcWallet(defaultChainId: number) {
		if (this.rpcWalletId) {
			return this.rpcWalletId;
		}
		const clientWallet = Wallet.getClientInstance();
		const networkList: INetwork[] = Object.values(application.store?.networkMap || []);
		const instanceId = clientWallet.initRpcWallet({
			networks: networkList,
			defaultChainId,
			infuraId: application.store?.infuraId,
			multicalls: application.store?.multicalls
		});
		this.rpcWalletId = instanceId;
		if (clientWallet.address) {
			const rpcWallet = Wallet.getRpcWalletInstance(instanceId);
			rpcWallet.address = clientWallet.address;
		}
		return instanceId;
	}

	async init() {
		super.init();
		const contract = this.getAttribute('contract', true);
		const networks = this.getAttribute('networks', true);
		const wallets = this.getAttribute('wallets', true);

		await this.setData({ contract, networks, wallets });
	};

	render() {
		return (
			<i-scom-dapp-container id="dappContainer">
				<i-panel>
					<i-scom-contract-deployer-widget--deployer
						id="deployer"
					/>
					<i-button id="btnTonWallet" visible={false} />
				</i-panel>
			</i-scom-dapp-container>
		)
	};
};