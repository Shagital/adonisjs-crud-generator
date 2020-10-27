import axios from 'axios';

const API = '{{baseUrl}}';

export default {
    createOrUpdate({
                             commit
                         }, payload) {
        return new Promise((resolve, reject) => {
          let method = payload.id ? axios.patch(`${API}/{{plural}}/${payload.id}`, payload) : axios.post(`${API}/{{plural}}`, payload)
            method
                .then(({
                           data
                       }) => {
                    resolve(data);
                })
                .catch(error => reject(error.response));
        });
    },
  fetch({
                   commit
                 }, id) {
    return new Promise((resolve, reject) => {
      axios.get(`${API}/{{plural}}/${id}`)
        .then(({
                 data: {
                   data
                 }
               }) => {
          commit('SET_{{pascalCapital}}')
          resolve(data);
        })
        .catch(error => reject(error.response));
    });
  },
  delete({
          commit
        }, id) {
    return new Promise((resolve, reject) => {
      axios.delete(`${API}/{{plural}}/${id}`)
        .then(({
                 data
               }) => {
          resolve(data);
        })
        .catch(error => reject(error.response));
    });
  },

}
