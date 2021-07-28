import {optional} from '@/helpers/global'

export function handleError(vm, error, message) {
  message = message || vm.$t('error.default')
  message = optional(error, 'data.message', message);

  if (error && error.data && error.status === 422) {
      let errors = error.data;
      Object.values(errors).forEach(function(obj) {
          vm.errors.add({
              field: obj.field,
              msg: obj.message
          });
          vm.$toast.error(obj.message, {
              position: "top-right",
              duration: 2000
          });
      }, vm);
  }
      vm.$toast.error(message, {
          position: "top-right",
          duration: 3000
      });
}

export function handleSuccess(vm, message) {
  message = message || vm.$t('success.default')
  vm.$toast.success(message, {
    position: "top-right",
    duration: 3000
  });
}
