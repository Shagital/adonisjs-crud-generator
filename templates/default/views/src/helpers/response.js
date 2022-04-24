import {optional} from '@/helpers/global'

export function handleError(vm, error, message) {
  message = message || vm.$t('error.default')
  message = optional(error, 'data.message', message);

  if (error && error.data && error.status === 422) {
    let errors = error.data.errors || {};
    Object.keys(errors).forEach(function(field) {
      vm.errors.add({
        field,
        msg: errors[field].join('. ')
      });
      vm.$toast.error(`${field}: ${errors[field].join('. ')}`, {
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
