var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define("@scom/contract-deployer-widget/interface.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.WalletPlugin = void 0;
    ;
    var WalletPlugin;
    (function (WalletPlugin) {
        WalletPlugin["MetaMask"] = "metamask";
        WalletPlugin["WalletConnect"] = "walletconnect";
        WalletPlugin["Email"] = "email";
        WalletPlugin["Google"] = "google";
        WalletPlugin["Ton"] = "tonwallet";
    })(WalletPlugin = exports.WalletPlugin || (exports.WalletPlugin = {}));
});
define("@scom/contract-deployer-widget/index.css.ts", ["require", "exports", "@ijstech/components"], function (require, exports, components_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = components_1.Styles.style({
        $nest: {
            'textarea': {
                border: 'none',
                outline: 'none'
            },
            '.preview-wrap': {
                whiteSpace: 'pre-wrap'
            },
            '.prevent-select': {
                userSelect: 'none',
                "-webkit-user-select": "none"
            }
        }
    });
});
define("@scom/contract-deployer-widget/store.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getWalletModel = exports.setWalletModel = void 0;
    ///<amd-module name='@scom/contract-deployer-widget/store.ts'/> 
    const state = {
        walletModel: null
    };
    const setWalletModel = (value) => {
        state.walletModel = value;
    };
    exports.setWalletModel = setWalletModel;
    const getWalletModel = () => {
        return state.walletModel;
    };
    exports.getWalletModel = getWalletModel;
});
define("@scom/contract-deployer-widget/deployer.tsx", ["require", "exports", "@ijstech/components", "@ijstech/eth-wallet", "@scom/contract-deployer-widget/index.css.ts", "@scom/contract-deployer-widget/store.ts"], function (require, exports, components_2, eth_wallet_1, index_css_1, store_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const Theme = components_2.Styles.Theme.ThemeVars;
    ;
    let ScomContractDeployerDeployer = class ScomContractDeployerDeployer extends components_2.Module {
        constructor() {
            super(...arguments);
            this._data = { contract: '', dependencies: [], script: '' };
        }
        get contract() {
            return this._data.contract;
        }
        set contract(value) {
            this._data.contract = value;
        }
        get script() {
            return this._data.script;
        }
        set script(value) {
            this._data.script = value;
        }
        get dependencies() {
            return this._data.dependencies || [];
        }
        set dependencies(value) {
            this._data.dependencies = value || [];
        }
        async setData(value) {
            this.clear();
            this._data = value;
            console.log('setData', value);
            if (this.script) {
                if (this.dependencies?.length) {
                    for (const dep of this.dependencies) {
                        if (!dep.script)
                            continue;
                        await components_2.application.loadScript(dep.module, dep.script, true);
                    }
                }
                await components_2.application.loadScript(this.contract, this.script, true);
            }
            const pkg = await components_2.application.loadPackage(this.contract);
            if (pkg?.DefaultDeployOptions) {
                this.codeEditorOptions.value = JSON.stringify(pkg.DefaultDeployOptions, null, 4);
            }
        }
        clear() {
            if (this.codeEditorOptions)
                this.codeEditorOptions.value = '';
            if (this.codeEditorResult)
                this.codeEditorResult.value = '';
            if (this.logs)
                this.logs.clearInnerHTML();
            if (this.pnlPreview)
                this.pnlPreview.visible = false;
        }
        renderDeployResult(content) {
            const newContent = content.replace(/(<)(.*)(>)/g, '&lt$2&gt');
            this.logs.append(this.$render("i-label", { caption: newContent }));
        }
        async init() {
            components_2.application.store.publicIndexingRelay = "https://relay.decom.app/api/v1";
            super.init();
            this.deploy = this.deploy.bind(this);
            const contract = this.getAttribute('contract', true);
            const script = this.getAttribute('script', true);
            const dependencies = this.getAttribute('dependencies', true);
            if (contract)
                await this.setData({ contract, script, dependencies });
            components_2.application.EventBus.register(this, 'IsTonWalletConnected', async (walletModel) => {
                (0, store_1.setWalletModel)(walletModel);
            });
        }
        ;
        deploy() {
            this.pnlPreview.visible = true;
            if (this.contract) {
                components_2.RequireJS.require([this.contract], async (contract) => {
                    if (contract.onProgress) {
                        contract.onProgress((msg) => {
                            this.renderDeployResult(msg);
                        });
                    }
                    ;
                    let options = {};
                    if (this.codeEditorOptions.value)
                        options = JSON.parse(this.codeEditorOptions.value);
                    this.renderDeployResult('Contracts deployment start');
                    const providerName = localStorage.getItem('walletProvider');
                    let result;
                    if (providerName === 'tonwallet') {
                        const wallet = (0, store_1.getWalletModel)();
                        result = await contract.deploy(wallet, options, (msg) => {
                            this.renderDeployResult(msg);
                        });
                    }
                    else {
                        await eth_wallet_1.Wallet.getClientInstance().init();
                        result = await contract.deploy(eth_wallet_1.Wallet.getInstance(), options, (msg) => {
                            this.renderDeployResult(msg);
                        });
                    }
                    this.renderDeployResult('Contracts deployment finished');
                    this.codeEditorResult.value = JSON.stringify(result, null, 4);
                });
            }
            ;
        }
        render() {
            return (this.$render("i-panel", { class: index_css_1.default, width: "100%", height: "100%", padding: { top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' } },
                this.$render("i-grid-layout", { width: "100%", height: "100%", gap: { column: '1rem', row: '1rem' }, overflow: "hidden", templateColumns: ['55%', '1fr'], mediaQueries: [
                        {
                            maxWidth: '1150px',
                            properties: {
                                templateColumns: ['1fr', '1fr']
                            }
                        },
                        {
                            maxWidth: '875px',
                            properties: {
                                templateColumns: ['1fr']
                            }
                        }
                    ] },
                    this.$render("i-tabs", { width: "100%", height: "100%" },
                        this.$render("i-tab", { caption: "Options", font: { size: '1em' } },
                            this.$render("i-panel", { height: "100%", width: "100%", minHeight: 500, position: 'relative' },
                                this.$render("i-scom-code-editor", { id: "codeEditorOptions", height: "100%", width: "100%", position: "absolute", language: 'json' }))),
                        this.$render("i-tab", { caption: "Result", font: { size: '1em' } },
                            this.$render("i-panel", { height: "100%", width: "100%", minHeight: 500, position: 'relative' },
                                this.$render("i-scom-code-editor", { id: "codeEditorResult", height: "100%", width: "100%", position: "absolute", language: 'json' })))),
                    this.$render("i-vstack", { height: "100%", gap: "1rem" },
                        this.$render("i-hstack", null,
                            this.$render("i-button", { caption: "Deploy", padding: { top: '0.25rem', bottom: '0.25rem', left: '1rem', right: '1rem' }, onClick: this.deploy })),
                        this.$render("i-panel", { id: "pnlPreview", class: "preview-wrap", visible: false, border: { width: 1, style: 'solid', color: Theme.divider, radius: 5 }, padding: { top: '0.5rem', bottom: '0.5rem', left: '0.5rem', right: '0.5rem' } },
                            this.$render("i-vstack", { id: "logs", gap: "5px", margin: { bottom: 4 } }))))));
        }
    };
    ScomContractDeployerDeployer = __decorate([
        (0, components_2.customElements)('i-scom-contract-deployer-widget--deployer')
    ], ScomContractDeployerDeployer);
    exports.default = ScomContractDeployerDeployer;
});
define("@scom/contract-deployer-widget/defaultData.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/contract-deployer-widget/defaultData.ts'/> 
    exports.default = {
        "infuraId": "adc596bf88b648e2a8902bc9093930c5",
        "defaultData": {
            "baseStripeApi": "",
            "returnUrl": "",
            "defaultChainId": 97,
            "networks": [
                {
                    "chainId": 97
                },
                {
                    "chainId": 43113
                }
            ],
            "wallets": [
                {
                    "name": "metamask"
                },
                {
                    "name": "walletconnect"
                },
                {
                    "name": "tonwallet"
                }
            ]
        }
    };
});
define("@scom/contract-deployer-widget", ["require", "exports", "@ijstech/components", "@scom/contract-deployer-widget/defaultData.ts", "@ijstech/eth-wallet"], function (require, exports, components_3, defaultData_1, eth_wallet_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let ScomContractDeployer = class ScomContractDeployer extends components_3.Module {
        constructor(parent, options) {
            super(parent, options);
            this._data = {};
            this.rpcWalletId = '';
        }
        ;
        get networks() {
            return this._data?.networks ?? defaultData_1.default.defaultData.networks;
        }
        set networks(value) {
            this._data.networks = value;
        }
        get wallets() {
            return this._data?.wallets ?? defaultData_1.default.defaultData.wallets;
        }
        set wallets(value) {
            this._data.wallets = value;
        }
        get contract() {
            return this._data?.contract;
        }
        set contract(value) {
            this._data.contract = value;
        }
        get defaultChainId() {
            return this._data?.defaultChainId ?? defaultData_1.default.defaultData.defaultChainId;
        }
        set defaultChainId(value) {
            this._data.defaultChainId = value;
        }
        get script() {
            return this._data?.script;
        }
        set script(value) {
            this._data.script = value;
        }
        get dependencies() {
            return this._data?.dependencies || [];
        }
        set dependencies(value) {
            this._data.dependencies = value || [];
        }
        async setData(data) {
            this._data = data;
            if (this.contract)
                this.deployer.setData({
                    contract: this.contract,
                    script: this.script,
                    dependencies: this.dependencies
                });
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
                });
            }
        }
        initRpcWallet(defaultChainId) {
            if (this.rpcWalletId) {
                return this.rpcWalletId;
            }
            const clientWallet = eth_wallet_2.Wallet.getClientInstance();
            if (!clientWallet)
                return '';
            const networkList = Object.values(components_3.application.store?.networkMap || []);
            const instanceId = clientWallet.initRpcWallet({
                networks: networkList,
                defaultChainId,
                infuraId: components_3.application.store?.infuraId,
                multicalls: components_3.application.store?.multicalls
            });
            this.rpcWalletId = instanceId;
            if (clientWallet.address) {
                const rpcWallet = eth_wallet_2.Wallet.getRpcWalletInstance(instanceId);
                rpcWallet.address = clientWallet.address;
            }
            return instanceId;
        }
        async init() {
            super.init();
            const contract = this.getAttribute('contract', true);
            const script = this.getAttribute('script', true);
            const dependencies = this.getAttribute('dependencies', true);
            const networks = this.getAttribute('networks', true);
            const wallets = this.getAttribute('wallets', true);
            await this.setData({ contract, networks, wallets, script, dependencies });
        }
        ;
        render() {
            return (this.$render("i-scom-dapp-container", { id: "dappContainer", showHeader: true, showFooter: false, showWalletNetwork: true },
                this.$render("i-panel", null,
                    this.$render("i-scom-contract-deployer-widget--deployer", { id: "deployer" }),
                    this.$render("i-button", { id: "btnTonWallet", visible: false }))));
        }
        ;
    };
    ScomContractDeployer = __decorate([
        components_3.customModule,
        (0, components_3.customElements)('i-scom-contract-deployer-widget')
    ], ScomContractDeployer);
    exports.default = ScomContractDeployer;
    ;
});
