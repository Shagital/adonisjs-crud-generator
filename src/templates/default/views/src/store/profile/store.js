import actions from './actions';
import getters from './getters';
import mutations from './mutations';

export const profile = {
    namespaced: true,
    state: {
        templates: [],
        plans: [],
        cities: [],
        regions: [],
        countries: [],
    },
        actions,
        getters,
        mutations
}
