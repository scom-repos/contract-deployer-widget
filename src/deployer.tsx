import { Module, Styles, Panel, RequireJS, customElements, ControlElement, application } from '@ijstech/components';
import { Wallet } from '@ijstech/eth-wallet';
import { ScomCodeEditor } from '@scom/scom-code-editor';
import customStyles from './index.css';
import { getWalletModel, setWalletModel } from './store';
import { VStack } from '@ijstech/components';
import { IPackage } from './interface';

const Theme = Styles.Theme.ThemeVars;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ['i-scom-contract-deployer-widget--deployer']: DeployerElement;
    }
  }
};

interface IDeployData {
  contract: string;
  script?: string;
  dependencies?: IPackage[];
}

interface DeployerElement extends ControlElement {
  contract?: string;
  script?: string;
  dependencies?: IPackage[];
}

@customElements('i-scom-contract-deployer-widget--deployer')
export default class ScomContractDeployerDeployer extends Module {
  private codeEditorOptions: ScomCodeEditor;
  private codeEditorResult: ScomCodeEditor;
  private pnlPreview: Panel;
  private logs: VStack;

  private _data: IDeployData = { contract: '', dependencies: [], script: '' };

  get contract() {
    return this._data.contract;
  }

  set contract(value: string) {
    this._data.contract = value;
  }

  get script() {
    return this._data.script;
  }

  set script(value: string) {
    this._data.script = value;
  }

  get dependencies() {
    return this._data.dependencies || [];
  }

  set dependencies(value: IPackage[]) {
    this._data.dependencies = value || [];
  }

  async setData(value: IDeployData) {
    this.clear();
    this._data = value;
    console.log('setData', value);

    if (this.script) {
      if (this.dependencies?.length) {
        for (const dep of this.dependencies) {
          if (!dep.script) continue;
          await application.loadScript(dep.module, dep.script, true);
        }
      }
      await application.loadScript(this.contract, this.script, true);
    }

    const pkg = await application.loadPackage(this.contract);
    if (pkg?.DefaultDeployOptions) {
      this.codeEditorOptions.value = JSON.stringify(pkg.DefaultDeployOptions, null, 4);
    }
  }

  clear() {
    if (this.codeEditorOptions) this.codeEditorOptions.value = '';
    if (this.codeEditorResult) this.codeEditorResult.value = '';
    if (this.logs) this.logs.clearInnerHTML();
    if (this.pnlPreview) this.pnlPreview.visible = false;
  }

  renderDeployResult(content: string) {
    const newContent = content.replace(/(<)(.*)(>)/g, '&lt$2&gt');
    this.logs.append(<i-label caption={newContent}></i-label>);
  }

  async init() {
    application.store.publicIndexingRelay = "https://relay.decom.app/api/v1";
    super.init();
    this.deploy = this.deploy.bind(this);
    const contract = this.getAttribute('contract', true);
    const script = this.getAttribute('script', true);
    const dependencies = this.getAttribute('dependencies', true);
    if (contract) await this.setData({ contract, script, dependencies });
    application.EventBus.register(this, 'IsTonWalletConnected', async (walletModel: any) => {
      setWalletModel(walletModel);
    });
  };

  deploy() {
    this.pnlPreview.visible = true;
    if (this.contract) {
      RequireJS.require([this.contract], async (contract: any) => {
        if (contract.onProgress) {
          contract.onProgress((msg: string) => {
            this.renderDeployResult(msg)
          });
        };
        let options: any = {};
        if (this.codeEditorOptions.value)
          options = JSON.parse(this.codeEditorOptions.value)
        this.renderDeployResult('Contracts deployment start');
        const providerName = localStorage.getItem('walletProvider');
        let result;
        if (providerName === 'tonwallet') {
          const wallet = getWalletModel();
          result = await contract.deploy(wallet, options, (msg: string) => {
            this.renderDeployResult(msg)
          });
        } else {
          await Wallet.getClientInstance().init();
          result = await contract.deploy(Wallet.getInstance(), options, (msg: string) => {
            this.renderDeployResult(msg)
          });
        }
        
        this.renderDeployResult('Contracts deployment finished');
        this.codeEditorResult.value = JSON.stringify(result, null, 4);
      });
    };
  }

  render() {
    return (
      <i-panel class={customStyles} width="100%" height="100%" padding={{ top: '1rem', bottom: '1rem', left: '1rem', right: '1rem' }}>
        <i-grid-layout
          width="100%"
          height="100%"
          gap={{ column: '1rem', row: '1rem' }}
          overflow="hidden"
          templateColumns={['55%', '1fr']}
          mediaQueries={
            [
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
            ]
          }
        >
          <i-tabs width="100%" height="100%">
            <i-tab
              caption="Options"
              font={{ size: '1em' }}
            >
              <i-panel height="100%" width="100%" minHeight={500} position='relative'>
                <i-scom-code-editor id="codeEditorOptions" height="100%" width="100%" position="absolute" language='json' />
              </i-panel>
            </i-tab>
            <i-tab
              caption="Result"
              font={{ size: '1em' }}
            >
              <i-panel height="100%" width="100%" minHeight={500} position='relative'>
                <i-scom-code-editor id="codeEditorResult" height="100%" width="100%" position="absolute" language='json' />
              </i-panel>
            </i-tab>
          </i-tabs>
          <i-vstack height="100%" gap="1rem">
            <i-hstack>
              <i-button
                caption="Deploy"
                padding={{ top: '0.25rem', bottom: '0.25rem', left: '1rem', right: '1rem' }}
                onClick={this.deploy}
              ></i-button>
            </i-hstack>
            <i-panel
              id="pnlPreview"
              class="preview-wrap"
              visible={false}
              border={{ width: 1, style: 'solid', color: Theme.divider, radius: 5 }}
              padding={{ top: '0.5rem', bottom: '0.5rem', left: '0.5rem', right: '0.5rem' }}
            >
              <i-vstack id="logs" gap="5px" margin={{ bottom: 4 }} />
            </i-panel>
          </i-vstack>
        </i-grid-layout>
      </i-panel>
    )
  }
}