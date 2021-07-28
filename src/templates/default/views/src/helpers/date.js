const moment = require('moment')

export function toLocal (datetime) {
    return moment(datetime).utc(datetime).local()
}

export function toUTC (datetime) {
    return moment(datetime).utc(datetime)
}

export function fromNow (datetime) {
    return moment(datetime).utc(datetime).local().fromNow();
}
