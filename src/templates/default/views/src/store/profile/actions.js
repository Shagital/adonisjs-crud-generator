import axios from 'axios';

const API = '{{baseUrl}}';

export default {
    update({
                             commit
                         }, payload) {
        return new Promise((resolve, reject) => {
            axios.patch(`${API}/profile`, payload)
                .then(({
                           data: {
                               data
                           }
                       }) => {
                    resolve(data);
                })
                .catch(error => reject(error.response));
        });
    },

}
