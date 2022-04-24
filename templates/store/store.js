import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const {{singular}} = {
    namespaced: true,
    state: {
      {{singular}}: {},
      meta: {},
    },
    actions,
    getters,
    mutations
}
