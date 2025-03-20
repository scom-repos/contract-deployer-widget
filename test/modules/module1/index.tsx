import { Module, customModule, Container } from '@ijstech/components';
import ScomContractDeployer from '@scom/contract-deployer-widget';

@customModule
export default class Module1 extends Module {
  private elm: ScomContractDeployer;

  constructor(parent?: Container, options?: any) {
    super(parent, options);
  }

  init() {
    super.init();
  }

  render() {
    return <i-panel width="100%">
      <i-scom-contract-deployer-widget
        id="elm"
        contract='@scom/scom-product-contract'
      />
    </i-panel>
  }
}