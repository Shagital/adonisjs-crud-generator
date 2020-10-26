export function handleError(vm, error, message = 'Failed to perform action. Please try again.') {
  if (error && error.data && error.status == 422) {
    message = error.data.message || error.data.map(s => s.message).join(' ');
  }
  vm.$toast.error(message, {
    position: "top-right",
    duration: 3000
  });
}
export function handleSuccess(vm, message = 'Failed to perform action. Please try again.') {
  vm.$toast.success(message, {
    position: "top-right",
    duration: 3000
  });
}
