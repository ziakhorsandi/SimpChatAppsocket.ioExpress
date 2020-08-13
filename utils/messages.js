const moment = require("moment");

function formatMessage(id, userName, text) {
  return {
    id,
    userName,
    text,
    time: moment().format("h:mm a"),
  };
}

module.exports = formatMessage;
