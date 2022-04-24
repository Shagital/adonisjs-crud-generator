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

function getPaginationData(data, moreParams)
{
  let current_url = location.href;
    for (var key in moreParams) {
        current_url = replaceQueryParam(key, moreParams[key], current_url);
    }

        return {
            'total': data.total,
            'per_page': data.perPage,
            'current_page': data.page,
            'last_page': data.lastPage,
            'next_page_url': data.page > 1 ? replaceQueryParam('page', data.page, current_url) : null,
            'prev_page_url': data.page != data.lastPage ? replaceQueryParam('page', data.page - 1, current_url) : null,
            'from': ((parseInt(data.page) * parseInt(data.perPage)) - parseInt(data.perPage)) + 1,
            'to': parseInt(data.page) * parseInt(data.perPage)
        };
}
export default getPaginationData
