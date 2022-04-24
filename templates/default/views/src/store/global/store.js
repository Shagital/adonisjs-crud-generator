import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const global = {
  namespaced: true,
  state: {
    sidebar_open: true,
    dropdown_open: false,
    expanded_menu: false,
  },
  actions,
  getters,
  mutations
}
