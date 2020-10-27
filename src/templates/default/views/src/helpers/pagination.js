function replaceQueryParam(param, newval, search) {
  var questionIndex = search.indexOf('?');

  if (questionIndex < 0) {
    search = search + '?';
    search = search + param + '=' + newval;
    return search;
  }

  var regex = new RegExp("([?;&])" + param + "[^&;]*[;&]?");
  var query = search.replace(regex, "$1").replace(/&$/, '');

  var indexOfEquals = query.indexOf('=');

  return (indexOfEquals >= 0 ? query + '&' : query + '') + (newval ? param + '=' + newval : '');
}

function getPaginationData(current_url, pagination)
{

    let currentPage = parseInt(pagination.page);
    let perPage = parseInt(pagination.perPage);
    let prevPage = currentPage > 1 ? currentPage - 1 : null;
    let nextPage = currentPage != pagination.lastPage ? currentPage + 1 : null;

    return {
      'total': pagination.total,
      'per_page': perPage,
      'current_page': currentPage,
      'last_page': pagination.lastPage,
      'next_page_url': replaceQueryParam('page', nextPage, current_url),
      'prev_page_url': replaceQueryParam('page', prevPage, current_url),
      'from': ((currentPage * perPage) - perPage) + 1,
      'to': currentPage * perPage
    };
}
export default getPaginationData
