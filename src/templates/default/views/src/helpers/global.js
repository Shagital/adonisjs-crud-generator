function random(length = 16, number = false) {
  var result = '';
  var characters = number ? "1234567890" : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function optional(obj, key, defaultValue = null) {
  // if falsy value was passed, return immediately
  if(!obj) return isFunction(defaultValue) ? defaultValue(obj, key) : defaultValue;

  let localValue = obj;
  let keys = key.split('.');

  for(let i of keys) {
      localValue = localValue[i];

      if(!localValue) break;
  }

  return localValue ? localValue : (isFunction(defaultValue) ? defaultValue(obj, key) : defaultValue);
}

export function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

export function toTitleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

export function truncate(str, length = 255, delimiter = '...') {
  str = String(str);
  
  if(str.length > length) {
    str = `${str.substring(0,length)}${delimiter}`;
  }

  return str;
}

export default {
  random,
  optional,
  numberWithCommas,
  toTitleCase,
  truncate,
}
