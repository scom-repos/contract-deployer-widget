const state = {
  walletModel: null
}

export const setWalletModel = (value: any) => {
  state.walletModel = value;
}

export const getWalletModel = () => {
  return state.walletModel;
}