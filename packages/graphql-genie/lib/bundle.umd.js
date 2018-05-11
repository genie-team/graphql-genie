(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('graphql'), require('graphql/execution/values'), require('graphql/language/printer'), require('graphql/error'), require('graphql/language'), require('lodash')) :
	typeof define === 'function' && define.amd ? define(['exports', 'graphql', 'graphql/execution/values', 'graphql/language/printer', 'graphql/error', 'graphql/language', 'lodash'], factory) :
	(factory((global['graphql-genie'] = {}),global.graphql,null,null,null,null,global.lodash));
}(this, (function (exports,graphql_1,values,printer,error,language,lodash) { 'use strict';

	var graphql_1__default = 'default' in graphql_1 ? graphql_1['default'] : graphql_1;
	values = values && values.hasOwnProperty('default') ? values['default'] : values;
	error = error && error.hasOwnProperty('default') ? error['default'] : error;
	language = language && language.hasOwnProperty('default') ? language['default'] : language;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function commonjsRequire () {
		throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
	}

	function unwrapExports (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var formatter = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	/**
	 * Copyright (c) 2017, Dirk-Jan Rutten
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	// Parses an RFC 3339 compliant time-string into a Date.
	// It does this by combining the current date with the time-string
	// to create a new Date instance.
	//
	// Example:
	// Suppose the current date is 2016-01-01, then
	// parseTime('11:00:12Z') parses to a Date corresponding to
	// 2016-01-01T11:00:12Z.
	var parseTime = exports.parseTime = function parseTime(time) {
	  var currentDateString = new Date().toISOString();
	  return new Date(currentDateString.substr(0, currentDateString.indexOf('T') + 1) + time);
	};

	// Serializes a Date into an RFC 3339 compliant time-string in the
	// format hh:mm:ss.sssZ.
	var serializeTime = exports.serializeTime = function serializeTime(date) {
	  var dateTimeString = date.toISOString();
	  return dateTimeString.substr(dateTimeString.indexOf('T') + 1);
	};

	// Serializes an RFC 3339 compliant time-string by shifting
	// it to UTC.
	var serializeTimeString = exports.serializeTimeString = function serializeTimeString(time) {
	  // If already formatted to UTC then return the time string
	  if (time.indexOf('Z') !== -1) {
	    return time;
	  } else {
	    // These are time-strings with timezone information,
	    // these need to be shifted to UTC.

	    // Convert to UTC time string in
	    // format hh:mm:ss.sssZ.
	    var date = parseTime(time);
	    var timeUTC = serializeTime(date);

	    // Regex to look for fractional second part in time string
	    // such as 00:00:00.345+01:00
	    var regexFracSec = /\.\d{1,}/;

	    // Retrieve the fractional second part of the time
	    // string if it exists.
	    var fractionalPart = time.match(regexFracSec);
	    if (fractionalPart == null) {
	      // These are time-strings without the fractional
	      // seconds. So we remove them from the UTC time-string.
	      timeUTC = timeUTC.replace(regexFracSec, '');
	      return timeUTC;
	    } else {
	      // These are time-string with fractional seconds.
	      // Make sure that we inject the fractional
	      // second part back in. The `timeUTC` variable
	      // has millisecond precision, we may want more or less
	      // depending on the string that was passed.
	      timeUTC = timeUTC.replace(regexFracSec, fractionalPart[0]);
	      return timeUTC;
	    }
	  }
	};

	// Parses an RFC 3339 compliant date-string into a Date.
	//
	// Example:
	// parseDate('2016-01-01') parses to a Date corresponding to
	// 2016-01-01T00:00:00.000Z.
	var parseDate = exports.parseDate = function parseDate(date) {
	  return new Date(date);
	};

	// Serializes a Date into a RFC 3339 compliant date-string
	// in the format YYYY-MM-DD.
	var serializeDate = exports.serializeDate = function serializeDate(date) {
	  return date.toISOString().split('T')[0];
	};

	// Parses an RFC 3339 compliant date-time-string into a Date.
	var parseDateTime = exports.parseDateTime = function parseDateTime(dateTime) {
	  return new Date(dateTime);
	};

	// Serializes a Date into an RFC 3339 compliant date-time-string
	// in the format YYYY-MM-DDThh:mm:ss.sssZ.
	var serializeDateTime = exports.serializeDateTime = function serializeDateTime(dateTime) {
	  return dateTime.toISOString();
	};

	// Serializes an RFC 3339 compliant date-time-string by shifting
	// it to UTC.
	var serializeDateTimeString = exports.serializeDateTimeString = function serializeDateTimeString(dateTime) {
	  // If already formatted to UTC then return the time string
	  if (dateTime.indexOf('Z') !== -1) {
	    return dateTime;
	  } else {
	    // These are time-strings with timezone information,
	    // these need to be shifted to UTC.

	    // Convert to UTC time string in
	    // format YYYY-MM-DDThh:mm:ss.sssZ.
	    var dateTimeUTC = new Date(dateTime).toISOString();

	    // Regex to look for fractional second part in date-time string
	    var regexFracSec = /\.\d{1,}/;

	    // Retrieve the fractional second part of the time
	    // string if it exists.
	    var fractionalPart = dateTime.match(regexFracSec);
	    if (fractionalPart == null) {
	      // The date-time-string has no fractional part,
	      // so we remove it from the dateTimeUTC variable.
	      dateTimeUTC = dateTimeUTC.replace(regexFracSec, '');
	      return dateTimeUTC;
	    } else {
	      // These are datetime-string with fractional seconds.
	      // Make sure that we inject the fractional
	      // second part back in. The `dateTimeUTC` variable
	      // has millisecond precision, we may want more or less
	      // depending on the string that was passed.
	      dateTimeUTC = dateTimeUTC.replace(regexFracSec, fractionalPart[0]);
	      return dateTimeUTC;
	    }
	  }
	};

	// Serializes a Unix timestamp to an RFC 3339 compliant date-time-string
	// in the format YYYY-MM-DDThh:mm:ss.sssZ
	var serializeUnixTimestamp = exports.serializeUnixTimestamp = function serializeUnixTimestamp(timestamp) {
	  return new Date(timestamp * 1000).toISOString();
	};
	});

	unwrapExports(formatter);
	var formatter_1 = formatter.parseTime;
	var formatter_2 = formatter.serializeTime;
	var formatter_3 = formatter.serializeTimeString;
	var formatter_4 = formatter.parseDate;
	var formatter_5 = formatter.serializeDate;
	var formatter_6 = formatter.parseDateTime;
	var formatter_7 = formatter.serializeDateTime;
	var formatter_8 = formatter.serializeDateTimeString;
	var formatter_9 = formatter.serializeUnixTimestamp;

	var validator = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	/**
	 * Copyright (c) 2017, Dirk-Jan Rutten
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	// Check whether a certain year is a leap year.
	//
	// Every year that is exactly divisible by four
	// is a leap year, except for years that are exactly
	// divisible by 100, but these centurial years are
	// leap years if they are exactly divisible by 400.
	// For example, the years 1700, 1800, and 1900 are not leap years,
	// but the years 1600 and 2000 are.
	//
	var leapYear = function leapYear(year) {
	  return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
	};

	// Function that checks whether a time-string is RFC 3339 compliant.
	//
	// It checks whether the time-string is structured in one of the
	// following formats:
	//
	// - hh:mm:ssZ
	// - hh:mm:ss±hh:mm
	// - hh:mm:ss.*sZ
	// - hh:mm:ss.*s±hh:mm
	//
	// Where *s is a fraction of seconds with at least 1 digit.
	//
	// Note, this validator assumes that all minutes have
	// 59 seconds. This assumption does not follow RFC 3339
	// which includes leap seconds (in which case it is possible that
	// there are 60 seconds in a minute).
	//
	// Leap seconds are ignored because it adds complexity in
	// the following areas:
	// - The native Javascript Date ignores them; i.e. Date.parse('1972-12-31T23:59:60Z')
	//   equals NaN.
	// - Leap seconds cannot be known in advance.
	//
	var validateTime = exports.validateTime = function validateTime(time) {
	  var TIME_REGEX = /^([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])(\.\d{1,})?(([Z])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;
	  return TIME_REGEX.test(time);
	};

	// Function that checks whether a date-string is RFC 3339 compliant.
	//
	// It checks whether the date-string is a valid date in the YYYY-MM-DD.
	//
	// Note, the number of days in each date are determined according to the
	// following lookup table:
	//
	// Month Number  Month/Year           Maximum value of date-mday
	// ------------  ----------           --------------------------
	// 01            January              31
	// 02            February, normal     28
	// 02            February, leap year  29
	// 03            March                31
	// 04            April                30
	// 05            May                  31
	// 06            June                 30
	// 07            July                 31
	// 08            August               31
	// 09            September            30
	// 10            October              31
	// 11            November             30
	// 12            December             31
	//
	var validateDate = exports.validateDate = function validateDate(datestring) {
	  var RFC_3339_REGEX = /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))$/;

	  if (!RFC_3339_REGEX.test(datestring)) {
	    return false;
	  }

	  // Verify the correct number of days for
	  // the month contained in the date-string.
	  var year = Number(datestring.substr(0, 4));
	  var month = Number(datestring.substr(5, 2));
	  var day = Number(datestring.substr(8, 2));

	  switch (month) {
	    case 2:
	      // February
	      if (leapYear(year) && day > 29) {
	        return false;
	      } else if (!leapYear(year) && day > 28) {
	        return false;
	      }
	      return true;
	    case 4: // April
	    case 6: // June
	    case 9: // September
	    case 11:
	      // November
	      if (day > 30) {
	        return false;
	      }
	      break;
	  }

	  return true;
	};

	// Function that checks whether a date-time-string is RFC 3339 compliant.
	//
	// It checks whether the time-string is structured in one of the
	//
	// - YYYY-MM-DDThh:mm:ssZ
	// - YYYY-MM-DDThh:mm:ss±hh:mm
	// - YYYY-MM-DDThh:mm:ss.*sZ
	// - YYYY-MM-DDThh:mm:ss.*s±hh:mm
	//
	// Where *s is a fraction of seconds with at least 1 digit.
	//
	var validateDateTime = exports.validateDateTime = function validateDateTime(dateTimeString) {
	  var RFC_3339_REGEX = /^(\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60))(\.\d{1,})?(([Z])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;

	  // Validate the structure of the date-string
	  if (!RFC_3339_REGEX.test(dateTimeString)) {
	    return false;
	  }

	  // Check if it is a correct date using the javascript Date parse() method.
	  var time = Date.parse(dateTimeString);
	  if (time !== time) {
	    // eslint-disable-line
	    return false;
	  }
	  // Split the date-time-string up into the string-date and time-string part.
	  // and check whether these parts are RFC 3339 compliant.
	  var index = dateTimeString.indexOf('T');
	  var dateString = dateTimeString.substr(0, index);
	  var timeString = dateTimeString.substr(index + 1);
	  return validateDate(dateString) && validateTime(timeString);
	};

	// Function that checks whether a given number is a valid
	// Unix timestamp.
	//
	// Unix timestamps are signed 32-bit integers. They are interpreted
	// as the number of seconds since 00:00:00 UTC on 1 January 1970.
	//
	var validateUnixTimestamp = exports.validateUnixTimestamp = function validateUnixTimestamp(timestamp) {
	  var MAX_INT = 2147483647;
	  var MIN_INT = -2147483648;
	  return timestamp === timestamp && timestamp <= MAX_INT && timestamp >= MIN_INT; // eslint-disable-line
	};

	// Function that checks whether a javascript Date instance
	// is valid.
	//
	var validateJSDate = exports.validateJSDate = function validateJSDate(date) {
	  var time = date.getTime();
	  return time === time; // eslint-disable-line
	};
	});

	unwrapExports(validator);
	var validator_1 = validator.validateTime;
	var validator_2 = validator.validateDate;
	var validator_3 = validator.validateDateTime;
	var validator_4 = validator.validateUnixTimestamp;
	var validator_5 = validator.validateJSDate;

	var utils = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});



	Object.defineProperty(exports, 'serializeTime', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeTime;
	  }
	});
	Object.defineProperty(exports, 'serializeTimeString', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeTimeString;
	  }
	});
	Object.defineProperty(exports, 'serializeDate', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeDate;
	  }
	});
	Object.defineProperty(exports, 'serializeDateTime', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeDateTime;
	  }
	});
	Object.defineProperty(exports, 'serializeDateTimeString', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeDateTimeString;
	  }
	});
	Object.defineProperty(exports, 'serializeUnixTimestamp', {
	  enumerable: true,
	  get: function get() {
	    return formatter.serializeUnixTimestamp;
	  }
	});
	Object.defineProperty(exports, 'parseTime', {
	  enumerable: true,
	  get: function get() {
	    return formatter.parseTime;
	  }
	});
	Object.defineProperty(exports, 'parseDate', {
	  enumerable: true,
	  get: function get() {
	    return formatter.parseDate;
	  }
	});
	Object.defineProperty(exports, 'parseDateTime', {
	  enumerable: true,
	  get: function get() {
	    return formatter.parseDateTime;
	  }
	});



	Object.defineProperty(exports, 'validateTime', {
	  enumerable: true,
	  get: function get() {
	    return validator.validateTime;
	  }
	});
	Object.defineProperty(exports, 'validateDate', {
	  enumerable: true,
	  get: function get() {
	    return validator.validateDate;
	  }
	});
	Object.defineProperty(exports, 'validateDateTime', {
	  enumerable: true,
	  get: function get() {
	    return validator.validateDateTime;
	  }
	});
	Object.defineProperty(exports, 'validateUnixTimestamp', {
	  enumerable: true,
	  get: function get() {
	    return validator.validateUnixTimestamp;
	  }
	});
	Object.defineProperty(exports, 'validateJSDate', {
	  enumerable: true,
	  get: function get() {
	    return validator.validateJSDate;
	  }
	});
	});

	unwrapExports(utils);

	var date = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});





	/**
	 * An RFC 3339 compliant date scalar.
	 *
	 * Input:
	 *    This scalar takes an RFC 3339 date string as input and
	 *    parses it to a javascript Date.
	 *
	 * Output:
	 *    This scalar serializes javascript Dates and
	 *    RFC 3339 date strings to RFC 3339 date strings.
	 */

	/**
	 * Copyright (c) 2017, Dirk-Jan Rutten
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	var config = {
	  name: 'Date',
	  description: 'A date string, such as 2007-12-03, compliant with the `full-date` ' + 'format outlined in section 5.6 of the RFC 3339 profile of the ' + 'ISO 8601 standard for representation of dates and times using ' + 'the Gregorian calendar.',
	  serialize: function serialize(value) {
	    if (value instanceof Date) {
	      if ((0, utils.validateJSDate)(value)) {
	        return (0, utils.serializeDate)(value);
	      }
	      throw new TypeError('Date cannot represent an invalid Date instance');
	    } else if (typeof value === 'string' || value instanceof String) {
	      if ((0, utils.validateDate)(value)) {
	        return value;
	      }
	      throw new TypeError('Date cannot represent an invalid date-string ' + value + '.');
	    } else {
	      throw new TypeError('Date cannot represent a non string, or non Date type ' + JSON.stringify(value));
	    }
	  },
	  parseValue: function parseValue(value) {
	    if (!(typeof value === 'string' || value instanceof String)) {
	      throw new TypeError('Date cannot represent non string type ' + JSON.stringify(value));
	    }

	    if ((0, utils.validateDate)(value)) {
	      return (0, utils.parseDate)(value);
	    }
	    throw new TypeError('Date cannot represent an invalid date-string ' + value + '.');
	  },
	  parseLiteral: function parseLiteral(ast) {
	    if (ast.kind !== graphql_1__default.Kind.STRING) {
	      throw new TypeError('Date cannot represent non string type ' + String(ast.value != null ? ast.value : null));
	    }
	    var value = ast.value;

	    if ((0, utils.validateDate)(value)) {
	      return (0, utils.parseDate)(value);
	    }
	    throw new TypeError('Date cannot represent an invalid date-string ' + String(value) + '.');
	  }
	}; // eslint-disable-line
	exports.default = new graphql_1__default.GraphQLScalarType(config);
	});

	unwrapExports(date);

	var time = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});





	/**
	 * An RFC 3339 compliant time scalar.
	 *
	 * Input:
	 *    This scalar takes an RFC 3339 time string as input and
	 *    parses it to a javascript Date (with a year-month-day relative
	 *    to the current day).
	 *
	 * Output:
	 *    This scalar serializes javascript Dates and
	 *    RFC 3339 time strings to RFC 3339 UTC time strings.
	 */

	/**
	 * Copyright (c) 2017, Dirk-Jan Rutten
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	var config = {
	  name: 'Time',
	  description: 'A time string at UTC, such as 10:15:30Z, compliant with ' + 'the `full-time` format outlined in section 5.6 of the RFC 3339' + 'profile of the ISO 8601 standard for representation of dates and ' + 'times using the Gregorian calendar.',
	  serialize: function serialize(value) {
	    if (value instanceof Date) {
	      if ((0, utils.validateJSDate)(value)) {
	        return (0, utils.serializeTime)(value);
	      }
	      throw new TypeError('Time cannot represent an invalid Date instance');
	    } else if (typeof value === 'string' || value instanceof String) {
	      if ((0, utils.validateTime)(value)) {
	        return (0, utils.serializeTimeString)(value);
	      }
	      throw new TypeError('Time cannot represent an invalid time-string ' + value + '.');
	    } else {
	      throw new TypeError('Time cannot be serialized from a non string, ' + 'or non Date type ' + JSON.stringify(value));
	    }
	  },
	  parseValue: function parseValue(value) {
	    if (!(typeof value === 'string' || value instanceof String)) {
	      throw new TypeError('Time cannot represent non string type ' + JSON.stringify(value));
	    }

	    if ((0, utils.validateTime)(value)) {
	      return (0, utils.parseTime)(value);
	    }
	    throw new TypeError('Time cannot represent an invalid time-string ' + value + '.');
	  },
	  parseLiteral: function parseLiteral(ast) {
	    if (ast.kind !== graphql_1__default.Kind.STRING) {
	      throw new TypeError('Time cannot represent non string type ' + String(ast.value != null ? ast.value : null));
	    }
	    var value = ast.value;
	    if ((0, utils.validateTime)(value)) {
	      return (0, utils.parseTime)(value);
	    }
	    throw new TypeError('Time cannot represent an invalid time-string ' + String(value) + '.');
	  }
	}; // eslint-disable-line
	exports.default = new graphql_1__default.GraphQLScalarType(config);
	});

	unwrapExports(time);

	var dateTime = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});





	/**
	 * An RFC 3339 compliant date-time scalar.
	 *
	 * Input:
	 *    This scalar takes an RFC 3339 date-time string as input and
	 *    parses it to a javascript Date.
	 *
	 * Output:
	 *    This scalar serializes javascript Dates,
	 *    RFC 3339 date-time strings and unix timestamps
	 *    to RFC 3339 UTC date-time strings.
	 */

	/**
	 * Copyright (c) 2017, Dirk-Jan Rutten
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 */

	var config = {
	  name: 'DateTime',
	  description: 'A date-time string at UTC, such as 2007-12-03T10:15:30Z, ' + 'compliant with the `date-time` format outlined in section 5.6 of ' + 'the RFC 3339 profile of the ISO 8601 standard for representation ' + 'of dates and times using the Gregorian calendar.',
	  serialize: function serialize(value) {
	    if (value instanceof Date) {
	      if ((0, utils.validateJSDate)(value)) {
	        return (0, utils.serializeDateTime)(value);
	      }
	      throw new TypeError('DateTime cannot represent an invalid Date instance');
	    } else if (typeof value === 'string' || value instanceof String) {
	      if ((0, utils.validateDateTime)(value)) {
	        return (0, utils.serializeDateTimeString)(value);
	      }
	      throw new TypeError('DateTime cannot represent an invalid date-time-string ' + value + '.');
	    } else if (typeof value === 'number' || value instanceof Number) {
	      if ((0, utils.validateUnixTimestamp)(value)) {
	        return (0, utils.serializeUnixTimestamp)(value);
	      }
	      throw new TypeError('DateTime cannot represent an invalid Unix timestamp ' + value);
	    } else {
	      throw new TypeError('DateTime cannot be serialized from a non string, ' + 'non numeric or non Date type ' + JSON.stringify(value));
	    }
	  },
	  parseValue: function parseValue(value) {
	    if (!(typeof value === 'string' || value instanceof String)) {
	      throw new TypeError('DateTime cannot represent non string type ' + JSON.stringify(value));
	    }

	    if ((0, utils.validateDateTime)(value)) {
	      return (0, utils.parseDateTime)(value);
	    }
	    throw new TypeError('DateTime cannot represent an invalid date-time-string ' + value + '.');
	  },
	  parseLiteral: function parseLiteral(ast) {
	    if (ast.kind !== graphql_1__default.Kind.STRING) {
	      throw new TypeError('DateTime cannot represent non string type ' + String(ast.value != null ? ast.value : null));
	    }
	    var value = ast.value;

	    if ((0, utils.validateDateTime)(value)) {
	      return (0, utils.parseDateTime)(value);
	    }
	    throw new TypeError('DateTime cannot represent an invalid date-time-string ' + String(value) + '.');
	  }
	}; // eslint-disable-line
	exports.default = new graphql_1__default.GraphQLScalarType(config);
	});

	unwrapExports(dateTime);

	var dist = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});



	Object.defineProperty(exports, 'GraphQLDate', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(date).default;
	  }
	});



	Object.defineProperty(exports, 'GraphQLTime', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(time).default;
	  }
	});



	Object.defineProperty(exports, 'GraphQLDateTime', {
	  enumerable: true,
	  get: function get() {
	    return _interopRequireDefault(dateTime).default;
	  }
	});

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	});

	unwrapExports(dist);
	var dist_1 = dist.GraphQLDate;
	var dist_2 = dist.GraphQLTime;
	var dist_3 = dist.GraphQLDateTime;

	var schemaVisitor = createCommonjsModule(function (module, exports) {
	var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	Object.defineProperty(exports, "__esModule", { value: true });


	var hasOwn = Object.prototype.hasOwnProperty;
	// Abstract base class of any visitor implementation, defining the available
	// visitor methods along with their parameter types, and providing a static
	// helper function for determining whether a subclass implements a given
	// visitor method, as opposed to inheriting one of the stubs defined here.
	var SchemaVisitor = /** @class */ (function () {
	    function SchemaVisitor() {
	    }
	    // Determine if this SchemaVisitor (sub)class implements a particular
	    // visitor method.
	    SchemaVisitor.implementsVisitorMethod = function (methodName) {
	        if (!methodName.startsWith('visit')) {
	            return false;
	        }
	        var method = this.prototype[methodName];
	        if (typeof method !== 'function') {
	            return false;
	        }
	        if (this === SchemaVisitor) {
	            // The SchemaVisitor class implements every visitor method.
	            return true;
	        }
	        var stub = SchemaVisitor.prototype[methodName];
	        if (method === stub) {
	            // If this.prototype[methodName] was just inherited from SchemaVisitor,
	            // then this class does not really implement the method.
	            return false;
	        }
	        return true;
	    };
	    // Concrete subclasses of SchemaVisitor should override one or more of these
	    // visitor methods, in order to express their interest in handling certain
	    // schema types/locations. Each method may return null to remove the given
	    // type from the schema, a non-null value of the same type to update the
	    // type in the schema, or nothing to leave the type as it was.
	    /* tslint:disable:no-empty */
	    SchemaVisitor.prototype.visitSchema = function (schema) { };
	    SchemaVisitor.prototype.visitScalar = function (scalar) { };
	    SchemaVisitor.prototype.visitObject = function (object) { };
	    SchemaVisitor.prototype.visitFieldDefinition = function (field, details) { };
	    SchemaVisitor.prototype.visitArgumentDefinition = function (argument, details) { };
	    SchemaVisitor.prototype.visitInterface = function (iface) { };
	    SchemaVisitor.prototype.visitUnion = function (union) { };
	    SchemaVisitor.prototype.visitEnum = function (type) { };
	    SchemaVisitor.prototype.visitEnumValue = function (value, details) { };
	    SchemaVisitor.prototype.visitInputObject = function (object) { };
	    SchemaVisitor.prototype.visitInputFieldDefinition = function (field, details) { };
	    return SchemaVisitor;
	}());
	exports.SchemaVisitor = SchemaVisitor;
	// Generic function for visiting GraphQLSchema objects.
	function visitSchema(schema, 
	    // To accommodate as many different visitor patterns as possible, the
	    // visitSchema function does not simply accept a single instance of the
	    // SchemaVisitor class, but instead accepts a function that takes the
	    // current VisitableSchemaType object and the name of a visitor method and
	    // returns an array of SchemaVisitor instances that implement the visitor
	    // method and have an interest in handling the given VisitableSchemaType
	    // object. In the simplest case, this function can always return an array
	    // containing a single visitor object, without even looking at the type or
	    // methodName parameters. In other cases, this function might sometimes
	    // return an empty array to indicate there are no visitors that should be
	    // applied to the given VisitableSchemaType object. For an example of a
	    // visitor pattern that benefits from this abstraction, see the
	    // SchemaDirectiveVisitor class below.
	    visitorSelector) {
	    // Helper function that calls visitorSelector and applies the resulting
	    // visitors to the given type, with arguments [type, ...args].
	    function callMethod(methodName, type) {
	        var args = [];
	        for (var _i = 2; _i < arguments.length; _i++) {
	            args[_i - 2] = arguments[_i];
	        }
	        visitorSelector(type, methodName).every(function (visitor) {
	            var newType = visitor[methodName].apply(visitor, [type].concat(args));
	            if (typeof newType === 'undefined') {
	                // Keep going without modifying type.
	                return true;
	            }
	            if (methodName === 'visitSchema' ||
	                type instanceof graphql_1__default.GraphQLSchema) {
	                throw new Error("Method " + methodName + " cannot replace schema with " + newType);
	            }
	            if (newType === null) {
	                // Stop the loop and return null form callMethod, which will cause
	                // the type to be removed from the schema.
	                type = null;
	                return false;
	            }
	            // Update type to the new type returned by the visitor method, so that
	            // later directives will see the new type, and callMethod will return
	            // the final type.
	            type = newType;
	        });
	        // If there were no directives for this type object, or if all visitor
	        // methods returned nothing, type will be returned unmodified.
	        return type;
	    }
	    // Recursive helper function that calls any appropriate visitor methods for
	    // each object in the schema, then traverses the object's children (if any).
	    function visit(type) {
	        if (type instanceof graphql_1__default.GraphQLSchema) {
	            // Unlike the other types, the root GraphQLSchema object cannot be
	            // replaced by visitor methods, because that would make life very hard
	            // for SchemaVisitor subclasses that rely on the original schema object.
	            callMethod('visitSchema', type);
	            updateEachKey(type.getTypeMap(), function (namedType, typeName) {
	                if (!typeName.startsWith('__')) {
	                    // Call visit recursively to let it determine which concrete
	                    // subclass of GraphQLNamedType we found in the type map. Because
	                    // we're using updateEachKey, the result of visit(namedType) may
	                    // cause the type to be removed or replaced.
	                    return visit(namedType);
	                }
	            });
	            return type;
	        }
	        if (type instanceof graphql_1__default.GraphQLObjectType) {
	            // Note that callMethod('visitObject', type) may not actually call any
	            // methods, if there are no @directive annotations associated with this
	            // type, or if this SchemaDirectiveVisitor subclass does not override
	            // the visitObject method.
	            var newObject = callMethod('visitObject', type);
	            if (newObject) {
	                visitFields(newObject);
	            }
	            return newObject;
	        }
	        if (type instanceof graphql_1__default.GraphQLInterfaceType) {
	            var newInterface = callMethod('visitInterface', type);
	            if (newInterface) {
	                visitFields(newInterface);
	            }
	            return newInterface;
	        }
	        if (type instanceof graphql_1__default.GraphQLInputObjectType) {
	            var newInputObject_1 = callMethod('visitInputObject', type);
	            if (newInputObject_1) {
	                updateEachKey(newInputObject_1.getFields(), function (field) {
	                    // Since we call a different method for input object fields, we
	                    // can't reuse the visitFields function here.
	                    return callMethod('visitInputFieldDefinition', field, {
	                        objectType: newInputObject_1,
	                    });
	                });
	            }
	            return newInputObject_1;
	        }
	        if (type instanceof graphql_1__default.GraphQLScalarType) {
	            return callMethod('visitScalar', type);
	        }
	        if (type instanceof graphql_1__default.GraphQLUnionType) {
	            return callMethod('visitUnion', type);
	        }
	        if (type instanceof graphql_1__default.GraphQLEnumType) {
	            var newEnum_1 = callMethod('visitEnum', type);
	            if (newEnum_1) {
	                updateEachKey(newEnum_1.getValues(), function (value) {
	                    return callMethod('visitEnumValue', value, {
	                        enumType: newEnum_1,
	                    });
	                });
	            }
	            return newEnum_1;
	        }
	        throw new Error("Unexpected schema type: " + type);
	    }
	    function visitFields(type) {
	        updateEachKey(type.getFields(), function (field) {
	            // It would be nice if we could call visit(field) recursively here, but
	            // GraphQLField is merely a type, not a value that can be detected using
	            // an instanceof check, so we have to visit the fields in this lexical
	            // context, so that TypeScript can validate the call to
	            // visitFieldDefinition.
	            var newField = callMethod('visitFieldDefinition', field, {
	                // While any field visitor needs a reference to the field object, some
	                // field visitors may also need to know the enclosing (parent) type,
	                // perhaps to determine if the parent is a GraphQLObjectType or a
	                // GraphQLInterfaceType. To obtain a reference to the parent, a
	                // visitor method can have a second parameter, which will be an object
	                // with an .objectType property referring to the parent.
	                objectType: type,
	            });
	            if (newField && newField.args) {
	                updateEachKey(newField.args, function (arg) {
	                    return callMethod('visitArgumentDefinition', arg, {
	                        // Like visitFieldDefinition, visitArgumentDefinition takes a
	                        // second parameter that provides additional context, namely the
	                        // parent .field and grandparent .objectType. Remember that the
	                        // current GraphQLSchema is always available via this.schema.
	                        field: newField,
	                        objectType: type,
	                    });
	                });
	            }
	            return newField;
	        });
	    }
	    visit(schema);
	    // Return the original schema for convenience, even though it cannot have
	    // been replaced or removed by the code above.
	    return schema;
	}
	exports.visitSchema = visitSchema;
	// Update any references to named schema types that disagree with the named
	// types found in schema.getTypeMap().
	function healSchema(schema) {
	    heal(schema);
	    return schema;
	    function heal(type) {
	        if (type instanceof graphql_1__default.GraphQLSchema) {
	            var originalTypeMap_1 = type.getTypeMap();
	            var actualNamedTypeMap_1 = Object.create(null);
	            // If any of the .name properties of the GraphQLNamedType objects in
	            // schema.getTypeMap() have changed, the keys of the type map need to
	            // be updated accordingly.
	            each(originalTypeMap_1, function (namedType, typeName) {
	                if (typeName.startsWith('__')) {
	                    return;
	                }
	                var actualName = namedType.name;
	                if (actualName.startsWith('__')) {
	                    return;
	                }
	                if (hasOwn.call(actualNamedTypeMap_1, actualName)) {
	                    throw new Error("Duplicate schema type name " + actualName);
	                }
	                actualNamedTypeMap_1[actualName] = namedType;
	                // Note: we are deliberately leaving namedType in the schema by its
	                // original name (which might be different from actualName), so that
	                // references by that name can be healed.
	            });
	            // Now add back every named type by its actual name.
	            each(actualNamedTypeMap_1, function (namedType, typeName) {
	                originalTypeMap_1[typeName] = namedType;
	            });
	            // Directive declaration argument types can refer to named types.
	            each(type.getDirectives(), function (decl) {
	                if (decl.args) {
	                    each(decl.args, function (arg) {
	                        arg.type = healType(arg.type);
	                    });
	                }
	            });
	            each(originalTypeMap_1, function (namedType, typeName) {
	                if (!typeName.startsWith('__')) {
	                    heal(namedType);
	                }
	            });
	            updateEachKey(originalTypeMap_1, function (namedType, typeName) {
	                // Dangling references to renamed types should remain in the schema
	                // during healing, but must be removed now, so that the following
	                // invariant holds for all names: schema.getType(name).name === name
	                if (!typeName.startsWith('__') &&
	                    !hasOwn.call(actualNamedTypeMap_1, typeName)) {
	                    return null;
	                }
	            });
	        }
	        else if (type instanceof graphql_1__default.GraphQLObjectType) {
	            healFields(type);
	            each(type.getInterfaces(), function (iface) { return heal(iface); });
	        }
	        else if (type instanceof graphql_1__default.GraphQLInterfaceType) {
	            healFields(type);
	        }
	        else if (type instanceof graphql_1__default.GraphQLInputObjectType) {
	            each(type.getFields(), function (field) {
	                field.type = healType(field.type);
	            });
	        }
	        else if (type instanceof graphql_1__default.GraphQLScalarType) ;
	        else if (type instanceof graphql_1__default.GraphQLUnionType) {
	            updateEachKey(type.getTypes(), function (t) { return healType(t); });
	        }
	        else if (type instanceof graphql_1__default.GraphQLEnumType) ;
	        else {
	            throw new Error("Unexpected schema type: " + type);
	        }
	    }
	    function healFields(type) {
	        each(type.getFields(), function (field) {
	            field.type = healType(field.type);
	            if (field.args) {
	                each(field.args, function (arg) {
	                    arg.type = healType(arg.type);
	                });
	            }
	        });
	    }
	    function healType(type) {
	        if (type instanceof graphql_1__default.GraphQLList ||
	            type instanceof graphql_1__default.GraphQLNonNull) {
	            // Unwrap the two known wrapper types:
	            // https://github.com/graphql/graphql-js/blob/master/src/type/wrappers.js
	            type.ofType = healType(type.ofType);
	        }
	        else if (graphql_1__default.isNamedType(type)) {
	            // If a type annotation on a field or an argument or a union member is
	            // any `GraphQLNamedType` with a `name`, then it must end up identical
	            // to `schema.getType(name)`, since `schema.getTypeMap()` is the source
	            // of truth for all named schema types.
	            var namedType = type;
	            var officialType = schema.getType(namedType.name);
	            if (officialType && namedType !== officialType) {
	                return officialType;
	            }
	        }
	        return type;
	    }
	}
	exports.healSchema = healSchema;
	// This class represents a reusable implementation of a @directive that may
	// appear in a GraphQL schema written in Schema Definition Language.
	//
	// By overriding one or more visit{Object,Union,...} methods, a subclass
	// registers interest in certain schema types, such as GraphQLObjectType,
	// GraphQLUnionType, etc. When SchemaDirectiveVisitor.visitSchemaDirectives is
	// called with a GraphQLSchema object and a map of visitor subclasses, the
	// overidden methods of those subclasses allow the visitors to obtain
	// references to any type objects that have @directives attached to them,
	// enabling visitors to inspect or modify the schema as appropriate.
	//
	// For example, if a directive called @rest(url: "...") appears after a field
	// definition, a SchemaDirectiveVisitor subclass could provide meaning to that
	// directive by overriding the visitFieldDefinition method (which receives a
	// GraphQLField parameter), and then the body of that visitor method could
	// manipulate the field's resolver function to fetch data from a REST endpoint
	// described by the url argument passed to the @rest directive:
	//
	//   const typeDefs = `
	//   type Query {
	//     people: [Person] @rest(url: "/api/v1/people")
	//   }`;
	//
	//   const schema = makeExecutableSchema({ typeDefs });
	//
	//   SchemaDirectiveVisitor.visitSchemaDirectives(schema, {
	//     rest: class extends SchemaDirectiveVisitor {
	//       public visitFieldDefinition(field: GraphQLField<any, any>) {
	//         const { url } = this.args;
	//         field.resolve = () => fetch(url);
	//       }
	//     }
	//   });
	//
	// The subclass in this example is defined as an anonymous class expression,
	// for brevity. A truly reusable SchemaDirectiveVisitor would most likely be
	// defined in a library using a named class declaration, and then exported for
	// consumption by other modules and packages.
	//
	// See below for a complete list of overridable visitor methods, their
	// parameter types, and more details about the properties exposed by instances
	// of the SchemaDirectiveVisitor class.
	var SchemaDirectiveVisitor = /** @class */ (function (_super) {
	    __extends(SchemaDirectiveVisitor, _super);
	    // Mark the constructor protected to enforce passing SchemaDirectiveVisitor
	    // subclasses (not instances) to visitSchemaDirectives.
	    function SchemaDirectiveVisitor(config) {
	        var _this = _super.call(this) || this;
	        _this.name = config.name;
	        _this.args = config.args;
	        _this.visitedType = config.visitedType;
	        _this.schema = config.schema;
	        _this.context = config.context;
	        return _this;
	    }
	    // Override this method to return a custom GraphQLDirective (or modify one
	    // already present in the schema) to enforce argument types, provide default
	    // argument values, or specify schema locations where this @directive may
	    // appear. By default, any declaration found in the schema will be returned.
	    SchemaDirectiveVisitor.getDirectiveDeclaration = function (directiveName, schema) {
	        return schema.getDirective(directiveName);
	    };
	    // Call SchemaDirectiveVisitor.visitSchemaDirectives to visit every
	    // @directive in the schema and create an appropriate SchemaDirectiveVisitor
	    // instance to visit the object decorated by the @directive.
	    SchemaDirectiveVisitor.visitSchemaDirectives = function (schema, directiveVisitors, 
	        // Optional context object that will be available to all visitor instances
	        // via this.context. Defaults to an empty null-prototype object.
	        context) {
	        // Optional context object that will be available to all visitor instances
	        // via this.context. Defaults to an empty null-prototype object.
	        if (context === void 0) { context = Object.create(null); }
	        // If the schema declares any directives for public consumption, record
	        // them here so that we can properly coerce arguments when/if we encounter
	        // an occurrence of the directive while walking the schema below.
	        var declaredDirectives = this.getDeclaredDirectives(schema, directiveVisitors);
	        // Map from directive names to lists of SchemaDirectiveVisitor instances
	        // created while visiting the schema.
	        var createdVisitors = Object.create(null);
	        Object.keys(directiveVisitors).forEach(function (directiveName) {
	            createdVisitors[directiveName] = [];
	        });
	        function visitorSelector(type, methodName) {
	            var visitors = [];
	            var directiveNodes = type.astNode && type.astNode.directives;
	            if (!directiveNodes) {
	                return visitors;
	            }
	            directiveNodes.forEach(function (directiveNode) {
	                var directiveName = directiveNode.name.value;
	                if (!hasOwn.call(directiveVisitors, directiveName)) {
	                    return;
	                }
	                var visitorClass = directiveVisitors[directiveName];
	                // Avoid creating visitor objects if visitorClass does not override
	                // the visitor method named by methodName.
	                if (!visitorClass.implementsVisitorMethod(methodName)) {
	                    return;
	                }
	                var decl = declaredDirectives[directiveName];
	                var args;
	                if (decl) {
	                    // If this directive was explicitly declared, use the declared
	                    // argument types (and any default values) to check, coerce, and/or
	                    // supply default values for the given arguments.
	                    args = values.getArgumentValues(decl, directiveNode);
	                }
	                else {
	                    // If this directive was not explicitly declared, just convert the
	                    // argument nodes to their corresponding JavaScript values.
	                    args = Object.create(null);
	                    directiveNode.arguments.forEach(function (arg) {
	                        args[arg.name.value] = valueFromASTUntyped(arg.value);
	                    });
	                }
	                // As foretold in comments near the top of the visitSchemaDirectives
	                // method, this is where instances of the SchemaDirectiveVisitor class
	                // get created and assigned names. While subclasses could override the
	                // constructor method, the constructor is marked as protected, so
	                // these are the only arguments that will ever be passed.
	                visitors.push(new visitorClass({
	                    name: directiveName,
	                    args: args,
	                    visitedType: type,
	                    schema: schema,
	                    context: context,
	                }));
	            });
	            if (visitors.length > 0) {
	                visitors.forEach(function (visitor) {
	                    createdVisitors[visitor.name].push(visitor);
	                });
	            }
	            return visitors;
	        }
	        visitSchema(schema, visitorSelector);
	        // Automatically update any references to named schema types replaced
	        // during the traversal, so implementors don't have to worry about that.
	        healSchema(schema);
	        return createdVisitors;
	    };
	    SchemaDirectiveVisitor.getDeclaredDirectives = function (schema, directiveVisitors) {
	        var declaredDirectives = Object.create(null);
	        each(schema.getDirectives(), function (decl) {
	            declaredDirectives[decl.name] = decl;
	        });
	        // If the visitor subclass overrides getDirectiveDeclaration, and it
	        // returns a non-null GraphQLDirective, use that instead of any directive
	        // declared in the schema itself. Reasoning: if a SchemaDirectiveVisitor
	        // goes to the trouble of implementing getDirectiveDeclaration, it should
	        // be able to rely on that implementation.
	        each(directiveVisitors, function (visitorClass, directiveName) {
	            var decl = visitorClass.getDirectiveDeclaration(directiveName, schema);
	            if (decl) {
	                declaredDirectives[directiveName] = decl;
	            }
	        });
	        each(declaredDirectives, function (decl, name) {
	            if (!hasOwn.call(directiveVisitors, name)) {
	                // SchemaDirectiveVisitors.visitSchemaDirectives might be called
	                // multiple times with partial directiveVisitors maps, so it's not
	                // necessarily an error for directiveVisitors to be missing an
	                // implementation of a directive that was declared in the schema.
	                return;
	            }
	            var visitorClass = directiveVisitors[name];
	            each(decl.locations, function (loc) {
	                var visitorMethodName = directiveLocationToVisitorMethodName(loc);
	                if (SchemaVisitor.implementsVisitorMethod(visitorMethodName) &&
	                    !visitorClass.implementsVisitorMethod(visitorMethodName)) {
	                    // While visitor subclasses may implement extra visitor methods,
	                    // it's definitely a mistake if the GraphQLDirective declares itself
	                    // applicable to certain schema locations, and the visitor subclass
	                    // does not implement all the corresponding methods.
	                    throw new Error("SchemaDirectiveVisitor for @" + name + " must implement " + visitorMethodName + " method");
	                }
	            });
	        });
	        return declaredDirectives;
	    };
	    return SchemaDirectiveVisitor;
	}(SchemaVisitor));
	exports.SchemaDirectiveVisitor = SchemaDirectiveVisitor;
	// Convert a string like "FIELD_DEFINITION" to "visitFieldDefinition".
	function directiveLocationToVisitorMethodName(loc) {
	    return 'visit' + loc.replace(/([^_]*)_?/g, function (wholeMatch, part) {
	        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
	    });
	}
	function each(arrayOrObject, callback) {
	    Object.keys(arrayOrObject).forEach(function (key) {
	        callback(arrayOrObject[key], key);
	    });
	}
	// A more powerful version of each that has the ability to replace or remove
	// array or object keys.
	function updateEachKey(arrayOrObject, 
	    // The callback can return nothing to leave the key untouched, null to remove
	    // the key from the array or object, or a non-null V to replace the value.
	    callback) {
	    var deletedCount = 0;
	    Object.keys(arrayOrObject).forEach(function (key) {
	        var result = callback(arrayOrObject[key], key);
	        if (typeof result === 'undefined') {
	            return;
	        }
	        if (result === null) {
	            delete arrayOrObject[key];
	            deletedCount++;
	            return;
	        }
	        arrayOrObject[key] = result;
	    });
	    if (deletedCount > 0 && Array.isArray(arrayOrObject)) {
	        // Remove any holes from the array due to deleted elements.
	        arrayOrObject.splice(0).forEach(function (elem) {
	            arrayOrObject.push(elem);
	        });
	    }
	}
	// Similar to the graphql-js function of the same name, slightly simplified:
	// https://github.com/graphql/graphql-js/blob/master/src/utilities/valueFromASTUntyped.js
	function valueFromASTUntyped(valueNode) {
	    switch (valueNode.kind) {
	        case graphql_1__default.Kind.NULL:
	            return null;
	        case graphql_1__default.Kind.INT:
	            return parseInt(valueNode.value, 10);
	        case graphql_1__default.Kind.FLOAT:
	            return parseFloat(valueNode.value);
	        case graphql_1__default.Kind.STRING:
	        case graphql_1__default.Kind.ENUM:
	        case graphql_1__default.Kind.BOOLEAN:
	            return valueNode.value;
	        case graphql_1__default.Kind.LIST:
	            return valueNode.values.map(valueFromASTUntyped);
	        case graphql_1__default.Kind.OBJECT:
	            var obj_1 = Object.create(null);
	            valueNode.fields.forEach(function (field) {
	                obj_1[field.name.value] = valueFromASTUntyped(field.value);
	            });
	            return obj_1;
	        /* istanbul ignore next */
	        default:
	            throw new Error('Unexpected value kind: ' + valueNode.kind);
	    }
	}

	});

	unwrapExports(schemaVisitor);
	var schemaVisitor_1 = schemaVisitor.SchemaVisitor;
	var schemaVisitor_2 = schemaVisitor.visitSchema;
	var schemaVisitor_3 = schemaVisitor.healSchema;
	var schemaVisitor_4 = schemaVisitor.SchemaDirectiveVisitor;

	var bld = createCommonjsModule(function (module, exports) {
	/** @internal */
	exports.options = {
	    getWarner: undefined
	};
	function createWarner(type, name, alternative, version, url) {
	    var warnedPositions = {};
	    return function () {
	        var stack = (new Error()).stack || '';
	        var at = (stack.match(/(?:\s+at\s.+){2}\s+at\s(.+)/) || [undefined, ''])[1];
	        if (/\)$/.test(at)) {
	            at = at.match(/[^(]+(?=\)$)/)[0];
	        }
	        else {
	            at = at.trim();
	        }
	        if (at in warnedPositions) {
	            return;
	        }
	        warnedPositions[at] = true;
	        var message;
	        switch (type) {
	            case 'class':
	                message = 'Class';
	                break;
	            case 'property':
	                message = 'Property';
	                break;
	            case 'method':
	                message = 'Method';
	                break;
	            case 'function':
	                message = 'Function';
	                break;
	        }
	        message += " `" + name + "` has been deprecated";
	        if (version) {
	            message += " since version " + version;
	        }
	        if (alternative) {
	            message += ", use `" + alternative + "` instead";
	        }
	        message += '.';
	        if (at) {
	            message += "\n    at " + at;
	        }
	        if (url) {
	            message += "\nCheck out " + url + " for more information.";
	        }
	        console.warn(message);
	    };
	}
	function decorateProperty(type, name, descriptor, alternative, version, url) {
	    var warner = (exports.options.getWarner || createWarner)(type, name, alternative, version, url);
	    descriptor = descriptor || {
	        writable: true,
	        enumerable: false,
	        configurable: true
	    };
	    var deprecatedDescriptor = {
	        enumerable: descriptor.enumerable,
	        configurable: descriptor.configurable
	    };
	    if (descriptor.get || descriptor.set) {
	        if (descriptor.get) {
	            deprecatedDescriptor.get = function () {
	                warner();
	                return descriptor.get.call(this);
	            };
	        }
	        if (descriptor.set) {
	            deprecatedDescriptor.set = function (value) {
	                warner();
	                return descriptor.set.call(this, value);
	            };
	        }
	    }
	    else {
	        var propertyValue_1 = descriptor.value;
	        deprecatedDescriptor.get = function () {
	            warner();
	            return propertyValue_1;
	        };
	        if (descriptor.writable) {
	            deprecatedDescriptor.set = function (value) {
	                warner();
	                propertyValue_1 = value;
	            };
	        }
	    }
	    return deprecatedDescriptor;
	}
	function decorateFunction(type, target, alternative, version, url) {
	    var name = target.name;
	    var warner = (exports.options.getWarner || createWarner)(type, name, alternative, version, url);
	    var fn = function () {
	        warner();
	        return target.apply(this, arguments);
	    };
	    for (var _i = 0, _a = Object.getOwnPropertyNames(target); _i < _a.length; _i++) {
	        var propertyName = _a[_i];
	        var descriptor = Object.getOwnPropertyDescriptor(target, propertyName);
	        if (descriptor.writable) {
	            fn[propertyName] = target[propertyName];
	        }
	        else if (descriptor.configurable) {
	            Object.defineProperty(fn, propertyName, descriptor);
	        }
	    }
	    return fn;
	}
	function deprecated() {
	    var args = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        args[_i - 0] = arguments[_i];
	    }
	    var fn = args[args.length - 1];
	    if (typeof fn === 'function') {
	        fn = args.pop();
	    }
	    else {
	        fn = undefined;
	    }
	    var options = args[0];
	    var alternative;
	    var version;
	    var url;
	    if (typeof options === 'string') {
	        alternative = options;
	        version = args[1];
	        url = args[2];
	    }
	    else if (options) {
	        (alternative = options.alternative, version = options.version, url = options.url, options);
	    }
	    if (fn) {
	        return decorateFunction('function', fn, alternative, version, url);
	    }
	    return function (target, name, descriptor) {
	        if (typeof name === 'string') {
	            var type = descriptor && typeof descriptor.value === 'function' ?
	                'method' : 'property';
	            return decorateProperty(type, name, descriptor, alternative, version, url);
	        }
	        else if (typeof target === 'function') {
	            var constructor = decorateFunction('class', target, alternative, version, url);
	            var className = target.name;
	            for (var _i = 0, _a = Object.getOwnPropertyNames(constructor); _i < _a.length; _i++) {
	                var propertyName = _a[_i];
	                var descriptor_1 = Object.getOwnPropertyDescriptor(constructor, propertyName);
	                descriptor_1 = decorateProperty('class', className, descriptor_1, alternative, version, url);
	                if (descriptor_1.writable) {
	                    constructor[propertyName] = target[propertyName];
	                }
	                else if (descriptor_1.configurable) {
	                    Object.defineProperty(constructor, propertyName, descriptor_1);
	                }
	            }
	            return constructor;
	        }
	    };
	}
	exports.deprecated = deprecated;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = deprecated;

	});

	unwrapExports(bld);
	var bld_1 = bld.options;
	var bld_2 = bld.deprecated;

	var mergeDeep_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	function mergeDeep(target, source) {
	    var output = Object.assign({}, target);
	    if (isObject(target) && isObject(source)) {
	        Object.keys(source).forEach(function (key) {
	            if (isObject(source[key])) {
	                if (!(key in target)) {
	                    Object.assign(output, (_a = {}, _a[key] = source[key], _a));
	                }
	                else {
	                    output[key] = mergeDeep(target[key], source[key]);
	                }
	            }
	            else {
	                Object.assign(output, (_b = {}, _b[key] = source[key], _b));
	            }
	            var _a, _b;
	        });
	    }
	    return output;
	}
	exports.default = mergeDeep;
	function isObject(item) {
	    return item && typeof item === 'object' && !Array.isArray(item);
	}

	});

	unwrapExports(mergeDeep_1);

	var schemaGenerator = createCommonjsModule(function (module, exports) {
	// Generates a schema for graphql-js given a shorthand schema
	var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	// TODO: document each function clearly in the code: what arguments it accepts
	// and what it outputs.
	// TODO: we should refactor this file, rename it to makeExecutableSchema, and move
	// a bunch of utility functions into a separate utitlities folder, one file per function.




	// @schemaDefinition: A GraphQL type schema in shorthand
	// @resolvers: Definitions for resolvers to be merged with schema
	var SchemaError = /** @class */ (function (_super) {
	    __extends(SchemaError, _super);
	    function SchemaError(message) {
	        var _this = _super.call(this, message) || this;
	        _this.message = message;
	        Error.captureStackTrace(_this, _this.constructor);
	        return _this;
	    }
	    return SchemaError;
	}(Error));
	exports.SchemaError = SchemaError;
	// type definitions can be a string or an array of strings.
	function _generateSchema(typeDefinitions, resolveFunctions, logger, 
	    // TODO: rename to allowUndefinedInResolve to be consistent
	    allowUndefinedInResolve, resolverValidationOptions, parseOptions, inheritResolversFromInterfaces) {
	    if (typeof resolverValidationOptions !== 'object') {
	        throw new SchemaError('Expected `resolverValidationOptions` to be an object');
	    }
	    if (!typeDefinitions) {
	        throw new SchemaError('Must provide typeDefs');
	    }
	    if (!resolveFunctions) {
	        throw new SchemaError('Must provide resolvers');
	    }
	    var resolvers = Array.isArray(resolveFunctions)
	        ? resolveFunctions
	            .filter(function (resolverObj) { return typeof resolverObj === 'object'; })
	            .reduce(mergeDeep_1.default, {})
	        : resolveFunctions;
	    // TODO: check that typeDefinitions is either string or array of strings
	    var schema = buildSchemaFromTypeDefinitions(typeDefinitions, parseOptions);
	    addResolveFunctionsToSchema({ schema: schema, resolvers: resolvers, resolverValidationOptions: resolverValidationOptions, inheritResolversFromInterfaces: inheritResolversFromInterfaces });
	    assertResolveFunctionsPresent(schema, resolverValidationOptions);
	    if (!allowUndefinedInResolve) {
	        addCatchUndefinedToSchema(schema);
	    }
	    if (logger) {
	        addErrorLoggingToSchema(schema, logger);
	    }
	    return schema;
	}
	function makeExecutableSchema(_a) {
	    var typeDefs = _a.typeDefs, _b = _a.resolvers, resolvers = _b === void 0 ? {} : _b, connectors = _a.connectors, logger = _a.logger, _c = _a.allowUndefinedInResolve, allowUndefinedInResolve = _c === void 0 ? true : _c, _d = _a.resolverValidationOptions, resolverValidationOptions = _d === void 0 ? {} : _d, _e = _a.directiveResolvers, directiveResolvers = _e === void 0 ? null : _e, _f = _a.schemaDirectives, schemaDirectives = _f === void 0 ? null : _f, _g = _a.parseOptions, parseOptions = _g === void 0 ? {} : _g, _h = _a.inheritResolversFromInterfaces, inheritResolversFromInterfaces = _h === void 0 ? false : _h;
	    var jsSchema = _generateSchema(typeDefs, resolvers, logger, allowUndefinedInResolve, resolverValidationOptions, parseOptions, inheritResolversFromInterfaces);
	    if (typeof resolvers['__schema'] === 'function') {
	        // TODO a bit of a hack now, better rewrite generateSchema to attach it there.
	        // not doing that now, because I'd have to rewrite a lot of tests.
	        addSchemaLevelResolveFunction(jsSchema, resolvers['__schema']);
	    }
	    if (connectors) {
	        // connectors are optional, at least for now. That means you can just import them in the resolve
	        // function if you want.
	        attachConnectorsToContext(jsSchema, connectors);
	    }
	    if (directiveResolvers) {
	        attachDirectiveResolvers(jsSchema, directiveResolvers);
	    }
	    if (schemaDirectives) {
	        schemaVisitor.SchemaDirectiveVisitor.visitSchemaDirectives(jsSchema, schemaDirectives);
	    }
	    return jsSchema;
	}
	exports.makeExecutableSchema = makeExecutableSchema;
	function isDocumentNode(typeDefinitions) {
	    return typeDefinitions.kind !== undefined;
	}
	function uniq(array) {
	    return array.reduce(function (accumulator, currentValue) {
	        return accumulator.indexOf(currentValue) === -1
	            ? accumulator.concat([currentValue]) : accumulator;
	    }, []);
	}
	function concatenateTypeDefs(typeDefinitionsAry, calledFunctionRefs) {
	    if (calledFunctionRefs === void 0) { calledFunctionRefs = []; }
	    var resolvedTypeDefinitions = [];
	    typeDefinitionsAry.forEach(function (typeDef) {
	        if (isDocumentNode(typeDef)) {
	            typeDef = graphql_1__default.print(typeDef);
	        }
	        if (typeof typeDef === 'function') {
	            if (calledFunctionRefs.indexOf(typeDef) === -1) {
	                calledFunctionRefs.push(typeDef);
	                resolvedTypeDefinitions = resolvedTypeDefinitions.concat(concatenateTypeDefs(typeDef(), calledFunctionRefs));
	            }
	        }
	        else if (typeof typeDef === 'string') {
	            resolvedTypeDefinitions.push(typeDef.trim());
	        }
	        else {
	            var type = typeof typeDef;
	            throw new SchemaError("typeDef array must contain only strings and functions, got " + type);
	        }
	    });
	    return uniq(resolvedTypeDefinitions.map(function (x) { return x.trim(); })).join('\n');
	}
	exports.concatenateTypeDefs = concatenateTypeDefs;
	function buildSchemaFromTypeDefinitions(typeDefinitions, parseOptions) {
	    // TODO: accept only array here, otherwise interfaces get confusing.
	    var myDefinitions = typeDefinitions;
	    var astDocument;
	    if (isDocumentNode(typeDefinitions)) {
	        astDocument = typeDefinitions;
	    }
	    else if (typeof myDefinitions !== 'string') {
	        if (!Array.isArray(myDefinitions)) {
	            var type = typeof myDefinitions;
	            throw new SchemaError("typeDefs must be a string, array or schema AST, got " + type);
	        }
	        myDefinitions = concatenateTypeDefs(myDefinitions);
	    }
	    if (typeof myDefinitions === 'string') {
	        astDocument = graphql_1__default.parse(myDefinitions, parseOptions);
	    }
	    var backcompatOptions = { commentDescriptions: true };
	    // TODO fix types https://github.com/apollographql/graphql-tools/issues/542
	    var schema = graphql_1__default.buildASTSchema(astDocument, backcompatOptions);
	    var extensionsAst = extractExtensionDefinitions(astDocument);
	    if (extensionsAst.definitions.length > 0) {
	        // TODO fix types https://github.com/apollographql/graphql-tools/issues/542
	        schema = graphql_1__default.extendSchema(schema, extensionsAst, backcompatOptions);
	    }
	    return schema;
	}
	exports.buildSchemaFromTypeDefinitions = buildSchemaFromTypeDefinitions;
	// This was changed in graphql@0.12
	// See https://github.com/apollographql/graphql-tools/pull/541
	// TODO fix types https://github.com/apollographql/graphql-tools/issues/542
	var oldTypeExtensionDefinitionKind = 'TypeExtensionDefinition';
	var newExtensionDefinitionKind = 'ObjectTypeExtension';
	var interfaceExtensionDefinitionKind = 'InterfaceTypeExtension';
	function extractExtensionDefinitions(ast) {
	    var extensionDefs = ast.definitions.filter(function (def) {
	        return def.kind === oldTypeExtensionDefinitionKind ||
	            def.kind === newExtensionDefinitionKind ||
	            def.kind === interfaceExtensionDefinitionKind;
	    });
	    return Object.assign({}, ast, {
	        definitions: extensionDefs,
	    });
	}
	exports.extractExtensionDefinitions = extractExtensionDefinitions;
	function forEachField(schema, fn) {
	    var typeMap = schema.getTypeMap();
	    Object.keys(typeMap).forEach(function (typeName) {
	        var type = typeMap[typeName];
	        // TODO: maybe have an option to include these?
	        if (!graphql_1__default.getNamedType(type).name.startsWith('__') &&
	            type instanceof graphql_1__default.GraphQLObjectType) {
	            var fields_1 = type.getFields();
	            Object.keys(fields_1).forEach(function (fieldName) {
	                var field = fields_1[fieldName];
	                fn(field, typeName, fieldName);
	            });
	        }
	    });
	}
	exports.forEachField = forEachField;
	// takes a GraphQL-JS schema and an object of connectors, then attaches
	// the connectors to the context by wrapping each query or mutation resolve
	// function with a function that attaches connectors if they don't exist.
	// attaches connectors only once to make sure they are singletons
	var attachConnectorsToContext = bld.deprecated({
	    version: '0.7.0',
	    url: 'https://github.com/apollostack/graphql-tools/issues/140',
	}, function (schema, connectors) {
	    if (!schema || !(schema instanceof graphql_1__default.GraphQLSchema)) {
	        throw new Error('schema must be an instance of GraphQLSchema. ' +
	            'This error could be caused by installing more than one version of GraphQL-JS');
	    }
	    if (typeof connectors !== 'object') {
	        var connectorType = typeof connectors;
	        throw new Error("Expected connectors to be of type object, got " + connectorType);
	    }
	    if (Object.keys(connectors).length === 0) {
	        throw new Error('Expected connectors to not be an empty object');
	    }
	    if (Array.isArray(connectors)) {
	        throw new Error('Expected connectors to be of type object, got Array');
	    }
	    if (schema['_apolloConnectorsAttached']) {
	        throw new Error('Connectors already attached to context, cannot attach more than once');
	    }
	    schema['_apolloConnectorsAttached'] = true;
	    var attachconnectorFn = function (root, args, ctx) {
	        if (typeof ctx !== 'object') {
	            // if in any way possible, we should throw an error when the attachconnectors
	            // function is called, not when a query is executed.
	            var contextType = typeof ctx;
	            throw new Error("Cannot attach connector because context is not an object: " + contextType);
	        }
	        if (typeof ctx.connectors === 'undefined') {
	            ctx.connectors = {};
	        }
	        Object.keys(connectors).forEach(function (connectorName) {
	            var connector = connectors[connectorName];
	            if (!!connector.prototype) {
	                ctx.connectors[connectorName] = new connector(ctx);
	            }
	            else {
	                throw new Error("Connector must be a function or an class");
	            }
	        });
	        return root;
	    };
	    addSchemaLevelResolveFunction(schema, attachconnectorFn);
	});
	exports.attachConnectorsToContext = attachConnectorsToContext;
	// wraps all resolve functions of query, mutation or subscription fields
	// with the provided function to simulate a root schema level resolve funciton
	function addSchemaLevelResolveFunction(schema, fn) {
	    // TODO test that schema is a schema, fn is a function
	    var rootTypes = [
	        schema.getQueryType(),
	        schema.getMutationType(),
	        schema.getSubscriptionType(),
	    ].filter(function (x) { return !!x; });
	    rootTypes.forEach(function (type) {
	        // XXX this should run at most once per request to simulate a true root resolver
	        // for graphql-js this is an approximation that works with queries but not mutations
	        var rootResolveFn = runAtMostOncePerRequest(fn);
	        var fields = type.getFields();
	        Object.keys(fields).forEach(function (fieldName) {
	            // XXX if the type is a subscription, a same query AST will be ran multiple times so we
	            // deactivate here the runOnce if it's a subscription. This may not be optimal though...
	            if (type === schema.getSubscriptionType()) {
	                fields[fieldName].resolve = wrapResolver(fields[fieldName].resolve, fn);
	            }
	            else {
	                fields[fieldName].resolve = wrapResolver(fields[fieldName].resolve, rootResolveFn);
	            }
	        });
	    });
	}
	exports.addSchemaLevelResolveFunction = addSchemaLevelResolveFunction;
	function getFieldsForType(type) {
	    if (type instanceof graphql_1__default.GraphQLObjectType ||
	        type instanceof graphql_1__default.GraphQLInterfaceType) {
	        return type.getFields();
	    }
	    else {
	        return undefined;
	    }
	}
	function addResolveFunctionsToSchema(options, legacyInputResolvers, legacyInputValidationOptions) {
	    if (options instanceof graphql_1__default.GraphQLSchema) {
	        console.warn('The addResolveFunctionsToSchema function takes named options now; see IAddResolveFunctionsToSchemaOptions');
	        options = {
	            schema: options,
	            resolvers: legacyInputResolvers,
	            resolverValidationOptions: legacyInputValidationOptions
	        };
	    }
	    var schema = options.schema, inputResolvers = options.resolvers, _a = options.resolverValidationOptions, resolverValidationOptions = _a === void 0 ? {} : _a, _b = options.inheritResolversFromInterfaces, inheritResolversFromInterfaces = _b === void 0 ? false : _b;
	    var _c = resolverValidationOptions.allowResolversNotInSchema, allowResolversNotInSchema = _c === void 0 ? false : _c, requireResolversForResolveType = resolverValidationOptions.requireResolversForResolveType;
	    var resolvers = inheritResolversFromInterfaces
	        ? extendResolversFromInterfaces(schema, inputResolvers)
	        : inputResolvers;
	    Object.keys(resolvers).forEach(function (typeName) {
	        var type = schema.getType(typeName);
	        if (!type && typeName !== '__schema') {
	            if (allowResolversNotInSchema) {
	                return;
	            }
	            throw new SchemaError("\"" + typeName + "\" defined in resolvers, but not in schema");
	        }
	        Object.keys(resolvers[typeName]).forEach(function (fieldName) {
	            if (fieldName.startsWith('__')) {
	                // this is for isTypeOf and resolveType and all the other stuff.
	                type[fieldName.substring(2)] = resolvers[typeName][fieldName];
	                return;
	            }
	            if (type instanceof graphql_1__default.GraphQLScalarType) {
	                type[fieldName] = resolvers[typeName][fieldName];
	                return;
	            }
	            if (type instanceof graphql_1__default.GraphQLEnumType) {
	                if (!type.getValue(fieldName)) {
	                    throw new SchemaError(typeName + "." + fieldName + " was defined in resolvers, but enum is not in schema");
	                }
	                type.getValue(fieldName)['value'] =
	                    resolvers[typeName][fieldName];
	                return;
	            }
	            // object type
	            var fields = getFieldsForType(type);
	            if (!fields) {
	                if (allowResolversNotInSchema) {
	                    return;
	                }
	                throw new SchemaError(typeName + " was defined in resolvers, but it's not an object");
	            }
	            if (!fields[fieldName]) {
	                if (allowResolversNotInSchema) {
	                    return;
	                }
	                throw new SchemaError(typeName + "." + fieldName + " defined in resolvers, but not in schema");
	            }
	            var field = fields[fieldName];
	            var fieldResolve = resolvers[typeName][fieldName];
	            if (typeof fieldResolve === 'function') {
	                // for convenience. Allows shorter syntax in resolver definition file
	                setFieldProperties(field, { resolve: fieldResolve });
	            }
	            else {
	                if (typeof fieldResolve !== 'object') {
	                    throw new SchemaError("Resolver " + typeName + "." + fieldName + " must be object or function");
	                }
	                setFieldProperties(field, fieldResolve);
	            }
	        });
	    });
	    checkForResolveTypeResolver(schema, requireResolversForResolveType);
	}
	exports.addResolveFunctionsToSchema = addResolveFunctionsToSchema;
	function extendResolversFromInterfaces(schema, resolvers) {
	    var typeNames = Object.keys(__assign({}, schema.getTypeMap(), resolvers));
	    var extendedResolvers = {};
	    typeNames.forEach(function (typeName) {
	        var typeResolvers = resolvers[typeName];
	        var type = schema.getType(typeName);
	        if (type instanceof graphql_1__default.GraphQLObjectType) {
	            var interfaceResolvers = type.getInterfaces().map(function (iFace) { return resolvers[iFace.name]; });
	            extendedResolvers[typeName] = Object.assign.apply(Object, [{}].concat(interfaceResolvers, [typeResolvers]));
	        }
	        else {
	            if (typeResolvers) {
	                extendedResolvers[typeName] = typeResolvers;
	            }
	        }
	    });
	    return extendedResolvers;
	}
	// If we have any union or interface types throw if no there is no resolveType or isTypeOf resolvers
	function checkForResolveTypeResolver(schema, requireResolversForResolveType) {
	    Object.keys(schema.getTypeMap())
	        .map(function (typeName) { return schema.getType(typeName); })
	        .forEach(function (type) {
	        if (!(type instanceof graphql_1__default.GraphQLUnionType || type instanceof graphql_1__default.GraphQLInterfaceType)) {
	            return;
	        }
	        if (!type.resolveType) {
	            if (requireResolversForResolveType === false) {
	                return;
	            }
	            if (requireResolversForResolveType === true) {
	                throw new SchemaError("Type \"" + type.name + "\" is missing a \"resolveType\" resolver");
	            }
	            // tslint:disable-next-line:max-line-length
	            console.warn("Type \"" + type.name + "\" is missing a \"resolveType\" resolver. Pass false into \"resolverValidationOptions.requireResolversForResolveType\" to disable this warning.");
	        }
	    });
	}
	function setFieldProperties(field, propertiesObj) {
	    Object.keys(propertiesObj).forEach(function (propertyName) {
	        field[propertyName] = propertiesObj[propertyName];
	    });
	}
	function assertResolveFunctionsPresent(schema, resolverValidationOptions) {
	    if (resolverValidationOptions === void 0) { resolverValidationOptions = {}; }
	    var _a = resolverValidationOptions.requireResolversForArgs, requireResolversForArgs = _a === void 0 ? false : _a, _b = resolverValidationOptions.requireResolversForNonScalar, requireResolversForNonScalar = _b === void 0 ? false : _b, _c = resolverValidationOptions.requireResolversForAllFields, requireResolversForAllFields = _c === void 0 ? false : _c;
	    if (requireResolversForAllFields &&
	        (requireResolversForArgs || requireResolversForNonScalar)) {
	        throw new TypeError('requireResolversForAllFields takes precedence over the more specific assertions. ' +
	            'Please configure either requireResolversForAllFields or requireResolversForArgs / ' +
	            'requireResolversForNonScalar, but not a combination of them.');
	    }
	    forEachField(schema, function (field, typeName, fieldName) {
	        // requires a resolve function for *every* field.
	        if (requireResolversForAllFields) {
	            expectResolveFunction(field, typeName, fieldName);
	        }
	        // requires a resolve function on every field that has arguments
	        if (requireResolversForArgs && field.args.length > 0) {
	            expectResolveFunction(field, typeName, fieldName);
	        }
	        // requires a resolve function on every field that returns a non-scalar type
	        if (requireResolversForNonScalar &&
	            !(graphql_1__default.getNamedType(field.type) instanceof graphql_1__default.GraphQLScalarType)) {
	            expectResolveFunction(field, typeName, fieldName);
	        }
	    });
	}
	exports.assertResolveFunctionsPresent = assertResolveFunctionsPresent;
	function expectResolveFunction(field, typeName, fieldName) {
	    if (!field.resolve) {
	        console.warn(
	        // tslint:disable-next-line: max-line-length
	        "Resolve function missing for \"" + typeName + "." + fieldName + "\". To disable this warning check https://github.com/apollostack/graphql-tools/issues/131");
	        return;
	    }
	    if (typeof field.resolve !== 'function') {
	        throw new SchemaError("Resolver \"" + typeName + "." + fieldName + "\" must be a function");
	    }
	}
	function addErrorLoggingToSchema(schema, logger) {
	    if (!logger) {
	        throw new Error('Must provide a logger');
	    }
	    if (typeof logger.log !== 'function') {
	        throw new Error('Logger.log must be a function');
	    }
	    forEachField(schema, function (field, typeName, fieldName) {
	        var errorHint = typeName + "." + fieldName;
	        field.resolve = decorateWithLogger(field.resolve, logger, errorHint);
	    });
	}
	exports.addErrorLoggingToSchema = addErrorLoggingToSchema;
	// XXX badly named function. this doesn't really wrap, it just chains resolvers...
	function wrapResolver(innerResolver, outerResolver) {
	    return function (obj, args, ctx, info) {
	        return Promise.resolve(outerResolver(obj, args, ctx, info)).then(function (root) {
	            if (innerResolver) {
	                return innerResolver(root, args, ctx, info);
	            }
	            return graphql_1__default.defaultFieldResolver(root, args, ctx, info);
	        });
	    };
	}
	function chainResolvers(resolvers) {
	    return function (root, args, ctx, info) {
	        return resolvers.reduce(function (prev, curResolver) {
	            if (curResolver) {
	                return curResolver(prev, args, ctx, info);
	            }
	            return graphql_1__default.defaultFieldResolver(prev, args, ctx, info);
	        }, root);
	    };
	}
	exports.chainResolvers = chainResolvers;
	/*
	 * fn: The function to decorate with the logger
	 * logger: an object instance of type Logger
	 * hint: an optional hint to add to the error's message
	 */
	function decorateWithLogger(fn, logger, hint) {
	    if (typeof fn === 'undefined') {
	        fn = graphql_1__default.defaultFieldResolver;
	    }
	    var logError = function (e) {
	        // TODO: clone the error properly
	        var newE = new Error();
	        newE.stack = e.stack;
	        /* istanbul ignore else: always get the hint from addErrorLoggingToSchema */
	        if (hint) {
	            newE['originalMessage'] = e.message;
	            newE['message'] = "Error in resolver " + hint + "\n" + e.message;
	        }
	        logger.log(newE);
	    };
	    return function (root, args, ctx, info) {
	        try {
	            var result = fn(root, args, ctx, info);
	            // If the resolve function returns a Promise log any Promise rejects.
	            if (result &&
	                typeof result.then === 'function' &&
	                typeof result.catch === 'function') {
	                result.catch(function (reason) {
	                    // make sure that it's an error we're logging.
	                    var error$$1 = reason instanceof Error ? reason : new Error(reason);
	                    logError(error$$1);
	                    // We don't want to leave an unhandled exception so pass on error.
	                    return reason;
	                });
	            }
	            return result;
	        }
	        catch (e) {
	            logError(e);
	            // we want to pass on the error, just in case.
	            throw e;
	        }
	    };
	}
	function addCatchUndefinedToSchema(schema) {
	    forEachField(schema, function (field, typeName, fieldName) {
	        var errorHint = typeName + "." + fieldName;
	        field.resolve = decorateToCatchUndefined(field.resolve, errorHint);
	    });
	}
	exports.addCatchUndefinedToSchema = addCatchUndefinedToSchema;
	function decorateToCatchUndefined(fn, hint) {
	    if (typeof fn === 'undefined') {
	        fn = graphql_1__default.defaultFieldResolver;
	    }
	    return function (root, args, ctx, info) {
	        var result = fn(root, args, ctx, info);
	        if (typeof result === 'undefined') {
	            throw new Error("Resolve function for \"" + hint + "\" returned undefined");
	        }
	        return result;
	    };
	}
	// XXX this function only works for resolvers
	// XXX very hacky way to remember if the function
	// already ran for this request. This will only work
	// if people don't actually cache the operation.
	// if they do cache the operation, they will have to
	// manually remove the __runAtMostOnce before every request.
	function runAtMostOncePerRequest(fn) {
	    var value;
	    var randomNumber = Math.random();
	    return function (root, args, ctx, info) {
	        if (!info.operation['__runAtMostOnce']) {
	            info.operation['__runAtMostOnce'] = {};
	        }
	        if (!info.operation['__runAtMostOnce'][randomNumber]) {
	            info.operation['__runAtMostOnce'][randomNumber] = true;
	            value = fn(root, args, ctx, info);
	        }
	        return value;
	    };
	}
	function attachDirectiveResolvers(schema, directiveResolvers) {
	    if (typeof directiveResolvers !== 'object') {
	        throw new Error("Expected directiveResolvers to be of type object, got " + typeof directiveResolvers);
	    }
	    if (Array.isArray(directiveResolvers)) {
	        throw new Error('Expected directiveResolvers to be of type object, got Array');
	    }
	    var schemaDirectives = Object.create(null);
	    Object.keys(directiveResolvers).forEach(function (directiveName) {
	        schemaDirectives[directiveName] = /** @class */ (function (_super) {
	            __extends(class_1, _super);
	            function class_1() {
	                return _super !== null && _super.apply(this, arguments) || this;
	            }
	            class_1.prototype.visitFieldDefinition = function (field) {
	                var _this = this;
	                var resolver = directiveResolvers[directiveName];
	                var originalResolver = field.resolve || graphql_1__default.defaultFieldResolver;
	                var directiveArgs = this.args;
	                field.resolve = function () {
	                    var args = [];
	                    for (var _i = 0; _i < arguments.length; _i++) {
	                        args[_i] = arguments[_i];
	                    }
	                    var source = args[0], context = args[2], info = args[3];
	                    return resolver(function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
	                        return [2 /*return*/, originalResolver.apply(field, args)];
	                    }); }); }, source, directiveArgs, context, info);
	                };
	            };
	            return class_1;
	        }(schemaVisitor.SchemaDirectiveVisitor));
	    });
	    schemaVisitor.SchemaDirectiveVisitor.visitSchemaDirectives(schema, schemaDirectives);
	}
	exports.attachDirectiveResolvers = attachDirectiveResolvers;

	});

	unwrapExports(schemaGenerator);
	var schemaGenerator_1 = schemaGenerator.SchemaError;
	var schemaGenerator_2 = schemaGenerator.makeExecutableSchema;
	var schemaGenerator_3 = schemaGenerator.concatenateTypeDefs;
	var schemaGenerator_4 = schemaGenerator.buildSchemaFromTypeDefinitions;
	var schemaGenerator_5 = schemaGenerator.extractExtensionDefinitions;
	var schemaGenerator_6 = schemaGenerator.forEachField;
	var schemaGenerator_7 = schemaGenerator.attachConnectorsToContext;
	var schemaGenerator_8 = schemaGenerator.addSchemaLevelResolveFunction;
	var schemaGenerator_9 = schemaGenerator.addResolveFunctionsToSchema;
	var schemaGenerator_10 = schemaGenerator.assertResolveFunctionsPresent;
	var schemaGenerator_11 = schemaGenerator.addErrorLoggingToSchema;
	var schemaGenerator_12 = schemaGenerator.chainResolvers;
	var schemaGenerator_13 = schemaGenerator.addCatchUndefinedToSchema;
	var schemaGenerator_14 = schemaGenerator.attachDirectiveResolvers;

	var empty = {};

	var empty$1 = /*#__PURE__*/Object.freeze({
		default: empty
	});

	var crypto = ( empty$1 && empty ) || empty$1;

	// Unique ID creation requires a high quality random # generator.  In node.js
	// this is pretty straight-forward - we use the crypto API.



	var rng = function nodeRNG() {
	  return crypto.randomBytes(16);
	};

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex[i] = (i + 0x100).toString(16).substr(1);
	}

	function bytesToUuid(buf, offset) {
	  var i = offset || 0;
	  var bth = byteToHex;
	  return bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]];
	}

	var bytesToUuid_1 = bytesToUuid;

	// **`v1()` - Generate time-based UUID**
	//
	// Inspired by https://github.com/LiosK/UUID.js
	// and http://docs.python.org/library/uuid.html

	var _nodeId;
	var _clockseq;

	// Previous uuid creation time
	var _lastMSecs = 0;
	var _lastNSecs = 0;

	// See https://github.com/broofa/node-uuid for API details
	function v1(options, buf, offset) {
	  var i = buf && offset || 0;
	  var b = buf || [];

	  options = options || {};
	  var node = options.node || _nodeId;
	  var clockseq = options.clockseq !== undefined ? options.clockseq : _clockseq;

	  // node and clockseq need to be initialized to random values if they're not
	  // specified.  We do this lazily to minimize issues related to insufficient
	  // system entropy.  See #189
	  if (node == null || clockseq == null) {
	    var seedBytes = rng();
	    if (node == null) {
	      // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
	      node = _nodeId = [
	        seedBytes[0] | 0x01,
	        seedBytes[1], seedBytes[2], seedBytes[3], seedBytes[4], seedBytes[5]
	      ];
	    }
	    if (clockseq == null) {
	      // Per 4.2.2, randomize (14 bit) clockseq
	      clockseq = _clockseq = (seedBytes[6] << 8 | seedBytes[7]) & 0x3fff;
	    }
	  }

	  // UUID timestamps are 100 nano-second units since the Gregorian epoch,
	  // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
	  // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
	  // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
	  var msecs = options.msecs !== undefined ? options.msecs : new Date().getTime();

	  // Per 4.2.1.2, use count of uuid's generated during the current clock
	  // cycle to simulate higher resolution clock
	  var nsecs = options.nsecs !== undefined ? options.nsecs : _lastNSecs + 1;

	  // Time since last uuid creation (in msecs)
	  var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

	  // Per 4.2.1.2, Bump clockseq on clock regression
	  if (dt < 0 && options.clockseq === undefined) {
	    clockseq = clockseq + 1 & 0x3fff;
	  }

	  // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
	  // time interval
	  if ((dt < 0 || msecs > _lastMSecs) && options.nsecs === undefined) {
	    nsecs = 0;
	  }

	  // Per 4.2.1.2 Throw error if too many uuids are requested
	  if (nsecs >= 10000) {
	    throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
	  }

	  _lastMSecs = msecs;
	  _lastNSecs = nsecs;
	  _clockseq = clockseq;

	  // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
	  msecs += 12219292800000;

	  // `time_low`
	  var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
	  b[i++] = tl >>> 24 & 0xff;
	  b[i++] = tl >>> 16 & 0xff;
	  b[i++] = tl >>> 8 & 0xff;
	  b[i++] = tl & 0xff;

	  // `time_mid`
	  var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
	  b[i++] = tmh >>> 8 & 0xff;
	  b[i++] = tmh & 0xff;

	  // `time_high_and_version`
	  b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
	  b[i++] = tmh >>> 16 & 0xff;

	  // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
	  b[i++] = clockseq >>> 8 | 0x80;

	  // `clock_seq_low`
	  b[i++] = clockseq & 0xff;

	  // `node`
	  for (var n = 0; n < 6; ++n) {
	    b[i + n] = node[n];
	  }

	  return buf ? buf : bytesToUuid_1(b);
	}

	var v1_1 = v1;

	function v4(options, buf, offset) {
	  var i = buf && offset || 0;

	  if (typeof(options) == 'string') {
	    buf = options === 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};

	  var rnds = options.random || (options.rng || rng)();

	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = (rnds[6] & 0x0f) | 0x40;
	  rnds[8] = (rnds[8] & 0x3f) | 0x80;

	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ++ii) {
	      buf[i + ii] = rnds[ii];
	    }
	  }

	  return buf || bytesToUuid_1(rnds);
	}

	var v4_1 = v4;

	var uuid = v4_1;
	uuid.v1 = v1_1;
	uuid.v4 = v4_1;

	var uuid_1 = uuid;

	var mock = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	var graphql_2 = graphql_1__default;


	// This function wraps addMockFunctionsToSchema for more convenience
	function mockServer(schema, mocks, preserveResolvers) {
	    if (preserveResolvers === void 0) { preserveResolvers = false; }
	    var mySchema;
	    if (!(schema instanceof graphql_1__default.GraphQLSchema)) {
	        // TODO: provide useful error messages here if this fails
	        mySchema = schemaGenerator.buildSchemaFromTypeDefinitions(schema);
	    }
	    else {
	        mySchema = schema;
	    }
	    addMockFunctionsToSchema({ schema: mySchema, mocks: mocks, preserveResolvers: preserveResolvers });
	    return { query: function (query, vars) { return graphql_2.graphql(mySchema, query, {}, {}, vars); } };
	}
	exports.mockServer = mockServer;
	// TODO allow providing a seed such that lengths of list could be deterministic
	// this could be done by using casual to get a random list length if the casual
	// object is global.
	function addMockFunctionsToSchema(_a) {
	    var schema = _a.schema, _b = _a.mocks, mocks = _b === void 0 ? {} : _b, _c = _a.preserveResolvers, preserveResolvers = _c === void 0 ? false : _c;
	    function isObject(thing) {
	        return thing === Object(thing) && !Array.isArray(thing);
	    }
	    if (!schema) {
	        throw new Error('Must provide schema to mock');
	    }
	    if (!(schema instanceof graphql_1__default.GraphQLSchema)) {
	        throw new Error('Value at "schema" must be of type GraphQLSchema');
	    }
	    if (!isObject(mocks)) {
	        throw new Error('mocks must be of type Object');
	    }
	    // use Map internally, because that API is nicer.
	    var mockFunctionMap = new Map();
	    Object.keys(mocks).forEach(function (typeName) {
	        mockFunctionMap.set(typeName, mocks[typeName]);
	    });
	    mockFunctionMap.forEach(function (mockFunction, mockTypeName) {
	        if (typeof mockFunction !== 'function') {
	            throw new Error("mockFunctionMap[" + mockTypeName + "] must be a function");
	        }
	    });
	    var defaultMockMap = new Map();
	    defaultMockMap.set('Int', function () { return Math.round(Math.random() * 200) - 100; });
	    defaultMockMap.set('Float', function () { return Math.random() * 200 - 100; });
	    defaultMockMap.set('String', function () { return 'Hello World'; });
	    defaultMockMap.set('Boolean', function () { return Math.random() > 0.5; });
	    defaultMockMap.set('ID', function () { return uuid_1.v4(); });
	    function mergeObjects(a, b) {
	        return Object.assign(a, b);
	    }
	    function copyOwnPropsIfNotPresent(target, source) {
	        Object.getOwnPropertyNames(source).forEach(function (prop) {
	            if (!Object.getOwnPropertyDescriptor(target, prop)) {
	                Object.defineProperty(target, prop, Object.getOwnPropertyDescriptor(source, prop));
	            }
	        });
	    }
	    function copyOwnProps(target) {
	        var sources = [];
	        for (var _i = 1; _i < arguments.length; _i++) {
	            sources[_i - 1] = arguments[_i];
	        }
	        sources.forEach(function (source) {
	            var chain = source;
	            while (chain) {
	                copyOwnPropsIfNotPresent(target, chain);
	                chain = Object.getPrototypeOf(chain);
	            }
	        });
	        return target;
	    }
	    // returns a random element from that ary
	    function getRandomElement(ary) {
	        var sample = Math.floor(Math.random() * ary.length);
	        return ary[sample];
	    }
	    // takes either an object or a (possibly nested) array
	    // and completes the customMock object with any fields
	    // defined on genericMock
	    // only merges objects or arrays. Scalars are returned as is
	    function mergeMocks(genericMockFunction, customMock) {
	        if (Array.isArray(customMock)) {
	            return customMock.map(function (el) { return mergeMocks(genericMockFunction, el); });
	        }
	        if (isObject(customMock)) {
	            return mergeObjects(genericMockFunction(), customMock);
	        }
	        return customMock;
	    }
	    function getResolveType(namedFieldType) {
	        if (namedFieldType instanceof graphql_1__default.GraphQLInterfaceType ||
	            namedFieldType instanceof graphql_1__default.GraphQLUnionType) {
	            return namedFieldType.resolveType;
	        }
	        else {
	            return undefined;
	        }
	    }
	    function assignResolveType(type) {
	        var fieldType = graphql_1__default.getNullableType(type);
	        var namedFieldType = graphql_1__default.getNamedType(fieldType);
	        var oldResolveType = getResolveType(namedFieldType);
	        if (preserveResolvers && oldResolveType && oldResolveType.length) {
	            return;
	        }
	        if (namedFieldType instanceof graphql_1__default.GraphQLUnionType ||
	            namedFieldType instanceof graphql_1__default.GraphQLInterfaceType) {
	            // the default `resolveType` always returns null. We add a fallback
	            // resolution that works with how unions and interface are mocked
	            namedFieldType.resolveType = function (data, context, info) {
	                return info.schema.getType(data.__typename);
	            };
	        }
	    }
	    var mockType = function (type, typeName, fieldName) {
	        // order of precendence for mocking:
	        // 1. if the object passed in already has fieldName, just use that
	        // --> if it's a function, that becomes your resolver
	        // --> if it's a value, the mock resolver will return that
	        // 2. if the nullableType is a list, recurse
	        // 2. if there's a mock defined for this typeName, that will be used
	        // 3. if there's no mock defined, use the default mocks for this type
	        return function (root, args, context, info) {
	            // nullability doesn't matter for the purpose of mocking.
	            var fieldType = graphql_1__default.getNullableType(type);
	            var namedFieldType = graphql_1__default.getNamedType(fieldType);
	            if (root && typeof root[fieldName] !== 'undefined') {
	                var result = void 0;
	                // if we're here, the field is already defined
	                if (typeof root[fieldName] === 'function') {
	                    result = root[fieldName](root, args, context, info);
	                    if (result instanceof MockList) {
	                        result = result.mock(root, args, context, info, fieldType, mockType);
	                    }
	                }
	                else {
	                    result = root[fieldName];
	                }
	                // Now we merge the result with the default mock for this type.
	                // This allows overriding defaults while writing very little code.
	                if (mockFunctionMap.has(namedFieldType.name)) {
	                    result = mergeMocks(mockFunctionMap
	                        .get(namedFieldType.name)
	                        .bind(null, root, args, context, info), result);
	                }
	                return result;
	            }
	            if (fieldType instanceof graphql_1__default.GraphQLList) {
	                return [
	                    mockType(fieldType.ofType)(root, args, context, info),
	                    mockType(fieldType.ofType)(root, args, context, info),
	                ];
	            }
	            if (mockFunctionMap.has(fieldType.name) &&
	                !(fieldType instanceof graphql_1__default.GraphQLUnionType ||
	                    fieldType instanceof graphql_1__default.GraphQLInterfaceType)) {
	                // the object passed doesn't have this field, so we apply the default mock
	                return mockFunctionMap.get(fieldType.name)(root, args, context, info);
	            }
	            if (fieldType instanceof graphql_1__default.GraphQLObjectType) {
	                // objects don't return actual data, we only need to mock scalars!
	                return {};
	            }
	            // if a mock function is provided for unionType or interfaceType, execute it to resolve the concrete type
	            // otherwise randomly pick a type from all implementation types
	            if (fieldType instanceof graphql_1__default.GraphQLUnionType ||
	                fieldType instanceof graphql_1__default.GraphQLInterfaceType) {
	                var implementationType = void 0;
	                if (mockFunctionMap.has(fieldType.name)) {
	                    var interfaceMockObj = mockFunctionMap.get(fieldType.name)(root, args, context, info);
	                    if (!interfaceMockObj || !interfaceMockObj.__typename) {
	                        return Error("Please return a __typename in \"" + fieldType.name + "\"");
	                    }
	                    implementationType = schema.getType(interfaceMockObj.__typename);
	                }
	                else {
	                    var possibleTypes = schema.getPossibleTypes(fieldType);
	                    implementationType = getRandomElement(possibleTypes);
	                }
	                return Object.assign({ __typename: implementationType }, mockType(implementationType)(root, args, context, info));
	            }
	            if (fieldType instanceof graphql_1__default.GraphQLEnumType) {
	                return getRandomElement(fieldType.getValues()).value;
	            }
	            if (defaultMockMap.has(fieldType.name)) {
	                return defaultMockMap.get(fieldType.name)(root, args, context, info);
	            }
	            // if we get to here, we don't have a value, and we don't have a mock for this type,
	            // we could return undefined, but that would be hard to debug, so we throw instead.
	            // however, we returning it instead of throwing it, so preserveResolvers can handle the failures.
	            return Error("No mock defined for type \"" + fieldType.name + "\"");
	        };
	    };
	    schemaGenerator.forEachField(schema, function (field, typeName, fieldName) {
	        assignResolveType(field.type);
	        var mockResolver;
	        // we have to handle the root mutation and root query types differently,
	        // because no resolver is called at the root.
	        /* istanbul ignore next: Must provide schema DefinitionNode with query type or a type named Query. */
	        var isOnQueryType = schema.getQueryType()
	            ? schema.getQueryType().name === typeName
	            : false;
	        var isOnMutationType = schema.getMutationType()
	            ? schema.getMutationType().name === typeName
	            : false;
	        if (isOnQueryType || isOnMutationType) {
	            if (mockFunctionMap.has(typeName)) {
	                var rootMock_1 = mockFunctionMap.get(typeName);
	                // XXX: BUG in here, need to provide proper signature for rootMock.
	                if (rootMock_1(undefined, {}, {}, {})[fieldName]) {
	                    // TODO: assert that it's a function
	                    mockResolver = function (root, args, context, info) {
	                        var updatedRoot = root || {}; // TODO: should we clone instead?
	                        updatedRoot[fieldName] = rootMock_1(root, args, context, info)[fieldName];
	                        // XXX this is a bit of a hack to still use mockType, which
	                        // lets you mock lists etc. as well
	                        // otherwise we could just set field.resolve to rootMock()[fieldName]
	                        // it's like pretending there was a resolve function that ran before
	                        // the root resolve function.
	                        return mockType(field.type, typeName, fieldName)(updatedRoot, args, context, info);
	                    };
	                }
	            }
	        }
	        if (!mockResolver) {
	            mockResolver = mockType(field.type, typeName, fieldName);
	        }
	        if (!preserveResolvers || !field.resolve) {
	            field.resolve = mockResolver;
	        }
	        else {
	            var oldResolver_1 = field.resolve;
	            field.resolve = function (rootObject, args, context, info) {
	                return Promise.all([
	                    mockResolver(rootObject, args, context, info),
	                    oldResolver_1(rootObject, args, context, info),
	                ]).then(function (values$$1) {
	                    var mockedValue = values$$1[0], resolvedValue = values$$1[1];
	                    // In case we couldn't mock
	                    if (mockedValue instanceof Error) {
	                        // only if value was not resolved, populate the error.
	                        if (undefined === resolvedValue) {
	                            throw mockedValue;
	                        }
	                        return resolvedValue;
	                    }
	                    if (resolvedValue instanceof Date && mockedValue instanceof Date) {
	                        return undefined !== resolvedValue ? resolvedValue : mockedValue;
	                    }
	                    if (isObject(mockedValue) && isObject(resolvedValue)) {
	                        // Object.assign() won't do here, as we need to all properties, including
	                        // the non-enumerable ones and defined using Object.defineProperty
	                        var emptyObject = Object.create(Object.getPrototypeOf(resolvedValue));
	                        return copyOwnProps(emptyObject, resolvedValue, mockedValue);
	                    }
	                    return undefined !== resolvedValue ? resolvedValue : mockedValue;
	                });
	            };
	        }
	    });
	}
	exports.addMockFunctionsToSchema = addMockFunctionsToSchema;
	var MockList = /** @class */ (function () {
	    // wrappedFunction can return another MockList or a value
	    function MockList(len, wrappedFunction) {
	        this.len = len;
	        if (typeof wrappedFunction !== 'undefined') {
	            if (typeof wrappedFunction !== 'function') {
	                throw new Error('Second argument to MockList must be a function or undefined');
	            }
	            this.wrappedFunction = wrappedFunction;
	        }
	    }
	    MockList.prototype.mock = function (root, args, context, info, fieldType, mockTypeFunc) {
	        var arr;
	        if (Array.isArray(this.len)) {
	            arr = new Array(this.randint(this.len[0], this.len[1]));
	        }
	        else {
	            arr = new Array(this.len);
	        }
	        for (var i = 0; i < arr.length; i++) {
	            if (typeof this.wrappedFunction === 'function') {
	                var res = this.wrappedFunction(root, args, context, info);
	                if (res instanceof MockList) {
	                    var nullableType = graphql_1__default.getNullableType(fieldType.ofType);
	                    arr[i] = res.mock(root, args, context, info, nullableType, mockTypeFunc);
	                }
	                else {
	                    arr[i] = res;
	                }
	            }
	            else {
	                arr[i] = mockTypeFunc(fieldType.ofType)(root, args, context, info);
	            }
	        }
	        return arr;
	    };
	    MockList.prototype.randint = function (low, high) {
	        return Math.floor(Math.random() * (high - low + 1) + low);
	    };
	    return MockList;
	}());
	exports.MockList = MockList;

	});

	unwrapExports(mock);
	var mock_1 = mock.mockServer;
	var mock_2 = mock.addMockFunctionsToSchema;
	var mock_3 = mock.MockList;

	var Observable_1 = createCommonjsModule(function (module, exports) {

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	// === Symbol Support ===

	var hasSymbols = function () {
	  return typeof Symbol === 'function';
	};
	var hasSymbol = function (name) {
	  return hasSymbols() && Boolean(Symbol[name]);
	};
	var getSymbol = function (name) {
	  return hasSymbol(name) ? Symbol[name] : '@@' + name;
	};

	if (hasSymbols() && !hasSymbol('observable')) {
	  Symbol.observable = Symbol('observable');
	}

	// === Abstract Operations ===

	function getMethod(obj, key) {
	  var value = obj[key];

	  if (value == null) return undefined;

	  if (typeof value !== 'function') throw new TypeError(value + ' is not a function');

	  return value;
	}

	function getSpecies(obj) {
	  var ctor = obj.constructor;
	  if (ctor !== undefined) {
	    ctor = ctor[getSymbol('species')];
	    if (ctor === null) {
	      ctor = undefined;
	    }
	  }
	  return ctor !== undefined ? ctor : Observable;
	}

	function isObservable(x) {
	  return x instanceof Observable; // SPEC: Brand check
	}

	function hostReportError(e) {
	  if (hostReportError.log) {
	    hostReportError.log(e);
	  } else {
	    setTimeout(function () {
	      throw e;
	    });
	  }
	}

	function enqueue(fn) {
	  Promise.resolve().then(function () {
	    try {
	      fn();
	    } catch (e) {
	      hostReportError(e);
	    }
	  });
	}

	function cleanupSubscription(subscription) {
	  var cleanup = subscription._cleanup;
	  if (cleanup === undefined) return;

	  subscription._cleanup = undefined;

	  if (!cleanup) {
	    return;
	  }

	  try {
	    if (typeof cleanup === 'function') {
	      cleanup();
	    } else {
	      var unsubscribe = getMethod(cleanup, 'unsubscribe');
	      if (unsubscribe) {
	        unsubscribe.call(cleanup);
	      }
	    }
	  } catch (e) {
	    hostReportError(e);
	  }
	}

	function closeSubscription(subscription) {
	  subscription._observer = undefined;
	  subscription._queue = undefined;
	  subscription._state = 'closed';
	}

	function flushSubscription(subscription) {
	  var queue = subscription._queue;
	  if (!queue) {
	    return;
	  }
	  subscription._queue = undefined;
	  subscription._state = 'ready';
	  for (var i = 0; i < queue.length; ++i) {
	    notifySubscription(subscription, queue[i].type, queue[i].value);
	    if (subscription._state === 'closed') break;
	  }
	}

	function notifySubscription(subscription, type, value) {
	  subscription._state = 'running';

	  var observer = subscription._observer;

	  try {
	    var m = getMethod(observer, type);
	    switch (type) {
	      case 'next':
	        if (m) m.call(observer, value);
	        break;
	      case 'error':
	        closeSubscription(subscription);
	        if (m) m.call(observer, value);else throw value;
	        break;
	      case 'complete':
	        closeSubscription(subscription);
	        if (m) m.call(observer);
	        break;
	    }
	  } catch (e) {
	    hostReportError(e);
	  }

	  if (subscription._state === 'closed') cleanupSubscription(subscription);else if (subscription._state === 'running') subscription._state = 'ready';
	}

	function onNotify(subscription, type, value) {
	  if (subscription._state === 'closed') return;

	  if (subscription._state === 'buffering') {
	    subscription._queue.push({ type: type, value: value });
	    return;
	  }

	  if (subscription._state !== 'ready') {
	    subscription._state = 'buffering';
	    subscription._queue = [{ type: type, value: value }];
	    enqueue(function () {
	      return flushSubscription(subscription);
	    });
	    return;
	  }

	  notifySubscription(subscription, type, value);
	}

	var Subscription = function () {
	  function Subscription(observer, subscriber) {
	    _classCallCheck(this, Subscription);

	    // ASSERT: observer is an object
	    // ASSERT: subscriber is callable

	    this._cleanup = undefined;
	    this._observer = observer;
	    this._queue = undefined;
	    this._state = 'initializing';

	    var subscriptionObserver = new SubscriptionObserver(this);

	    try {
	      this._cleanup = subscriber.call(undefined, subscriptionObserver);
	    } catch (e) {
	      subscriptionObserver.error(e);
	    }

	    if (this._state === 'initializing') this._state = 'ready';
	  }

	  _createClass(Subscription, [{
	    key: 'unsubscribe',
	    value: function unsubscribe() {
	      if (this._state !== 'closed') {
	        closeSubscription(this);
	        cleanupSubscription(this);
	      }
	    }
	  }, {
	    key: 'closed',
	    get: function () {
	      return this._state === 'closed';
	    }
	  }]);

	  return Subscription;
	}();

	var SubscriptionObserver = function () {
	  function SubscriptionObserver(subscription) {
	    _classCallCheck(this, SubscriptionObserver);

	    this._subscription = subscription;
	  }

	  _createClass(SubscriptionObserver, [{
	    key: 'next',
	    value: function next(value) {
	      onNotify(this._subscription, 'next', value);
	    }
	  }, {
	    key: 'error',
	    value: function error$$1(value) {
	      onNotify(this._subscription, 'error', value);
	    }
	  }, {
	    key: 'complete',
	    value: function complete() {
	      onNotify(this._subscription, 'complete');
	    }
	  }, {
	    key: 'closed',
	    get: function () {
	      return this._subscription._state === 'closed';
	    }
	  }]);

	  return SubscriptionObserver;
	}();

	var Observable = exports.Observable = function () {
	  function Observable(subscriber) {
	    _classCallCheck(this, Observable);

	    if (!(this instanceof Observable)) throw new TypeError('Observable cannot be called as a function');

	    if (typeof subscriber !== 'function') throw new TypeError('Observable initializer must be a function');

	    this._subscriber = subscriber;
	  }

	  _createClass(Observable, [{
	    key: 'subscribe',
	    value: function subscribe(observer) {
	      if (typeof observer !== 'object' || observer === null) {
	        observer = {
	          next: observer,
	          error: arguments[1],
	          complete: arguments[2]
	        };
	      }
	      return new Subscription(observer, this._subscriber);
	    }
	  }, {
	    key: 'forEach',
	    value: function forEach(fn) {
	      var _this = this;

	      return new Promise(function (resolve, reject) {
	        if (typeof fn !== 'function') {
	          reject(new TypeError(fn + ' is not a function'));
	          return;
	        }

	        function done() {
	          subscription.unsubscribe();
	          resolve();
	        }

	        var subscription = _this.subscribe({
	          next: function (value) {
	            try {
	              fn(value, done);
	            } catch (e) {
	              reject(e);
	              subscription.unsubscribe();
	            }
	          },

	          error: reject,
	          complete: resolve
	        });
	      });
	    }
	  }, {
	    key: 'map',
	    value: function map(fn) {
	      var _this2 = this;

	      if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

	      var C = getSpecies(this);

	      return new C(function (observer) {
	        return _this2.subscribe({
	          next: function (value) {
	            try {
	              value = fn(value);
	            } catch (e) {
	              return observer.error(e);
	            }
	            observer.next(value);
	          },
	          error: function (e) {
	            observer.error(e);
	          },
	          complete: function () {
	            observer.complete();
	          }
	        });
	      });
	    }
	  }, {
	    key: 'filter',
	    value: function filter(fn) {
	      var _this3 = this;

	      if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

	      var C = getSpecies(this);

	      return new C(function (observer) {
	        return _this3.subscribe({
	          next: function (value) {
	            try {
	              if (!fn(value)) return;
	            } catch (e) {
	              return observer.error(e);
	            }
	            observer.next(value);
	          },
	          error: function (e) {
	            observer.error(e);
	          },
	          complete: function () {
	            observer.complete();
	          }
	        });
	      });
	    }
	  }, {
	    key: 'reduce',
	    value: function reduce(fn) {
	      var _this4 = this;

	      if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

	      var C = getSpecies(this);
	      var hasSeed = arguments.length > 1;
	      var hasValue = false;
	      var seed = arguments[1];
	      var acc = seed;

	      return new C(function (observer) {
	        return _this4.subscribe({
	          next: function (value) {
	            var first = !hasValue;
	            hasValue = true;

	            if (!first || hasSeed) {
	              try {
	                acc = fn(acc, value);
	              } catch (e) {
	                return observer.error(e);
	              }
	            } else {
	              acc = value;
	            }
	          },
	          error: function (e) {
	            observer.error(e);
	          },
	          complete: function () {
	            if (!hasValue && !hasSeed) return observer.error(new TypeError('Cannot reduce an empty sequence'));

	            observer.next(acc);
	            observer.complete();
	          }
	        });
	      });
	    }
	  }, {
	    key: 'concat',
	    value: function concat() {
	      var _this5 = this;

	      for (var _len = arguments.length, sources = Array(_len), _key = 0; _key < _len; _key++) {
	        sources[_key] = arguments[_key];
	      }

	      var C = getSpecies(this);

	      return new C(function (observer) {
	        var subscription = void 0;

	        function startNext(next) {
	          subscription = next.subscribe({
	            next: function (v) {
	              observer.next(v);
	            },
	            error: function (e) {
	              observer.error(e);
	            },
	            complete: function () {
	              if (sources.length === 0) {
	                subscription = undefined;
	                observer.complete();
	              } else {
	                startNext(C.from(sources.shift()));
	              }
	            }
	          });
	        }

	        startNext(_this5);

	        return function () {
	          if (subscription) {
	            subscription = undefined;
	            subscription.unsubscribe();
	          }
	        };
	      });
	    }
	  }, {
	    key: 'flatMap',
	    value: function flatMap(fn) {
	      var _this6 = this;

	      if (typeof fn !== 'function') throw new TypeError(fn + ' is not a function');

	      var C = getSpecies(this);

	      return new C(function (observer) {
	        var subscriptions = [];

	        var outer = _this6.subscribe({
	          next: function (value) {
	            if (fn) {
	              try {
	                value = fn(value);
	              } catch (e) {
	                return observer.error(e);
	              }
	            }

	            var inner = C.from(value).subscribe({
	              next: function (value) {
	                observer.next(value);
	              },
	              error: function (e) {
	                observer.error(e);
	              },
	              complete: function () {
	                var i = subscriptions.indexOf(inner);
	                if (i >= 0) subscriptions.splice(i, 1);
	                completeIfDone();
	              }
	            });

	            subscriptions.push(inner);
	          },
	          error: function (e) {
	            observer.error(e);
	          },
	          complete: function () {
	            completeIfDone();
	          }
	        });

	        function completeIfDone() {
	          if (outer.closed && subscriptions.length === 0) observer.complete();
	        }

	        return function () {
	          subscriptions.forEach(function (s) {
	            return s.unsubscribe();
	          });
	          outer.unsubscribe();
	        };
	      });
	    }
	  }, {
	    key: getSymbol('observable'),
	    value: function () {
	      return this;
	    }
	  }], [{
	    key: 'from',
	    value: function from(x) {
	      var C = typeof this === 'function' ? this : Observable;

	      if (x == null) throw new TypeError(x + ' is not an object');

	      var method = getMethod(x, getSymbol('observable'));
	      if (method) {
	        var observable = method.call(x);

	        if (Object(observable) !== observable) throw new TypeError(observable + ' is not an object');

	        if (isObservable(observable) && observable.constructor === C) return observable;

	        return new C(function (observer) {
	          return observable.subscribe(observer);
	        });
	      }

	      if (hasSymbol('iterator')) {
	        method = getMethod(x, getSymbol('iterator'));
	        if (method) {
	          return new C(function (observer) {
	            enqueue(function () {
	              if (observer.closed) return;
	              var _iteratorNormalCompletion = true;
	              var _didIteratorError = false;
	              var _iteratorError = undefined;

	              try {
	                for (var _iterator = method.call(x)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	                  var item = _step.value;

	                  observer.next(item);
	                  if (observer.closed) return;
	                }
	              } catch (err) {
	                _didIteratorError = true;
	                _iteratorError = err;
	              } finally {
	                try {
	                  if (!_iteratorNormalCompletion && _iterator.return) {
	                    _iterator.return();
	                  }
	                } finally {
	                  if (_didIteratorError) {
	                    throw _iteratorError;
	                  }
	                }
	              }

	              observer.complete();
	            });
	          });
	        }
	      }

	      if (Array.isArray(x)) {
	        return new C(function (observer) {
	          enqueue(function () {
	            if (observer.closed) return;
	            for (var i = 0; i < x.length; ++i) {
	              observer.next(x[i]);
	              if (observer.closed) return;
	            }
	            observer.complete();
	          });
	        });
	      }

	      throw new TypeError(x + ' is not observable');
	    }
	  }, {
	    key: 'of',
	    value: function of() {
	      for (var _len2 = arguments.length, items = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
	        items[_key2] = arguments[_key2];
	      }

	      var C = typeof this === 'function' ? this : Observable;

	      return new C(function (observer) {
	        enqueue(function () {
	          if (observer.closed) return;
	          for (var i = 0; i < items.length; ++i) {
	            observer.next(items[i]);
	            if (observer.closed) return;
	          }
	          observer.complete();
	        });
	      });
	    }
	  }, {
	    key: getSymbol('species'),
	    get: function () {
	      return this;
	    }
	  }]);

	  return Observable;
	}();

	if (hasSymbols()) {
	  Object.defineProperty(Observable, Symbol('extensions'), {
	    value: {
	      symbol: getSymbol('observable'),
	      hostReportError: hostReportError
	    },
	    configurabe: true
	  });
	}
	});

	unwrapExports(Observable_1);
	var Observable_2 = Observable_1.Observable;

	var zenObservable = Observable_1.Observable;

	var Observable$1 = zenObservable;

	var __assign = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};

	var __assign$1 = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};

	function getOperationName(doc) {
	    return (doc.definitions
	        .filter(function (definition) {
	        return definition.kind === 'OperationDefinition' && definition.name;
	    })
	        .map(function (x) { return x.name.value; })[0] || null);
	}

	/**
	 * Deeply clones a value to create a new instance.
	 */

	/**
	 * Performs a deep equality check on two JavaScript values.
	 */

	var __extends = (undefined && undefined.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign$2 = (undefined && undefined.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	function validateOperation(operation) {
	    var OPERATION_FIELDS = [
	        'query',
	        'operationName',
	        'variables',
	        'extensions',
	        'context',
	    ];
	    for (var _i = 0, _a = Object.keys(operation); _i < _a.length; _i++) {
	        var key = _a[_i];
	        if (OPERATION_FIELDS.indexOf(key) < 0) {
	            throw new Error("illegal argument: " + key);
	        }
	    }
	    return operation;
	}
	var LinkError = /** @class */ (function (_super) {
	    __extends(LinkError, _super);
	    function LinkError(message, link) {
	        var _this = _super.call(this, message) || this;
	        _this.link = link;
	        return _this;
	    }
	    return LinkError;
	}(Error));
	function isTerminating(link) {
	    return link.request.length <= 1;
	}
	function toPromise(observable) {
	    var completed = false;
	    return new Promise(function (resolve, reject) {
	        observable.subscribe({
	            next: function (data) {
	                if (completed) {
	                    console.warn("Promise Wrapper does not support multiple results from Observable");
	                }
	                else {
	                    completed = true;
	                    resolve(data);
	                }
	            },
	            error: reject,
	        });
	    });
	}
	// backwards compat
	var makePromise = toPromise;
	function fromPromise(promise) {
	    return new Observable$1(function (observer) {
	        promise
	            .then(function (value) {
	            observer.next(value);
	            observer.complete();
	        })
	            .catch(observer.error.bind(observer));
	    });
	}
	function fromError(errorValue) {
	    return new Observable$1(function (observer) {
	        observer.error(errorValue);
	    });
	}
	function transformOperation(operation) {
	    var transformedOperation = {
	        variables: operation.variables || {},
	        extensions: operation.extensions || {},
	        operationName: operation.operationName,
	        query: operation.query,
	    };
	    // best guess at an operation name
	    if (!transformedOperation.operationName) {
	        transformedOperation.operationName =
	            typeof transformedOperation.query !== 'string'
	                ? getOperationName(transformedOperation.query)
	                : '';
	    }
	    return transformedOperation;
	}
	function createOperation(starting, operation) {
	    var context = __assign$2({}, starting);
	    var setContext = function (next) {
	        if (typeof next === 'function') {
	            context = __assign$2({}, context, next(context));
	        }
	        else {
	            context = __assign$2({}, context, next);
	        }
	    };
	    var getContext = function () { return (__assign$2({}, context)); };
	    Object.defineProperty(operation, 'setContext', {
	        enumerable: false,
	        value: setContext,
	    });
	    Object.defineProperty(operation, 'getContext', {
	        enumerable: false,
	        value: getContext,
	    });
	    Object.defineProperty(operation, 'toKey', {
	        enumerable: false,
	        value: function () { return getKey(operation); },
	    });
	    return operation;
	}
	function getKey(operation) {
	    // XXX we're assuming here that variables will be serialized in the same order.
	    // that might not always be true
	    return printer.print(operation.query) + "|" + JSON.stringify(operation.variables) + "|" + operation.operationName;
	}

	var passthrough = function (op, forward) { return (forward ? forward(op) : Observable$1.of()); };
	var toLink = function (handler) {
	    return typeof handler === 'function' ? new ApolloLink(handler) : handler;
	};
	var empty$2 = function () {
	    return new ApolloLink(function (op, forward) { return Observable$1.of(); });
	};
	var from = function (links) {
	    if (links.length === 0)
	        return empty$2();
	    return links.map(toLink).reduce(function (x, y) { return x.concat(y); });
	};
	var split = function (test, left, right) {
	    if (right === void 0) { right = new ApolloLink(passthrough); }
	    var leftLink = toLink(left);
	    var rightLink = toLink(right);
	    if (isTerminating(leftLink) && isTerminating(rightLink)) {
	        return new ApolloLink(function (operation) {
	            return test(operation)
	                ? leftLink.request(operation) || Observable$1.of()
	                : rightLink.request(operation) || Observable$1.of();
	        });
	    }
	    else {
	        return new ApolloLink(function (operation, forward) {
	            return test(operation)
	                ? leftLink.request(operation, forward) || Observable$1.of()
	                : rightLink.request(operation, forward) || Observable$1.of();
	        });
	    }
	};
	// join two Links together
	var concat = function (first, second) {
	    var firstLink = toLink(first);
	    if (isTerminating(firstLink)) {
	        console.warn(new LinkError("You are calling concat on a terminating link, which will have no effect", firstLink));
	        return firstLink;
	    }
	    var nextLink = toLink(second);
	    if (isTerminating(nextLink)) {
	        return new ApolloLink(function (operation) {
	            return firstLink.request(operation, function (op) { return nextLink.request(op) || Observable$1.of(); }) || Observable$1.of();
	        });
	    }
	    else {
	        return new ApolloLink(function (operation, forward) {
	            return (firstLink.request(operation, function (op) {
	                return nextLink.request(op, forward) || Observable$1.of();
	            }) || Observable$1.of());
	        });
	    }
	};
	var ApolloLink = /** @class */ (function () {
	    function ApolloLink(request) {
	        if (request)
	            this.request = request;
	    }
	    ApolloLink.prototype.split = function (test, left, right) {
	        if (right === void 0) { right = new ApolloLink(passthrough); }
	        return this.concat(split(test, left, right));
	    };
	    ApolloLink.prototype.concat = function (next) {
	        return concat(this, next);
	    };
	    ApolloLink.prototype.request = function (operation, forward) {
	        throw new Error('request is not implemented');
	    };
	    ApolloLink.empty = empty$2;
	    ApolloLink.from = from;
	    ApolloLink.split = split;
	    ApolloLink.execute = execute;
	    return ApolloLink;
	}());
	function execute(link, operation) {
	    return (link.request(createOperation(operation.context, transformOperation(validateOperation(operation)))) || Observable$1.of());
	}



	var lib = /*#__PURE__*/Object.freeze({
		Observable: Observable$1,
		createOperation: createOperation,
		makePromise: makePromise,
		toPromise: toPromise,
		fromPromise: fromPromise,
		fromError: fromError,
		empty: empty$2,
		from: from,
		split: split,
		concat: concat,
		ApolloLink: ApolloLink,
		execute: execute
	});

	var linkToFetcher_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	var apollo_link_2 = lib;
	exports.execute = apollo_link_2.execute;
	function linkToFetcher(link) {
	    return function (fetcherOperation) {
	        return lib.makePromise(lib.execute(link, fetcherOperation));
	    };
	}
	exports.default = linkToFetcher;

	});

	unwrapExports(linkToFetcher_1);
	var linkToFetcher_2 = linkToFetcher_1.execute;

	var isEmptyObject_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });
	function isEmptyObject(obj) {
	    if (!obj) {
	        return true;
	    }
	    for (var key in obj) {
	        if (Object.hasOwnProperty.call(obj, key)) {
	            return false;
	        }
	    }
	    return true;
	}
	exports.default = isEmptyObject;

	});

	unwrapExports(isEmptyObject_1);

	var resolveFromParentTypename_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	function resolveFromParentTypename(parent, schema) {
	    var parentTypename = parent['__typename'];
	    if (!parentTypename) {
	        throw new Error('Did not fetch typename for object, unable to resolve interface.');
	    }
	    var resolvedType = schema.getType(parentTypename);
	    if (!(resolvedType instanceof graphql_1__default.GraphQLObjectType)) {
	        throw new Error('__typename did not match an object type: ' + parentTypename);
	    }
	    return resolvedType;
	}
	exports.default = resolveFromParentTypename;

	});

	unwrapExports(resolveFromParentTypename_1);

	var errors = createCommonjsModule(function (module, exports) {
	var __extends = (commonjsGlobal && commonjsGlobal.__extends) || (function () {
	    var extendStatics = Object.setPrototypeOf ||
	        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
	        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
	    return function (d, b) {
	        extendStatics(d, b);
	        function __() { this.constructor = d; }
	        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	    };
	})();
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });


	var ERROR_SYMBOL;
	if ((typeof commonjsGlobal !== 'undefined' && 'Symbol' in commonjsGlobal) ||
	    (typeof window !== 'undefined' && 'Symbol' in window)) {
	    ERROR_SYMBOL = Symbol('subSchemaErrors');
	}
	else {
	    ERROR_SYMBOL = '@@__subSchemaErrors';
	}
	exports.ErrorSymbol = ERROR_SYMBOL;
	function annotateWithChildrenErrors(object, childrenErrors) {
	    if (childrenErrors && childrenErrors.length > 0) {
	        if (Array.isArray(object)) {
	            var byIndex_1 = {};
	            childrenErrors.forEach(function (error$$1) {
	                if (!error$$1.path) {
	                    return;
	                }
	                var index = error$$1.path[1];
	                var current = byIndex_1[index] || [];
	                current.push(__assign({}, error$$1, { path: error$$1.path.slice(1) }));
	                byIndex_1[index] = current;
	            });
	            return object.map(function (item, index) {
	                return annotateWithChildrenErrors(item, byIndex_1[index]);
	            });
	        }
	        else {
	            return __assign({}, object, (_a = {}, _a[ERROR_SYMBOL] = childrenErrors.map(function (error$$1) { return (__assign({}, error$$1, error$$1.path ? { path: error$$1.path.slice(1) } : {})); }), _a));
	        }
	    }
	    else {
	        return object;
	    }
	    var _a;
	}
	exports.annotateWithChildrenErrors = annotateWithChildrenErrors;
	function getErrorsFromParent(object, fieldName) {
	    var errors = (object && object[ERROR_SYMBOL]) || [];
	    var childrenErrors = [];
	    for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
	        var error$$1 = errors_1[_i];
	        if ((!error$$1.path) || (error$$1.path.length === 1 && error$$1.path[0] === fieldName)) {
	            return {
	                kind: 'OWN',
	                error: error$$1,
	            };
	        }
	        else if (error$$1.path[0] === fieldName) {
	            childrenErrors.push(error$$1);
	        }
	    }
	    return {
	        kind: 'CHILDREN',
	        errors: childrenErrors,
	    };
	}
	exports.getErrorsFromParent = getErrorsFromParent;
	var CombinedError = /** @class */ (function (_super) {
	    __extends(CombinedError, _super);
	    function CombinedError(message, errors) {
	        var _this = _super.call(this, message) || this;
	        _this.errors = errors;
	        return _this;
	    }
	    return CombinedError;
	}(Error));
	function checkResultAndHandleErrors(result, info, responseKey) {
	    if (!responseKey) {
	        responseKey = info.fieldNodes[0].alias
	            ? info.fieldNodes[0].alias.value
	            : info.fieldName;
	    }
	    if (result.errors && (!result.data || result.data[responseKey] == null)) {
	        // apollo-link-http & http-link-dataloader need the
	        // result property to be passed through for better error handling.
	        // If there is only one error, which contains a result property, pass the error through
	        var newError = result.errors.length === 1 && hasResult(result.errors[0])
	            ? result.errors[0]
	            : new CombinedError(concatErrors(result.errors), result.errors);
	        throw error.locatedError(newError, info.fieldNodes, graphql_1__default.responsePathAsArray(info.path));
	    }
	    else {
	        var resultObject = result.data[responseKey];
	        if (result.errors) {
	            resultObject = annotateWithChildrenErrors(resultObject, result.errors);
	        }
	        return resultObject;
	    }
	}
	exports.checkResultAndHandleErrors = checkResultAndHandleErrors;
	function concatErrors(errors) {
	    return errors.map(function (error$$1) { return error$$1.message; }).join('\n');
	}
	function hasResult(error$$1) {
	    return error$$1.result || (error$$1.originalError && error$$1.originalError.result);
	}

	});

	unwrapExports(errors);
	var errors_1 = errors.ErrorSymbol;
	var errors_2 = errors.annotateWithChildrenErrors;
	var errors_3 = errors.getErrorsFromParent;
	var errors_4 = errors.checkResultAndHandleErrors;

	var defaultMergedResolver_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });



	// Resolver that knows how to:
	// a) handle aliases for proxied schemas
	// b) handle errors from proxied schemas
	var defaultMergedResolver = function (parent, args, context, info) {
	    var responseKey = info.fieldNodes[0].alias
	        ? info.fieldNodes[0].alias.value
	        : info.fieldName;
	    var errorResult = errors.getErrorsFromParent(parent, responseKey);
	    if (errorResult.kind === 'OWN') {
	        throw error.locatedError(new Error(errorResult.error.message), info.fieldNodes, graphql_1__default.responsePathAsArray(info.path));
	    }
	    else if (parent) {
	        var result = parent[responseKey];
	        // subscription result mapping
	        if (!result && parent.data && parent.data[responseKey]) {
	            result = parent.data[responseKey];
	        }
	        if (errorResult.errors) {
	            result = errors.annotateWithChildrenErrors(result, errorResult.errors);
	        }
	        return result;
	    }
	    else {
	        return null;
	    }
	};
	exports.default = defaultMergedResolver;

	});

	unwrapExports(defaultMergedResolver_1);

	/**
	 * Copyright (c) 2016, Lee Byron
	 * All rights reserved.
	 *
	 * This source code is licensed under the MIT license found in the
	 * LICENSE file in the root directory of this source tree.
	 *
	 * @flow
	 * @ignore
	 */

	/**
	 * [Iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator)
	 * is a *protocol* which describes a standard way to produce a sequence of
	 * values, typically the values of the Iterable represented by this Iterator.
	 *
	 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterator-interface)
	 * it can be utilized by any version of JavaScript.
	 *
	 * @external Iterator
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterator|MDN Iteration protocols}
	 */

	/**
	 * [Iterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable)
	 * is a *protocol* which when implemented allows a JavaScript object to define
	 * their iteration behavior, such as what values are looped over in a
	 * [`for...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
	 * loop or `iterall`'s `forEach` function. Many [built-in types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#Builtin_iterables)
	 * implement the Iterable protocol, including `Array` and `Map`.
	 *
	 * While described by the [ES2015 version of JavaScript](http://www.ecma-international.org/ecma-262/6.0/#sec-iterable-interface)
	 * it can be utilized by any version of JavaScript.
	 *
	 * @external Iterable
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#iterable|MDN Iteration protocols}
	 */

	// In ES2015 environments, Symbol exists
	var SYMBOL /*: any */ = typeof Symbol === 'function' ? Symbol : void 0;

	// In ES2015 (or a polyfilled) environment, this will be Symbol.iterator
	var SYMBOL_ITERATOR = SYMBOL && SYMBOL.iterator;

	/**
	 * A property name to be used as the name of an Iterable's method responsible
	 * for producing an Iterator, referred to as `@@iterator`. Typically represents
	 * the value `Symbol.iterator` but falls back to the string `"@@iterator"` when
	 * `Symbol.iterator` is not defined.
	 *
	 * Use `$$iterator` for defining new Iterables instead of `Symbol.iterator`,
	 * but do not use it for accessing existing Iterables, instead use
	 * {@link getIterator} or {@link isIterable}.
	 *
	 * @example
	 *
	 * var $$iterator = require('iterall').$$iterator
	 *
	 * function Counter (to) {
	 *   this.to = to
	 * }
	 *
	 * Counter.prototype[$$iterator] = function () {
	 *   return {
	 *     to: this.to,
	 *     num: 0,
	 *     next () {
	 *       if (this.num >= this.to) {
	 *         return { value: undefined, done: true }
	 *       }
	 *       return { value: this.num++, done: false }
	 *     }
	 *   }
	 * }
	 *
	 * var counter = new Counter(3)
	 * for (var number of counter) {
	 *   console.log(number) // 0 ... 1 ... 2
	 * }
	 *
	 * @type {Symbol|string}
	 */
	/*:: declare export var $$iterator: '@@iterator'; */
	var $$iterator = SYMBOL_ITERATOR || '@@iterator';

	/**
	 * Returns true if the provided object implements the Iterator protocol via
	 * either implementing a `Symbol.iterator` or `"@@iterator"` method.
	 *
	 * @example
	 *
	 * var isIterable = require('iterall').isIterable
	 * isIterable([ 1, 2, 3 ]) // true
	 * isIterable('ABC') // true
	 * isIterable({ length: 1, 0: 'Alpha' }) // false
	 * isIterable({ key: 'value' }) // false
	 * isIterable(new Map()) // true
	 *
	 * @param obj
	 *   A value which might implement the Iterable protocol.
	 * @return {boolean} true if Iterable.
	 */
	/*:: declare export function isIterable(obj: any): boolean; */
	function isIterable(obj) {
	  return !!getIteratorMethod(obj)
	}

	/**
	 * Returns true if the provided object implements the Array-like protocol via
	 * defining a positive-integer `length` property.
	 *
	 * @example
	 *
	 * var isArrayLike = require('iterall').isArrayLike
	 * isArrayLike([ 1, 2, 3 ]) // true
	 * isArrayLike('ABC') // true
	 * isArrayLike({ length: 1, 0: 'Alpha' }) // true
	 * isArrayLike({ key: 'value' }) // false
	 * isArrayLike(new Map()) // false
	 *
	 * @param obj
	 *   A value which might implement the Array-like protocol.
	 * @return {boolean} true if Array-like.
	 */
	/*:: declare export function isArrayLike(obj: any): boolean; */
	function isArrayLike(obj) {
	  var length = obj != null && obj.length;
	  return typeof length === 'number' && length >= 0 && length % 1 === 0
	}

	/**
	 * Returns true if the provided object is an Object (i.e. not a string literal)
	 * and is either Iterable or Array-like.
	 *
	 * This may be used in place of [Array.isArray()][isArray] to determine if an
	 * object should be iterated-over. It always excludes string literals and
	 * includes Arrays (regardless of if it is Iterable). It also includes other
	 * Array-like objects such as NodeList, TypedArray, and Buffer.
	 *
	 * @example
	 *
	 * var isCollection = require('iterall').isCollection
	 * isCollection([ 1, 2, 3 ]) // true
	 * isCollection('ABC') // false
	 * isCollection({ length: 1, 0: 'Alpha' }) // true
	 * isCollection({ key: 'value' }) // false
	 * isCollection(new Map()) // true
	 *
	 * @example
	 *
	 * var forEach = require('iterall').forEach
	 * if (isCollection(obj)) {
	 *   forEach(obj, function (value) {
	 *     console.log(value)
	 *   })
	 * }
	 *
	 * @param obj
	 *   An Object value which might implement the Iterable or Array-like protocols.
	 * @return {boolean} true if Iterable or Array-like Object.
	 */
	/*:: declare export function isCollection(obj: any): boolean; */
	function isCollection(obj) {
	  return Object(obj) === obj && (isArrayLike(obj) || isIterable(obj))
	}

	/**
	 * If the provided object implements the Iterator protocol, its Iterator object
	 * is returned. Otherwise returns undefined.
	 *
	 * @example
	 *
	 * var getIterator = require('iterall').getIterator
	 * var iterator = getIterator([ 1, 2, 3 ])
	 * iterator.next() // { value: 1, done: false }
	 * iterator.next() // { value: 2, done: false }
	 * iterator.next() // { value: 3, done: false }
	 * iterator.next() // { value: undefined, done: true }
	 *
	 * @template T the type of each iterated value
	 * @param {Iterable<T>} iterable
	 *   An Iterable object which is the source of an Iterator.
	 * @return {Iterator<T>} new Iterator instance.
	 */
	/*:: declare export var getIterator:
	  & (<+TValue>(iterable: Iterable<TValue>) => Iterator<TValue>)
	  & ((iterable: mixed) => void | Iterator<mixed>); */
	function getIterator(iterable) {
	  var method = getIteratorMethod(iterable);
	  if (method) {
	    return method.call(iterable)
	  }
	}

	/**
	 * If the provided object implements the Iterator protocol, the method
	 * responsible for producing its Iterator object is returned.
	 *
	 * This is used in rare cases for performance tuning. This method must be called
	 * with obj as the contextual this-argument.
	 *
	 * @example
	 *
	 * var getIteratorMethod = require('iterall').getIteratorMethod
	 * var myArray = [ 1, 2, 3 ]
	 * var method = getIteratorMethod(myArray)
	 * if (method) {
	 *   var iterator = method.call(myArray)
	 * }
	 *
	 * @template T the type of each iterated value
	 * @param {Iterable<T>} iterable
	 *   An Iterable object which defines an `@@iterator` method.
	 * @return {function(): Iterator<T>} `@@iterator` method.
	 */
	/*:: declare export var getIteratorMethod:
	  & (<+TValue>(iterable: Iterable<TValue>) => (() => Iterator<TValue>))
	  & ((iterable: mixed) => (void | (() => Iterator<mixed>))); */
	function getIteratorMethod(iterable) {
	  if (iterable != null) {
	    var method =
	      (SYMBOL_ITERATOR && iterable[SYMBOL_ITERATOR]) || iterable['@@iterator'];
	    if (typeof method === 'function') {
	      return method
	    }
	  }
	}

	/**
	 * Similar to {@link getIterator}, this method returns a new Iterator given an
	 * Iterable. However it will also create an Iterator for a non-Iterable
	 * Array-like collection, such as Array in a non-ES2015 environment.
	 *
	 * `createIterator` is complimentary to `forEach`, but allows a "pull"-based
	 * iteration as opposed to `forEach`'s "push"-based iteration.
	 *
	 * `createIterator` produces an Iterator for Array-likes with the same behavior
	 * as ArrayIteratorPrototype described in the ECMAScript specification, and
	 * does *not* skip over "holes".
	 *
	 * @example
	 *
	 * var createIterator = require('iterall').createIterator
	 *
	 * var myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
	 * var iterator = createIterator(myArraylike)
	 * iterator.next() // { value: 'Alpha', done: false }
	 * iterator.next() // { value: 'Bravo', done: false }
	 * iterator.next() // { value: 'Charlie', done: false }
	 * iterator.next() // { value: undefined, done: true }
	 *
	 * @template T the type of each iterated value
	 * @param {Iterable<T>|{ length: number }} collection
	 *   An Iterable or Array-like object to produce an Iterator.
	 * @return {Iterator<T>} new Iterator instance.
	 */
	/*:: declare export var createIterator:
	  & (<+TValue>(collection: Iterable<TValue>) => Iterator<TValue>)
	  & ((collection: {length: number}) => Iterator<mixed>)
	  & ((collection: mixed) => (void | Iterator<mixed>)); */
	function createIterator(collection) {
	  if (collection != null) {
	    var iterator = getIterator(collection);
	    if (iterator) {
	      return iterator
	    }
	    if (isArrayLike(collection)) {
	      return new ArrayLikeIterator(collection)
	    }
	  }
	}

	// When the object provided to `createIterator` is not Iterable but is
	// Array-like, this simple Iterator is created.
	function ArrayLikeIterator(obj) {
	  this._o = obj;
	  this._i = 0;
	}

	// Note: all Iterators are themselves Iterable.
	ArrayLikeIterator.prototype[$$iterator] = function() {
	  return this
	};

	// A simple state-machine determines the IteratorResult returned, yielding
	// each value in the Array-like object in order of their indicies.
	ArrayLikeIterator.prototype.next = function() {
	  if (this._o === void 0 || this._i >= this._o.length) {
	    this._o = void 0;
	    return { value: void 0, done: true }
	  }
	  return { value: this._o[this._i++], done: false }
	};

	/**
	 * Given an object which either implements the Iterable protocol or is
	 * Array-like, iterate over it, calling the `callback` at each iteration.
	 *
	 * Use `forEach` where you would expect to use a `for ... of` loop in ES6.
	 * However `forEach` adheres to the behavior of [Array#forEach][] described in
	 * the ECMAScript specification, skipping over "holes" in Array-likes. It will
	 * also delegate to a `forEach` method on `collection` if one is defined,
	 * ensuring native performance for `Arrays`.
	 *
	 * Similar to [Array#forEach][], the `callback` function accepts three
	 * arguments, and is provided with `thisArg` as the calling context.
	 *
	 * Note: providing an infinite Iterator to forEach will produce an error.
	 *
	 * [Array#forEach]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
	 *
	 * @example
	 *
	 * var forEach = require('iterall').forEach
	 *
	 * forEach(myIterable, function (value, index, iterable) {
	 *   console.log(value, index, iterable === myIterable)
	 * })
	 *
	 * @example
	 *
	 * // ES6:
	 * for (let value of myIterable) {
	 *   console.log(value)
	 * }
	 *
	 * // Any JavaScript environment:
	 * forEach(myIterable, function (value) {
	 *   console.log(value)
	 * })
	 *
	 * @template T the type of each iterated value
	 * @param {Iterable<T>|{ length: number }} collection
	 *   The Iterable or array to iterate over.
	 * @param {function(T, number, object)} callback
	 *   Function to execute for each iteration, taking up to three arguments
	 * @param [thisArg]
	 *   Optional. Value to use as `this` when executing `callback`.
	 */
	/*:: declare export var forEach:
	  & (<+TValue, TCollection: Iterable<TValue>>(
	      collection: TCollection,
	      callbackFn: (value: TValue, index: number, collection: TCollection) => any,
	      thisArg?: any
	    ) => void)
	  & (<TCollection: {length: number}>(
	      collection: TCollection,
	      callbackFn: (value: mixed, index: number, collection: TCollection) => any,
	      thisArg?: any
	    ) => void); */
	function forEach(collection, callback, thisArg) {
	  if (collection != null) {
	    if (typeof collection.forEach === 'function') {
	      return collection.forEach(callback, thisArg)
	    }
	    var i = 0;
	    var iterator = getIterator(collection);
	    if (iterator) {
	      var step;
	      while (!(step = iterator.next()).done) {
	        callback.call(thisArg, step.value, i++, collection);
	        // Infinite Iterators could cause forEach to run forever.
	        // After a very large number of iterations, produce an error.
	        /* istanbul ignore if */
	        if (i > 9999999) {
	          throw new TypeError('Near-infinite iteration.')
	        }
	      }
	    } else if (isArrayLike(collection)) {
	      for (; i < collection.length; i++) {
	        if (collection.hasOwnProperty(i)) {
	          callback.call(thisArg, collection[i], i, collection);
	        }
	      }
	    }
	  }
	}

	/////////////////////////////////////////////////////
	//                                                 //
	//                 ASYNC ITERATORS                 //
	//                                                 //
	/////////////////////////////////////////////////////

	/**
	 * [AsyncIterable](https://tc39.github.io/proposal-async-iteration/#sec-asynciterable-interface)
	 * is a *protocol* which when implemented allows a JavaScript object to define
	 * an asynchronous iteration behavior, such as what values are looped over in
	 * a [`for-await-of`](https://tc39.github.io/proposal-async-iteration/#sec-for-in-and-for-of-statements)
	 * loop or `iterall`'s {@link forAwaitEach} function.
	 *
	 * While described as a proposed addition to the [ES2017 version of JavaScript](https://tc39.github.io/proposal-async-iteration/)
	 * it can be utilized by any version of JavaScript.
	 *
	 * @external AsyncIterable
	 * @see {@link https://tc39.github.io/proposal-async-iteration/#sec-asynciterable-interface|Async Iteration Proposal}
	 * @template T The type of each iterated value
	 * @property {function (): AsyncIterator<T>} Symbol.asyncIterator
	 *   A method which produces an AsyncIterator for this AsyncIterable.
	 */

	/**
	 * [AsyncIterator](https://tc39.github.io/proposal-async-iteration/#sec-asynciterator-interface)
	 * is a *protocol* which describes a standard way to produce and consume an
	 * asynchronous sequence of values, typically the values of the
	 * {@link AsyncIterable} represented by this {@link AsyncIterator}.
	 *
	 * AsyncIterator is similar to Observable or Stream. Like an {@link Iterator} it
	 * also as a `next()` method, however instead of an IteratorResult,
	 * calling this method returns a {@link Promise} for a IteratorResult.
	 *
	 * While described as a proposed addition to the [ES2017 version of JavaScript](https://tc39.github.io/proposal-async-iteration/)
	 * it can be utilized by any version of JavaScript.
	 *
	 * @external AsyncIterator
	 * @see {@link https://tc39.github.io/proposal-async-iteration/#sec-asynciterator-interface|Async Iteration Proposal}
	 */

	// In ES2017 (or a polyfilled) environment, this will be Symbol.asyncIterator
	var SYMBOL_ASYNC_ITERATOR = SYMBOL && SYMBOL.asyncIterator;

	/**
	 * A property name to be used as the name of an AsyncIterable's method
	 * responsible for producing an Iterator, referred to as `@@asyncIterator`.
	 * Typically represents the value `Symbol.asyncIterator` but falls back to the
	 * string `"@@asyncIterator"` when `Symbol.asyncIterator` is not defined.
	 *
	 * Use `$$asyncIterator` for defining new AsyncIterables instead of
	 * `Symbol.asyncIterator`, but do not use it for accessing existing Iterables,
	 * instead use {@link getAsyncIterator} or {@link isAsyncIterable}.
	 *
	 * @example
	 *
	 * var $$asyncIterator = require('iterall').$$asyncIterator
	 *
	 * function Chirper (to) {
	 *   this.to = to
	 * }
	 *
	 * Chirper.prototype[$$asyncIterator] = function () {
	 *   return {
	 *     to: this.to,
	 *     num: 0,
	 *     next () {
	 *       return new Promise(resolve => {
	 *         if (this.num >= this.to) {
	 *           resolve({ value: undefined, done: true })
	 *         } else {
	 *           setTimeout(() => {
	 *             resolve({ value: this.num++, done: false })
	 *           }, 1000)
	 *         }
	 *       })
	 *     }
	 *   }
	 * }
	 *
	 * var chirper = new Chirper(3)
	 * for await (var number of chirper) {
	 *   console.log(number) // 0 ...wait... 1 ...wait... 2
	 * }
	 *
	 * @type {Symbol|string}
	 */
	/*:: declare export var $$asyncIterator: '@@asyncIterator'; */
	var $$asyncIterator = SYMBOL_ASYNC_ITERATOR || '@@asyncIterator';

	/**
	 * Returns true if the provided object implements the AsyncIterator protocol via
	 * either implementing a `Symbol.asyncIterator` or `"@@asyncIterator"` method.
	 *
	 * @example
	 *
	 * var isAsyncIterable = require('iterall').isAsyncIterable
	 * isAsyncIterable(myStream) // true
	 * isAsyncIterable('ABC') // false
	 *
	 * @param obj
	 *   A value which might implement the AsyncIterable protocol.
	 * @return {boolean} true if AsyncIterable.
	 */
	/*:: declare export function isAsyncIterable(obj: any): boolean; */
	function isAsyncIterable(obj) {
	  return !!getAsyncIteratorMethod(obj)
	}

	/**
	 * If the provided object implements the AsyncIterator protocol, its
	 * AsyncIterator object is returned. Otherwise returns undefined.
	 *
	 * @example
	 *
	 * var getAsyncIterator = require('iterall').getAsyncIterator
	 * var asyncIterator = getAsyncIterator(myStream)
	 * asyncIterator.next().then(console.log) // { value: 1, done: false }
	 * asyncIterator.next().then(console.log) // { value: 2, done: false }
	 * asyncIterator.next().then(console.log) // { value: 3, done: false }
	 * asyncIterator.next().then(console.log) // { value: undefined, done: true }
	 *
	 * @template T the type of each iterated value
	 * @param {AsyncIterable<T>} asyncIterable
	 *   An AsyncIterable object which is the source of an AsyncIterator.
	 * @return {AsyncIterator<T>} new AsyncIterator instance.
	 */
	/*:: declare export var getAsyncIterator:
	  & (<+TValue>(asyncIterable: AsyncIterable<TValue>) => AsyncIterator<TValue>)
	  & ((asyncIterable: mixed) => (void | AsyncIterator<mixed>)); */
	function getAsyncIterator(asyncIterable) {
	  var method = getAsyncIteratorMethod(asyncIterable);
	  if (method) {
	    return method.call(asyncIterable)
	  }
	}

	/**
	 * If the provided object implements the AsyncIterator protocol, the method
	 * responsible for producing its AsyncIterator object is returned.
	 *
	 * This is used in rare cases for performance tuning. This method must be called
	 * with obj as the contextual this-argument.
	 *
	 * @example
	 *
	 * var getAsyncIteratorMethod = require('iterall').getAsyncIteratorMethod
	 * var method = getAsyncIteratorMethod(myStream)
	 * if (method) {
	 *   var asyncIterator = method.call(myStream)
	 * }
	 *
	 * @template T the type of each iterated value
	 * @param {AsyncIterable<T>} asyncIterable
	 *   An AsyncIterable object which defines an `@@asyncIterator` method.
	 * @return {function(): AsyncIterator<T>} `@@asyncIterator` method.
	 */
	/*:: declare export var getAsyncIteratorMethod:
	  & (<+TValue>(asyncIterable: AsyncIterable<TValue>) => (() => AsyncIterator<TValue>))
	  & ((asyncIterable: mixed) => (void | (() => AsyncIterator<mixed>))); */
	function getAsyncIteratorMethod(asyncIterable) {
	  if (asyncIterable != null) {
	    var method =
	      (SYMBOL_ASYNC_ITERATOR && asyncIterable[SYMBOL_ASYNC_ITERATOR]) ||
	      asyncIterable['@@asyncIterator'];
	    if (typeof method === 'function') {
	      return method
	    }
	  }
	}

	/**
	 * Similar to {@link getAsyncIterator}, this method returns a new AsyncIterator
	 * given an AsyncIterable. However it will also create an AsyncIterator for a
	 * non-async Iterable as well as non-Iterable Array-like collection, such as
	 * Array in a pre-ES2015 environment.
	 *
	 * `createAsyncIterator` is complimentary to `forAwaitEach`, but allows a
	 * buffering "pull"-based iteration as opposed to `forAwaitEach`'s
	 * "push"-based iteration.
	 *
	 * `createAsyncIterator` produces an AsyncIterator for non-async Iterables as
	 * described in the ECMAScript proposal [Async-from-Sync Iterator Objects](https://tc39.github.io/proposal-async-iteration/#sec-async-from-sync-iterator-objects).
	 *
	 * > Note: Creating `AsyncIterator`s requires the existence of `Promise`.
	 * > While `Promise` has been available in modern browsers for a number of
	 * > years, legacy browsers (like IE 11) may require a polyfill.
	 *
	 * @example
	 *
	 * var createAsyncIterator = require('iterall').createAsyncIterator
	 *
	 * var myArraylike = { length: 3, 0: 'Alpha', 1: 'Bravo', 2: 'Charlie' }
	 * var iterator = createAsyncIterator(myArraylike)
	 * iterator.next().then(console.log) // { value: 'Alpha', done: false }
	 * iterator.next().then(console.log) // { value: 'Bravo', done: false }
	 * iterator.next().then(console.log) // { value: 'Charlie', done: false }
	 * iterator.next().then(console.log) // { value: undefined, done: true }
	 *
	 * @template T the type of each iterated value
	 * @param {AsyncIterable<T>|Iterable<T>|{ length: number }} source
	 *   An AsyncIterable, Iterable, or Array-like object to produce an Iterator.
	 * @return {AsyncIterator<T>} new AsyncIterator instance.
	 */
	/*:: declare export var createAsyncIterator:
	  & (<+TValue>(
	      collection: Iterable<Promise<TValue> | TValue> | AsyncIterable<TValue>
	    ) => AsyncIterator<TValue>)
	  & ((collection: {length: number}) => AsyncIterator<mixed>)
	  & ((collection: mixed) => (void | AsyncIterator<mixed>)); */
	function createAsyncIterator(source) {
	  if (source != null) {
	    var asyncIterator = getAsyncIterator(source);
	    if (asyncIterator) {
	      return asyncIterator
	    }
	    var iterator = createIterator(source);
	    if (iterator) {
	      return new AsyncFromSyncIterator(iterator)
	    }
	  }
	}

	// When the object provided to `createAsyncIterator` is not AsyncIterable but is
	// sync Iterable, this simple wrapper is created.
	function AsyncFromSyncIterator(iterator) {
	  this._i = iterator;
	}

	// Note: all AsyncIterators are themselves AsyncIterable.
	AsyncFromSyncIterator.prototype[$$asyncIterator] = function() {
	  return this
	};

	// A simple state-machine determines the IteratorResult returned, yielding
	// each value in the Array-like object in order of their indicies.
	AsyncFromSyncIterator.prototype.next = function() {
	  var step = this._i.next();
	  return Promise.resolve(step.value).then(function(value) {
	    return { value: value, done: step.done }
	  })
	};

	/**
	 * Given an object which either implements the AsyncIterable protocol or is
	 * Array-like, iterate over it, calling the `callback` at each iteration.
	 *
	 * Use `forAwaitEach` where you would expect to use a [for-await-of](https://tc39.github.io/proposal-async-iteration/#sec-for-in-and-for-of-statements) loop.
	 *
	 * Similar to [Array#forEach][], the `callback` function accepts three
	 * arguments, and is provided with `thisArg` as the calling context.
	 *
	 * > Note: Using `forAwaitEach` requires the existence of `Promise`.
	 * > While `Promise` has been available in modern browsers for a number of
	 * > years, legacy browsers (like IE 11) may require a polyfill.
	 *
	 * @example
	 *
	 * var forAwaitEach = require('iterall').forAwaitEach
	 *
	 * forAwaitEach(myIterable, function (value, index, iterable) {
	 *   console.log(value, index, iterable === myIterable)
	 * })
	 *
	 * @example
	 *
	 * // ES2017:
	 * for await (let value of myAsyncIterable) {
	 *   console.log(await doSomethingAsync(value))
	 * }
	 * console.log('done')
	 *
	 * // Any JavaScript environment:
	 * forAwaitEach(myAsyncIterable, function (value) {
	 *   return doSomethingAsync(value).then(console.log)
	 * }).then(function () {
	 *   console.log('done')
	 * })
	 *
	 * @template T the type of each iterated value
	 * @param {AsyncIterable<T>|Iterable<Promise<T> | T>|{ length: number }} source
	 *   The AsyncIterable or array to iterate over.
	 * @param {function(T, number, object)} callback
	 *   Function to execute for each iteration, taking up to three arguments
	 * @param [thisArg]
	 *   Optional. Value to use as `this` when executing `callback`.
	 */
	/*:: declare export var forAwaitEach:
	  & (<+TValue, TCollection: Iterable<Promise<TValue> | TValue> | AsyncIterable<TValue>>(
	      collection: TCollection,
	      callbackFn: (value: TValue, index: number, collection: TCollection) => any,
	      thisArg?: any
	    ) => Promise<void>)
	  & (<TCollection: { length: number }>(
	      collection: TCollection,
	      callbackFn: (value: mixed, index: number, collection: TCollection) => any,
	      thisArg?: any
	    ) => Promise<void>); */
	function forAwaitEach(source, callback, thisArg) {
	  var asyncIterator = createAsyncIterator(source);
	  if (asyncIterator) {
	    var i = 0;
	    return new Promise(function(resolve, reject) {
	      function next() {
	        asyncIterator
	          .next()
	          .then(function(step) {
	            if (!step.done) {
	              Promise.resolve(callback.call(thisArg, step.value, i++, source))
	                .then(next)
	                .catch(reject);
	            } else {
	              resolve();
	            }
	            // Explicitly return null, silencing bluebird-style warnings.
	            return null
	          })
	          .catch(reject);
	        // Explicitly return null, silencing bluebird-style warnings.
	        return null
	      }
	      next();
	    })
	  }
	}

	var iterall = /*#__PURE__*/Object.freeze({
		$$iterator: $$iterator,
		isIterable: isIterable,
		isArrayLike: isArrayLike,
		isCollection: isCollection,
		getIterator: getIterator,
		getIteratorMethod: getIteratorMethod,
		createIterator: createIterator,
		forEach: forEach,
		$$asyncIterator: $$asyncIterator,
		isAsyncIterable: isAsyncIterable,
		getAsyncIterator: getAsyncIterator,
		getAsyncIteratorMethod: getAsyncIteratorMethod,
		createAsyncIterator: createAsyncIterator,
		forAwaitEach: forAwaitEach
	});

	var iterall_1 = ( iterall && undefined ) || iterall;

	var observableToAsyncIterable_1 = createCommonjsModule(function (module, exports) {
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });

	function observableToAsyncIterable(observable) {
	    var pullQueue = [];
	    var pushQueue = [];
	    var listening = true;
	    var pushValue = function (_a) {
	        var data = _a.data;
	        if (pullQueue.length !== 0) {
	            pullQueue.shift()({ value: data, done: false });
	        }
	        else {
	            pushQueue.push({ value: data });
	        }
	    };
	    var pushError = function (error$$1) {
	        if (pullQueue.length !== 0) {
	            pullQueue.shift()({ value: { errors: [error$$1] }, done: false });
	        }
	        else {
	            pushQueue.push({ value: { errors: [error$$1] } });
	        }
	    };
	    var pullValue = function () {
	        return new Promise(function (resolve) {
	            if (pushQueue.length !== 0) {
	                var element = pushQueue.shift();
	                // either {value: {errors: [...]}} or {value: ...}
	                resolve(__assign({}, element, { done: false }));
	            }
	            else {
	                pullQueue.push(resolve);
	            }
	        });
	    };
	    var subscription = observable.subscribe({
	        next: function (value) {
	            pushValue(value);
	        },
	        error: function (err) {
	            pushError(err);
	        },
	    });
	    var emptyQueue = function () {
	        if (listening) {
	            listening = false;
	            subscription.unsubscribe();
	            pullQueue.forEach(function (resolve) { return resolve({ value: undefined, done: true }); });
	            pullQueue.length = 0;
	            pushQueue.length = 0;
	        }
	    };
	    return _a = {
	            next: function () {
	                return __awaiter(this, void 0, void 0, function () {
	                    return __generator(this, function (_a) {
	                        return [2 /*return*/, listening ? pullValue() : this.return()];
	                    });
	                });
	            },
	            return: function () {
	                emptyQueue();
	                return Promise.resolve({ value: undefined, done: true });
	            },
	            throw: function (error$$1) {
	                emptyQueue();
	                return Promise.reject(error$$1);
	            }
	        },
	        _a[iterall_1.$$asyncIterator] = function () {
	            return this;
	        },
	        _a;
	    var _a;
	}
	exports.observableToAsyncIterable = observableToAsyncIterable;

	});

	unwrapExports(observableToAsyncIterable_1);
	var observableToAsyncIterable_2 = observableToAsyncIterable_1.observableToAsyncIterable;

	var makeRemoteExecutableSchema_1 = createCommonjsModule(function (module, exports) {
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });








	function makeRemoteExecutableSchema(_a) {
	    var schema = _a.schema, link = _a.link, fetcher = _a.fetcher;
	    if (!fetcher && link) {
	        fetcher = linkToFetcher_1.default(link);
	    }
	    var typeDefs;
	    if (typeof schema === 'string') {
	        typeDefs = schema;
	        schema = graphql_1__default.buildSchema(typeDefs);
	    }
	    else {
	        typeDefs = graphql_1__default.printSchema(schema);
	    }
	    // prepare query resolvers
	    var queryResolvers = {};
	    var queryType = schema.getQueryType();
	    var queries = queryType.getFields();
	    Object.keys(queries).forEach(function (key) {
	        queryResolvers[key] = createResolver(fetcher);
	    });
	    // prepare mutation resolvers
	    var mutationResolvers = {};
	    var mutationType = schema.getMutationType();
	    if (mutationType) {
	        var mutations = mutationType.getFields();
	        Object.keys(mutations).forEach(function (key) {
	            mutationResolvers[key] = createResolver(fetcher);
	        });
	    }
	    // prepare subscription resolvers
	    var subscriptionResolvers = {};
	    var subscriptionType = schema.getSubscriptionType();
	    if (subscriptionType) {
	        var subscriptions = subscriptionType.getFields();
	        Object.keys(subscriptions).forEach(function (key) {
	            subscriptionResolvers[key] = {
	                subscribe: createSubscriptionResolver(key, link),
	            };
	        });
	    }
	    // merge resolvers into resolver map
	    var resolvers = (_b = {}, _b[queryType.name] = queryResolvers, _b);
	    if (!isEmptyObject_1.default(mutationResolvers)) {
	        resolvers[mutationType.name] = mutationResolvers;
	    }
	    if (!isEmptyObject_1.default(subscriptionResolvers)) {
	        resolvers[subscriptionType.name] = subscriptionResolvers;
	    }
	    // add missing abstract resolvers (scalar, unions, interfaces)
	    var typeMap = schema.getTypeMap();
	    var types = Object.keys(typeMap).map(function (name) { return typeMap[name]; });
	    var _loop_1 = function (type) {
	        if (type instanceof graphql_1__default.GraphQLInterfaceType || type instanceof graphql_1__default.GraphQLUnionType) {
	            resolvers[type.name] = {
	                __resolveType: function (parent, context, info) {
	                    return resolveFromParentTypename_1.default(parent, info.schema);
	                },
	            };
	        }
	        else if (type instanceof graphql_1__default.GraphQLScalarType) {
	            if (!(type === graphql_1__default.GraphQLID ||
	                type === graphql_1__default.GraphQLString ||
	                type === graphql_1__default.GraphQLFloat ||
	                type === graphql_1__default.GraphQLBoolean ||
	                type === graphql_1__default.GraphQLInt)) {
	                resolvers[type.name] = createPassThroughScalar(type);
	            }
	        }
	        else if (type instanceof graphql_1__default.GraphQLObjectType &&
	            type.name.slice(0, 2) !== '__' &&
	            type !== queryType &&
	            type !== mutationType &&
	            type !== subscriptionType) {
	            var resolver_1 = {};
	            Object.keys(type.getFields()).forEach(function (field) {
	                resolver_1[field] = defaultMergedResolver_1.default;
	            });
	            resolvers[type.name] = resolver_1;
	        }
	    };
	    for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
	        var type = types_1[_i];
	        _loop_1(type);
	    }
	    return schemaGenerator.makeExecutableSchema({
	        typeDefs: typeDefs,
	        resolvers: resolvers,
	    });
	    var _b;
	}
	exports.default = makeRemoteExecutableSchema;
	function createResolver(fetcher) {
	    var _this = this;
	    return function (root, args, context, info) { return __awaiter(_this, void 0, void 0, function () {
	        var fragments, document, result;
	        return __generator(this, function (_a) {
	            switch (_a.label) {
	                case 0:
	                    fragments = Object.keys(info.fragments).map(function (fragment) { return info.fragments[fragment]; });
	                    document = {
	                        kind: graphql_1__default.Kind.DOCUMENT,
	                        definitions: [info.operation].concat(fragments),
	                    };
	                    return [4 /*yield*/, fetcher({
	                            query: document,
	                            variables: info.variableValues,
	                            context: { graphqlContext: context },
	                        })];
	                case 1:
	                    result = _a.sent();
	                    return [2 /*return*/, errors.checkResultAndHandleErrors(result, info)];
	            }
	        });
	    }); };
	}
	function createSubscriptionResolver(name, link) {
	    return function (root, args, context, info) {
	        var fragments = Object.keys(info.fragments).map(function (fragment) { return info.fragments[fragment]; });
	        var document = {
	            kind: graphql_1__default.Kind.DOCUMENT,
	            definitions: [info.operation].concat(fragments),
	        };
	        var operation = {
	            query: document,
	            variables: info.variableValues,
	            context: { graphqlContext: context },
	        };
	        var observable = linkToFetcher_1.execute(link, operation);
	        return observableToAsyncIterable_1.observableToAsyncIterable(observable);
	    };
	}
	function createPassThroughScalar(_a) {
	    var name = _a.name, description = _a.description;
	    return new graphql_1__default.GraphQLScalarType({
	        name: name,
	        description: description,
	        serialize: function (value) {
	            return value;
	        },
	        parseValue: function (value) {
	            return value;
	        },
	        parseLiteral: function (ast) {
	            return parseLiteral(ast);
	        },
	    });
	}
	function parseLiteral(ast) {
	    switch (ast.kind) {
	        case graphql_1__default.Kind.STRING:
	        case graphql_1__default.Kind.BOOLEAN: {
	            return ast.value;
	        }
	        case graphql_1__default.Kind.INT:
	        case graphql_1__default.Kind.FLOAT: {
	            return parseFloat(ast.value);
	        }
	        case graphql_1__default.Kind.OBJECT: {
	            var value_1 = Object.create(null);
	            ast.fields.forEach(function (field) {
	                value_1[field.name.value] = parseLiteral(field.value);
	            });
	            return value_1;
	        }
	        case graphql_1__default.Kind.LIST: {
	            return ast.values.map(parseLiteral);
	        }
	        default:
	            return null;
	    }
	}

	});

	unwrapExports(makeRemoteExecutableSchema_1);

	var introspectSchema_1 = createCommonjsModule(function (module, exports) {
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });


	var parsedIntrospectionQuery = graphql_1__default.parse(graphql_1__default.introspectionQuery);
	function introspectSchema(fetcher, linkContext) {
	    return __awaiter(this, void 0, void 0, function () {
	        var introspectionResult, schema;
	        return __generator(this, function (_a) {
	            switch (_a.label) {
	                case 0:
	                    // Convert link to fetcher
	                    if (fetcher.request) {
	                        fetcher = linkToFetcher_1.default(fetcher);
	                    }
	                    return [4 /*yield*/, fetcher({
	                            query: parsedIntrospectionQuery,
	                            context: linkContext,
	                        })];
	                case 1:
	                    introspectionResult = _a.sent();
	                    if ((introspectionResult.errors && introspectionResult.errors.length) ||
	                        !introspectionResult.data.__schema) {
	                        throw introspectionResult.errors;
	                    }
	                    else {
	                        schema = graphql_1__default.buildClientSchema(introspectionResult.data);
	                        return [2 /*return*/, schema];
	                    }
	                    return [2 /*return*/];
	            }
	        });
	    });
	}
	exports.default = introspectSchema;

	});

	unwrapExports(introspectSchema_1);

	var TypeRegistry_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	var TypeRegistry = /** @class */ (function () {
	    function TypeRegistry() {
	        this.types = {};
	        this.schemaByField = {
	            query: {},
	            mutation: {},
	            subscription: {},
	        };
	        this.fragmentReplacements = {};
	    }
	    TypeRegistry.prototype.getSchemaByField = function (operation, fieldName) {
	        return this.schemaByField[operation][fieldName];
	    };
	    TypeRegistry.prototype.getAllTypes = function () {
	        var _this = this;
	        return Object.keys(this.types).map(function (name) { return _this.types[name]; });
	    };
	    TypeRegistry.prototype.getType = function (name) {
	        if (!this.types[name]) {
	            throw new Error("No such type: " + name);
	        }
	        return this.types[name];
	    };
	    TypeRegistry.prototype.resolveType = function (type) {
	        if (type instanceof graphql_1__default.GraphQLList) {
	            return new graphql_1__default.GraphQLList(this.resolveType(type.ofType));
	        }
	        else if (type instanceof graphql_1__default.GraphQLNonNull) {
	            return new graphql_1__default.GraphQLNonNull(this.resolveType(type.ofType));
	        }
	        else if (graphql_1__default.isNamedType(type)) {
	            return this.getType(graphql_1__default.getNamedType(type).name);
	        }
	        else {
	            return type;
	        }
	    };
	    TypeRegistry.prototype.addSchema = function (schema) {
	        var _this = this;
	        var query = schema.getQueryType();
	        if (query) {
	            var fieldNames = Object.keys(query.getFields());
	            fieldNames.forEach(function (field) {
	                _this.schemaByField.query[field] = schema;
	            });
	        }
	        var mutation = schema.getMutationType();
	        if (mutation) {
	            var fieldNames = Object.keys(mutation.getFields());
	            fieldNames.forEach(function (field) {
	                _this.schemaByField.mutation[field] = schema;
	            });
	        }
	        var subscription = schema.getSubscriptionType();
	        if (subscription) {
	            var fieldNames = Object.keys(subscription.getFields());
	            fieldNames.forEach(function (field) {
	                _this.schemaByField.subscription[field] = schema;
	            });
	        }
	    };
	    TypeRegistry.prototype.addType = function (name, type, onTypeConflict) {
	        if (this.types[name]) {
	            if (onTypeConflict) {
	                type = onTypeConflict(this.types[name], type);
	            }
	            else {
	                throw new Error("Type name conflict: " + name);
	            }
	        }
	        this.types[name] = type;
	    };
	    TypeRegistry.prototype.addFragment = function (typeName, fieldName, fragment) {
	        if (!this.fragmentReplacements[typeName]) {
	            this.fragmentReplacements[typeName] = {};
	        }
	        this.fragmentReplacements[typeName][fieldName] = parseFragmentToInlineFragment(fragment);
	    };
	    return TypeRegistry;
	}());
	exports.default = TypeRegistry;
	function parseFragmentToInlineFragment(definitions) {
	    var document = graphql_1__default.parse(definitions);
	    for (var _i = 0, _a = document.definitions; _i < _a.length; _i++) {
	        var definition = _a[_i];
	        if (definition.kind === graphql_1__default.Kind.FRAGMENT_DEFINITION) {
	            return {
	                kind: graphql_1__default.Kind.INLINE_FRAGMENT,
	                typeCondition: definition.typeCondition,
	                selectionSet: definition.selectionSet,
	            };
	        }
	    }
	    throw new Error('Could not parse fragment');
	}

	});

	unwrapExports(TypeRegistry_1);

	var schemaRecreation = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });



	function recreateType(type, resolveType) {
	    if (type instanceof graphql_1__default.GraphQLObjectType) {
	        var fields_1 = type.getFields();
	        var interfaces_1 = type.getInterfaces();
	        return new graphql_1__default.GraphQLObjectType({
	            name: type.name,
	            description: type.description,
	            astNode: type.astNode,
	            fields: function () { return fieldMapToFieldConfigMap(fields_1, resolveType); },
	            interfaces: function () { return interfaces_1.map(function (iface) { return resolveType(iface); }); },
	        });
	    }
	    else if (type instanceof graphql_1__default.GraphQLInterfaceType) {
	        var fields_2 = type.getFields();
	        return new graphql_1__default.GraphQLInterfaceType({
	            name: type.name,
	            description: type.description,
	            astNode: type.astNode,
	            fields: function () { return fieldMapToFieldConfigMap(fields_2, resolveType); },
	            resolveType: function (parent, context, info) {
	                return resolveFromParentTypename_1.default(parent, info.schema);
	            },
	        });
	    }
	    else if (type instanceof graphql_1__default.GraphQLUnionType) {
	        return new graphql_1__default.GraphQLUnionType({
	            name: type.name,
	            description: type.description,
	            astNode: type.astNode,
	            types: function () { return type.getTypes().map(function (unionMember) { return resolveType(unionMember); }); },
	            resolveType: function (parent, context, info) {
	                return resolveFromParentTypename_1.default(parent, info.schema);
	            },
	        });
	    }
	    else if (type instanceof graphql_1__default.GraphQLInputObjectType) {
	        return new graphql_1__default.GraphQLInputObjectType({
	            name: type.name,
	            description: type.description,
	            astNode: type.astNode,
	            fields: function () {
	                return inputFieldMapToFieldConfigMap(type.getFields(), resolveType);
	            },
	        });
	    }
	    else if (type instanceof graphql_1__default.GraphQLEnumType) {
	        var values$$1 = type.getValues();
	        var newValues_1 = {};
	        values$$1.forEach(function (value) {
	            newValues_1[value.name] = { value: value.name };
	        });
	        return new graphql_1__default.GraphQLEnumType({
	            name: type.name,
	            description: type.description,
	            astNode: type.astNode,
	            values: newValues_1,
	        });
	    }
	    else if (type instanceof graphql_1__default.GraphQLScalarType) {
	        if (type === graphql_1__default.GraphQLID ||
	            type === graphql_1__default.GraphQLString ||
	            type === graphql_1__default.GraphQLFloat ||
	            type === graphql_1__default.GraphQLBoolean ||
	            type === graphql_1__default.GraphQLInt) {
	            return type;
	        }
	        else {
	            return new graphql_1__default.GraphQLScalarType({
	                name: type.name,
	                description: type.description,
	                astNode: type.astNode,
	                serialize: function (value) {
	                    return value;
	                },
	                parseValue: function (value) {
	                    return value;
	                },
	                parseLiteral: function (ast) {
	                    return parseLiteral(ast);
	                },
	            });
	        }
	    }
	    else {
	        throw new Error("Invalid type " + type);
	    }
	}
	exports.recreateType = recreateType;
	function parseLiteral(ast) {
	    switch (ast.kind) {
	        case graphql_1__default.Kind.STRING:
	        case graphql_1__default.Kind.BOOLEAN: {
	            return ast.value;
	        }
	        case graphql_1__default.Kind.INT:
	        case graphql_1__default.Kind.FLOAT: {
	            return parseFloat(ast.value);
	        }
	        case graphql_1__default.Kind.OBJECT: {
	            var value_1 = Object.create(null);
	            ast.fields.forEach(function (field) {
	                value_1[field.name.value] = parseLiteral(field.value);
	            });
	            return value_1;
	        }
	        case graphql_1__default.Kind.LIST: {
	            return ast.values.map(parseLiteral);
	        }
	        default:
	            return null;
	    }
	}
	function fieldMapToFieldConfigMap(fields, resolveType) {
	    var result = {};
	    Object.keys(fields).forEach(function (name) {
	        var field = fields[name];
	        var type = resolveType(field.type);
	        if (type !== null) {
	            result[name] = fieldToFieldConfig(fields[name], resolveType);
	        }
	    });
	    return result;
	}
	exports.fieldMapToFieldConfigMap = fieldMapToFieldConfigMap;
	function createResolveType(getType) {
	    var resolveType = function (type) {
	        if (type instanceof graphql_1__default.GraphQLList) {
	            var innerType = resolveType(type.ofType);
	            if (innerType === null) {
	                return null;
	            }
	            else {
	                return new graphql_1__default.GraphQLList(innerType);
	            }
	        }
	        else if (type instanceof graphql_1__default.GraphQLNonNull) {
	            var innerType = resolveType(type.ofType);
	            if (innerType === null) {
	                return null;
	            }
	            else {
	                return new graphql_1__default.GraphQLNonNull(innerType);
	            }
	        }
	        else if (graphql_1__default.isNamedType(type)) {
	            return getType(graphql_1__default.getNamedType(type).name, type);
	        }
	        else {
	            return type;
	        }
	    };
	    return resolveType;
	}
	exports.createResolveType = createResolveType;
	function fieldToFieldConfig(field, resolveType) {
	    return {
	        type: resolveType(field.type),
	        args: argsToFieldConfigArgumentMap(field.args, resolveType),
	        resolve: defaultMergedResolver_1.default,
	        description: field.description,
	        deprecationReason: field.deprecationReason,
	        astNode: field.astNode,
	    };
	}
	function argsToFieldConfigArgumentMap(args, resolveType) {
	    var result = {};
	    args.forEach(function (arg) {
	        var _a = argumentToArgumentConfig(arg, resolveType), name = _a[0], def = _a[1];
	        result[name] = def;
	    });
	    return result;
	}
	function argumentToArgumentConfig(argument, resolveType) {
	    return [
	        argument.name,
	        {
	            type: resolveType(argument.type),
	            defaultValue: argument.defaultValue,
	            description: argument.description,
	        },
	    ];
	}
	function inputFieldMapToFieldConfigMap(fields, resolveType) {
	    var result = {};
	    Object.keys(fields).forEach(function (name) {
	        var field = fields[name];
	        var type = resolveType(field.type);
	        if (type !== null) {
	            result[name] = inputFieldToFieldConfig(fields[name], resolveType);
	        }
	    });
	    return result;
	}
	function inputFieldToFieldConfig(field, resolveType) {
	    return {
	        type: resolveType(field.type),
	        defaultValue: field.defaultValue,
	        description: field.description,
	        astNode: field.astNode,
	    };
	}

	});

	unwrapExports(schemaRecreation);
	var schemaRecreation_1 = schemaRecreation.recreateType;
	var schemaRecreation_2 = schemaRecreation.fieldMapToFieldConfigMap;
	var schemaRecreation_3 = schemaRecreation.createResolveType;

	var delegateToSchema_1 = createCommonjsModule(function (module, exports) {
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	var __awaiter = (commonjsGlobal && commonjsGlobal.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (commonjsGlobal && commonjsGlobal.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });


	function delegateToSchema(schema, fragmentReplacements, operation, fieldName, args, context, info) {
	    return __awaiter(this, void 0, void 0, function () {
	        var type, graphqlDoc, errors$$1, operationDefinition, variableValues, _i, _a, definition, key, actualKey, result;
	        return __generator(this, function (_b) {
	            switch (_b.label) {
	                case 0:
	                    if (operation === 'mutation') {
	                        type = schema.getMutationType();
	                    }
	                    else if (operation === 'subscription') {
	                        type = schema.getSubscriptionType();
	                    }
	                    else {
	                        type = schema.getQueryType();
	                    }
	                    if (!type) return [3 /*break*/, 3];
	                    graphqlDoc = createDocument(schema, fragmentReplacements, type, fieldName, operation, info.fieldNodes, info.fragments, info.operation.variableDefinitions);
	                    errors$$1 = graphql_1__default.validate(schema, graphqlDoc);
	                    if (errors$$1.length > 0) {
	                        throw errors$$1;
	                    }
	                    operationDefinition = graphqlDoc.definitions.find(function (_a) {
	                        var kind = _a.kind;
	                        return kind === graphql_1__default.Kind.OPERATION_DEFINITION;
	                    });
	                    variableValues = {};
	                    if (operationDefinition &&
	                        operationDefinition.kind === graphql_1__default.Kind.OPERATION_DEFINITION &&
	                        operationDefinition.variableDefinitions &&
	                        Array.isArray(operationDefinition.variableDefinitions)) {
	                        for (_i = 0, _a = operationDefinition.variableDefinitions; _i < _a.length; _i++) {
	                            definition = _a[_i];
	                            key = definition.variable.name.value;
	                            actualKey = key.startsWith('_') ? key.slice(1) : key;
	                            variableValues[key] = args[actualKey] != null ? args[actualKey] : info.variableValues[key];
	                        }
	                    }
	                    if (!(operation === 'query' || operation === 'mutation')) return [3 /*break*/, 2];
	                    return [4 /*yield*/, graphql_1__default.execute(schema, graphqlDoc, info.rootValue, context, variableValues)];
	                case 1:
	                    result = _b.sent();
	                    return [2 /*return*/, errors.checkResultAndHandleErrors(result, info, fieldName)];
	                case 2:
	                    if (operation === 'subscription') {
	                        return [2 /*return*/, graphql_1__default.subscribe(schema, graphqlDoc, info.rootValue, context, variableValues)];
	                    }
	                    _b.label = 3;
	                case 3: throw new Error('Could not forward to merged schema');
	            }
	        });
	    });
	}
	exports.default = delegateToSchema;
	function createDocument(schema, fragmentReplacements, type, rootFieldName, operation, selections, fragments, variableDefinitions) {
	    var rootField = type.getFields()[rootFieldName];
	    var newVariables = [];
	    var rootSelectionSet = {
	        kind: graphql_1__default.Kind.SELECTION_SET,
	        // (XXX) This (wrongly) assumes only having one fieldNode
	        selections: selections.map(function (selection) {
	            if (selection.kind === graphql_1__default.Kind.FIELD) {
	                var _a = processRootField(selection, rootFieldName, rootField), newSelection = _a.selection, variables = _a.variables;
	                newVariables.push.apply(newVariables, variables);
	                return newSelection;
	            }
	            else {
	                return selection;
	            }
	        }),
	    };
	    var newVariableDefinitions = [];
	    newVariables.forEach(function (_a) {
	        var arg = _a.arg, variable = _a.variable;
	        if (newVariableDefinitions.find(function (newVarDef) { return newVarDef.variable.name.value === variable; })) {
	            return;
	        }
	        var argDef = rootField.args.find(function (rootArg) { return rootArg.name === arg; });
	        if (!argDef) {
	            throw new Error('Unexpected missing arg');
	        }
	        var typeName = typeToAst(argDef.type);
	        newVariableDefinitions.push({
	            kind: graphql_1__default.Kind.VARIABLE_DEFINITION,
	            variable: {
	                kind: graphql_1__default.Kind.VARIABLE,
	                name: {
	                    kind: graphql_1__default.Kind.NAME,
	                    value: variable,
	                },
	            },
	            type: typeName,
	        });
	    });
	    var _a = filterSelectionSetDeep(schema, fragmentReplacements, type, rootSelectionSet, fragments), selectionSet = _a.selectionSet, processedFragments = _a.fragments, usedVariables = _a.usedVariables;
	    var operationDefinition = {
	        kind: graphql_1__default.Kind.OPERATION_DEFINITION,
	        operation: operation,
	        variableDefinitions: (variableDefinitions || []).filter(function (variableDefinition) {
	            return usedVariables.indexOf(variableDefinition.variable.name.value) !== -1;
	        }).concat(newVariableDefinitions),
	        selectionSet: selectionSet,
	    };
	    var newDoc = {
	        kind: graphql_1__default.Kind.DOCUMENT,
	        definitions: [operationDefinition].concat(processedFragments),
	    };
	    return newDoc;
	}
	exports.createDocument = createDocument;
	function processRootField(selection, rootFieldName, rootField) {
	    var existingArguments = selection.arguments || [];
	    var existingArgumentNames = existingArguments.map(function (arg) { return arg.name.value; });
	    var allowedArguments = rootField.args.map(function (arg) { return arg.name; });
	    var missingArgumentNames = difference(allowedArguments, existingArgumentNames);
	    var extraArguments = difference(existingArgumentNames, allowedArguments);
	    var filteredExistingArguments = existingArguments.filter(function (arg) { return extraArguments.indexOf(arg.name.value) === -1; });
	    var variables = [];
	    var missingArguments = missingArgumentNames.map(function (name) {
	        // (XXX): really needs better var generation
	        var variableName = "_" + name;
	        variables.push({
	            arg: name,
	            variable: variableName,
	        });
	        return {
	            kind: graphql_1__default.Kind.ARGUMENT,
	            name: {
	                kind: graphql_1__default.Kind.NAME,
	                value: name,
	            },
	            value: {
	                kind: graphql_1__default.Kind.VARIABLE,
	                name: {
	                    kind: graphql_1__default.Kind.NAME,
	                    value: variableName,
	                },
	            },
	        };
	    });
	    return {
	        selection: {
	            kind: graphql_1__default.Kind.FIELD,
	            alias: null,
	            arguments: filteredExistingArguments.concat(missingArguments),
	            selectionSet: selection.selectionSet,
	            name: {
	                kind: graphql_1__default.Kind.NAME,
	                value: rootFieldName,
	            },
	        },
	        variables: variables,
	    };
	}
	function filterSelectionSetDeep(schema, fragmentReplacements, type, selectionSet, fragments) {
	    var validFragments = [];
	    Object.keys(fragments).forEach(function (fragmentName) {
	        var fragment = fragments[fragmentName];
	        var typeName = fragment.typeCondition.name.value;
	        var innerType = schema.getType(typeName);
	        if (innerType) {
	            validFragments.push(fragment);
	        }
	    });
	    var _a = filterSelectionSet(schema, fragmentReplacements, type, selectionSet, validFragments), newSelectionSet = _a.selectionSet, remainingFragments = _a.usedFragments, usedVariables = _a.usedVariables;
	    var newFragments = {};
	    // (XXX): So this will break if we have a fragment that only has link fields
	    while (remainingFragments.length > 0) {
	        var name_1 = remainingFragments.pop();
	        if (newFragments[name_1]) {
	            continue;
	        }
	        else {
	            var nextFragment = fragments[name_1];
	            if (!name_1) {
	                throw new Error("Could not find fragment " + name_1);
	            }
	            var typeName = nextFragment.typeCondition.name.value;
	            var innerType = schema.getType(typeName);
	            if (!innerType) {
	                continue;
	            }
	            var _b = filterSelectionSet(schema, fragmentReplacements, innerType, nextFragment.selectionSet, validFragments), fragmentSelectionSet = _b.selectionSet, fragmentUsedFragments = _b.usedFragments, fragmentUsedVariables = _b.usedVariables;
	            remainingFragments = union(remainingFragments, fragmentUsedFragments);
	            usedVariables = union(usedVariables, fragmentUsedVariables);
	            newFragments[name_1] = {
	                kind: graphql_1__default.Kind.FRAGMENT_DEFINITION,
	                name: {
	                    kind: graphql_1__default.Kind.NAME,
	                    value: name_1,
	                },
	                typeCondition: nextFragment.typeCondition,
	                selectionSet: fragmentSelectionSet,
	            };
	        }
	    }
	    var newFragmentValues = Object.keys(newFragments).map(function (name) { return newFragments[name]; });
	    return {
	        selectionSet: newSelectionSet,
	        fragments: newFragmentValues,
	        usedVariables: usedVariables,
	    };
	}
	function filterSelectionSet(schema, fragmentReplacements, type, selectionSet, validFragments) {
	    var usedFragments = [];
	    var usedVariables = [];
	    var typeStack = [type];
	    var filteredSelectionSet = graphql_1__default.visit(selectionSet, (_a = {},
	        _a[graphql_1__default.Kind.FIELD] = {
	            enter: function (node) {
	                var parentType = resolveType(typeStack[typeStack.length - 1]);
	                if (parentType instanceof graphql_1__default.GraphQLObjectType ||
	                    parentType instanceof graphql_1__default.GraphQLInterfaceType) {
	                    var fields = parentType.getFields();
	                    var field = node.name.value === '__typename'
	                        ? graphql_1__default.TypeNameMetaFieldDef
	                        : fields[node.name.value];
	                    if (!field) {
	                        return null;
	                    }
	                    else {
	                        typeStack.push(field.type);
	                    }
	                }
	                else if (parentType instanceof graphql_1__default.GraphQLUnionType &&
	                    node.name.value === '__typename') {
	                    typeStack.push(graphql_1__default.TypeNameMetaFieldDef.type);
	                }
	            },
	            leave: function () {
	                typeStack.pop();
	            },
	        },
	        _a[graphql_1__default.Kind.SELECTION_SET] = function (node) {
	            var parentType = resolveType(typeStack[typeStack.length - 1]);
	            var parentTypeName = parentType.name;
	            var selections = node.selections;
	            if ((parentType instanceof graphql_1__default.GraphQLInterfaceType ||
	                parentType instanceof graphql_1__default.GraphQLUnionType) &&
	                !selections.find(function (_) {
	                    return _.kind === graphql_1__default.Kind.FIELD &&
	                        _.name.value === '__typename';
	                })) {
	                selections = selections.concat({
	                    kind: graphql_1__default.Kind.FIELD,
	                    name: {
	                        kind: graphql_1__default.Kind.NAME,
	                        value: '__typename',
	                    },
	                });
	            }
	            if (fragmentReplacements[parentTypeName]) {
	                selections.forEach(function (selection) {
	                    if (selection.kind === graphql_1__default.Kind.FIELD) {
	                        var name_2 = selection.name.value;
	                        var fragment = fragmentReplacements[parentTypeName][name_2];
	                        if (fragment) {
	                            selections = selections.concat(fragment);
	                        }
	                    }
	                });
	            }
	            if (selections !== node.selections) {
	                return __assign({}, node, { selections: selections });
	            }
	        },
	        _a[graphql_1__default.Kind.FRAGMENT_SPREAD] = function (node) {
	            var fragmentFiltered = validFragments.filter(function (frg) { return frg.name.value === node.name.value; });
	            var fragment = fragmentFiltered[0];
	            if (fragment) {
	                if (fragment.typeCondition) {
	                    var innerType = schema.getType(fragment.typeCondition.name.value);
	                    var parentType = resolveType(typeStack[typeStack.length - 1]);
	                    if (!implementsAbstractType(parentType, innerType)) {
	                        return null;
	                    }
	                }
	                usedFragments.push(node.name.value);
	                return;
	            }
	            else {
	                return null;
	            }
	        },
	        _a[graphql_1__default.Kind.INLINE_FRAGMENT] = {
	            enter: function (node) {
	                if (node.typeCondition) {
	                    var innerType = schema.getType(node.typeCondition.name.value);
	                    var parentType = resolveType(typeStack[typeStack.length - 1]);
	                    if (implementsAbstractType(parentType, innerType)) {
	                        typeStack.push(innerType);
	                    }
	                    else {
	                        return null;
	                    }
	                }
	            },
	            leave: function (node) {
	                if (node.typeCondition) {
	                    var innerType = schema.getType(node.typeCondition.name.value);
	                    if (innerType) {
	                        typeStack.pop();
	                    }
	                    else {
	                        return null;
	                    }
	                }
	            },
	        },
	        _a[graphql_1__default.Kind.VARIABLE] = function (node) {
	            usedVariables.push(node.name.value);
	        },
	        _a));
	    return {
	        selectionSet: filteredSelectionSet,
	        usedFragments: usedFragments,
	        usedVariables: usedVariables,
	    };
	    var _a;
	}
	function resolveType(type) {
	    var lastType = type;
	    while (lastType instanceof graphql_1__default.GraphQLNonNull ||
	        lastType instanceof graphql_1__default.GraphQLList) {
	        lastType = lastType.ofType;
	    }
	    return lastType;
	}
	function implementsAbstractType(parent, child, bail) {
	    if (bail === void 0) { bail = false; }
	    if (parent === child) {
	        return true;
	    }
	    else if (parent instanceof graphql_1__default.GraphQLInterfaceType &&
	        child instanceof graphql_1__default.GraphQLObjectType) {
	        return child.getInterfaces().indexOf(parent) !== -1;
	    }
	    else if (parent instanceof graphql_1__default.GraphQLInterfaceType &&
	        child instanceof graphql_1__default.GraphQLInterfaceType) {
	        return true;
	    }
	    else if (parent instanceof graphql_1__default.GraphQLUnionType &&
	        child instanceof graphql_1__default.GraphQLObjectType) {
	        return parent.getTypes().indexOf(child) !== -1;
	    }
	    else if (parent instanceof graphql_1__default.GraphQLObjectType && !bail) {
	        return implementsAbstractType(child, parent, true);
	    }
	    return false;
	}
	function typeToAst(type) {
	    if (type instanceof graphql_1__default.GraphQLNonNull) {
	        var innerType = typeToAst(type.ofType);
	        if (innerType.kind === graphql_1__default.Kind.LIST_TYPE ||
	            innerType.kind === graphql_1__default.Kind.NAMED_TYPE) {
	            return {
	                kind: graphql_1__default.Kind.NON_NULL_TYPE,
	                type: innerType,
	            };
	        }
	        else {
	            throw new Error('Incorrent inner non-null type');
	        }
	    }
	    else if (type instanceof graphql_1__default.GraphQLList) {
	        return {
	            kind: graphql_1__default.Kind.LIST_TYPE,
	            type: typeToAst(type.ofType),
	        };
	    }
	    else {
	        return {
	            kind: graphql_1__default.Kind.NAMED_TYPE,
	            name: {
	                kind: graphql_1__default.Kind.NAME,
	                value: type.toString(),
	            },
	        };
	    }
	}
	function union() {
	    var arrays = [];
	    for (var _i = 0; _i < arguments.length; _i++) {
	        arrays[_i] = arguments[_i];
	    }
	    var cache = {};
	    var result = [];
	    arrays.forEach(function (array) {
	        array.forEach(function (item) {
	            if (!cache[item]) {
	                cache[item] = true;
	                result.push(item);
	            }
	        });
	    });
	    return result;
	}
	function difference(from) {
	    var arrays = [];
	    for (var _i = 1; _i < arguments.length; _i++) {
	        arrays[_i - 1] = arguments[_i];
	    }
	    var cache = {};
	    arrays.forEach(function (array) {
	        array.forEach(function (item) {
	            cache[item] = true;
	        });
	    });
	    return from.filter(function (item) { return !cache[item]; });
	}

	});

	unwrapExports(delegateToSchema_1);
	var delegateToSchema_2 = delegateToSchema_1.createDocument;

	var typeFromAST_1 = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	//
	// TODO put back import once PR is merged
	// https://github.com/graphql/graphql-js/pull/1165
	// import { getDescription } from 'graphql/utilities/buildASTSchema';
	var backcompatOptions = { commentDescriptions: true };

	function typeFromAST(typeRegistry, node) {
	    switch (node.kind) {
	        case graphql_1__default.Kind.OBJECT_TYPE_DEFINITION:
	            return makeObjectType(typeRegistry, node);
	        case graphql_1__default.Kind.INTERFACE_TYPE_DEFINITION:
	            return makeInterfaceType(typeRegistry, node);
	        case graphql_1__default.Kind.ENUM_TYPE_DEFINITION:
	            return makeEnumType(typeRegistry, node);
	        case graphql_1__default.Kind.UNION_TYPE_DEFINITION:
	            return makeUnionType(typeRegistry, node);
	        case graphql_1__default.Kind.SCALAR_TYPE_DEFINITION:
	            return makeScalarType(typeRegistry, node);
	        case graphql_1__default.Kind.INPUT_OBJECT_TYPE_DEFINITION:
	            return makeInputObjectType(typeRegistry, node);
	        default:
	            return null;
	    }
	}
	exports.default = typeFromAST;
	function makeObjectType(typeRegistry, node) {
	    return new graphql_1__default.GraphQLObjectType({
	        name: node.name.value,
	        fields: function () { return makeFields(typeRegistry, node.fields); },
	        interfaces: function () {
	            return node.interfaces.map(function (iface) { return typeRegistry.getType(iface.name.value); });
	        },
	        description: getDescription(node, backcompatOptions),
	    });
	}
	function makeInterfaceType(typeRegistry, node) {
	    return new graphql_1__default.GraphQLInterfaceType({
	        name: node.name.value,
	        fields: function () { return makeFields(typeRegistry, node.fields); },
	        description: getDescription(node, backcompatOptions),
	        resolveType: function (parent, context, info) {
	            return resolveFromParentTypename_1.default(parent, info.schema);
	        },
	    });
	}
	function makeEnumType(typeRegistry, node) {
	    var values$$1 = {};
	    node.values.forEach(function (value) {
	        values$$1[value.name.value] = {
	            description: getDescription(value, backcompatOptions),
	        };
	    });
	    return new graphql_1__default.GraphQLEnumType({
	        name: node.name.value,
	        values: values$$1,
	        description: getDescription(node, backcompatOptions),
	    });
	}
	function makeUnionType(typeRegistry, node) {
	    return new graphql_1__default.GraphQLUnionType({
	        name: node.name.value,
	        types: function () {
	            return node.types.map(function (type) { return resolveType(typeRegistry, type); });
	        },
	        description: getDescription(node, backcompatOptions),
	        resolveType: function (parent, context, info) {
	            return resolveFromParentTypename_1.default(parent, info.schema);
	        },
	    });
	}
	function makeScalarType(typeRegistry, node) {
	    return new graphql_1__default.GraphQLScalarType({
	        name: node.name.value,
	        description: getDescription(node, backcompatOptions),
	        serialize: function () { return null; },
	        // Note: validation calls the parse functions to determine if a
	        // literal value is correct. Returning null would cause use of custom
	        // scalars to always fail validation. Returning false causes them to
	        // always pass validation.
	        parseValue: function () { return false; },
	        parseLiteral: function () { return false; },
	    });
	}
	function makeInputObjectType(typeRegistry, node) {
	    return new graphql_1__default.GraphQLInputObjectType({
	        name: node.name.value,
	        fields: function () { return makeValues(typeRegistry, node.fields); },
	        description: getDescription(node, backcompatOptions),
	    });
	}
	function makeFields(typeRegistry, nodes) {
	    var result = {};
	    nodes.forEach(function (node) {
	        result[node.name.value] = {
	            type: resolveType(typeRegistry, node.type),
	            args: makeValues(typeRegistry, node.arguments),
	            description: getDescription(node, backcompatOptions),
	        };
	    });
	    return result;
	}
	function makeValues(typeRegistry, nodes) {
	    var result = {};
	    nodes.forEach(function (node) {
	        var type = resolveType(typeRegistry, node.type);
	        result[node.name.value] = {
	            type: type,
	            defaultValue: graphql_1__default.valueFromAST(node.defaultValue, type),
	            description: getDescription(node, backcompatOptions),
	        };
	    });
	    return result;
	}
	function resolveType(typeRegistry, node) {
	    switch (node.kind) {
	        case graphql_1__default.Kind.LIST_TYPE:
	            return new graphql_1__default.GraphQLList(resolveType(typeRegistry, node.type));
	        case graphql_1__default.Kind.NON_NULL_TYPE:
	            return new graphql_1__default.GraphQLNonNull(resolveType(typeRegistry, node.type));
	        default:
	            return typeRegistry.getType(node.name.value);
	    }
	}
	// Code below temporarily copied from graphql/graphql-js pending PR
	// https://github.com/graphql/graphql-js/pull/1165
	// MIT License
	// Copyright (c) 2015-present, Facebook, Inc.
	// Permission is hereby granted, free of charge, to any person obtaining a copy
	// of this software and associated documentation files (the "Software"), to deal
	// in the Software without restriction, including without limitation the rights
	// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	// copies of the Software, and to permit persons to whom the Software is
	// furnished to do so, subject to the following conditions:
	// The above copyright notice and this permission notice shall be included in all
	// copies or substantial portions of the Software.
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	// SOFTWARE.
	function getDescription(node, options) {
	    if (node.description) {
	        return node.description.value;
	    }
	    if (options && options.commentDescriptions) {
	        var rawValue = getLeadingCommentBlock(node);
	        if (rawValue !== undefined) {
	            return blockStringValue('\n' + rawValue);
	        }
	    }
	}
	function getLeadingCommentBlock(node) {
	    var loc = node.loc;
	    if (!loc) {
	        return;
	    }
	    var comments = [];
	    var token = loc.startToken.prev;
	    while (token &&
	        token.kind === 'Comment' &&
	        token.next &&
	        token.prev &&
	        token.line + 1 === token.next.line &&
	        token.line !== token.prev.line) {
	        var value = String(token.value);
	        comments.push(value);
	        token = token.prev;
	    }
	    return comments.reverse().join('\n');
	}
	/**
	 * Produces the value of a block string from its parsed raw value, similar to
	 * Coffeescript's block string, Python's docstring trim or Ruby's strip_heredoc.
	 *
	 * This implements the GraphQL spec's BlockStringValue() static algorithm.
	 */
	function blockStringValue(rawString) {
	    // Expand a block string's raw value into independent lines.
	    var lines = rawString.split(/\r\n|[\n\r]/g);
	    // Remove common indentation from all lines but first.
	    var commonIndent = null;
	    for (var i = 1; i < lines.length; i++) {
	        var line = lines[i];
	        var indent = leadingWhitespace(line);
	        if (indent < line.length &&
	            (commonIndent === null || indent < commonIndent)) {
	            commonIndent = indent;
	            if (commonIndent === 0) {
	                break;
	            }
	        }
	    }
	    if (commonIndent) {
	        for (var i = 1; i < lines.length; i++) {
	            lines[i] = lines[i].slice(commonIndent);
	        }
	    }
	    // Remove leading and trailing blank lines.
	    while (lines.length > 0 && isBlank(lines[0])) {
	        lines.shift();
	    }
	    while (lines.length > 0 && isBlank(lines[lines.length - 1])) {
	        lines.pop();
	    }
	    // Return a string of the lines joined with U+000A.
	    return lines.join('\n');
	}
	function leadingWhitespace(str) {
	    var i = 0;
	    while (i < str.length && (str[i] === ' ' || str[i] === '\t')) {
	        i++;
	    }
	    return i;
	}
	function isBlank(str) {
	    return leadingWhitespace(str) === str.length;
	}

	});

	unwrapExports(typeFromAST_1);

	var mergeSchemas_1 = createCommonjsModule(function (module, exports) {
	var __assign = (commonjsGlobal && commonjsGlobal.__assign) || Object.assign || function(t) {
	    for (var s, i = 1, n = arguments.length; i < n; i++) {
	        s = arguments[i];
	        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
	            t[p] = s[p];
	    }
	    return t;
	};
	Object.defineProperty(exports, "__esModule", { value: true });








	var backcompatOptions = { commentDescriptions: true };
	function mergeSchemas(_a) {
	    var schemas = _a.schemas, onTypeConflict = _a.onTypeConflict, resolvers = _a.resolvers;
	    if (!onTypeConflict) {
	        onTypeConflict = defaultOnTypeConflict;
	    }
	    var queryFields = {};
	    var mutationFields = {};
	    var subscriptionFields = {};
	    var typeRegistry = new TypeRegistry_1.default();
	    var resolveType = schemaRecreation.createResolveType(function (name) {
	        return typeRegistry.getType(name);
	    });
	    var mergeInfo = createMergeInfo(typeRegistry);
	    var actualSchemas = [];
	    var typeFragments = [];
	    var extensions = [];
	    var fullResolvers = {};
	    schemas.forEach(function (schema) {
	        if (schema instanceof graphql_1__default.GraphQLSchema) {
	            actualSchemas.push(schema);
	        }
	        else if (typeof schema === 'string') {
	            var parsedSchemaDocument = graphql_1__default.parse(schema);
	            try {
	                // TODO fix types https://github.com/apollographql/graphql-tools/issues/542
	                var actualSchema = graphql_1__default.buildASTSchema(parsedSchemaDocument, backcompatOptions);
	                if (actualSchema.getQueryType()) {
	                    actualSchemas.push(actualSchema);
	                }
	            }
	            catch (e) {
	                typeFragments.push(parsedSchemaDocument);
	            }
	            parsedSchemaDocument = schemaGenerator.extractExtensionDefinitions(parsedSchemaDocument);
	            if (parsedSchemaDocument.definitions.length > 0) {
	                extensions.push(parsedSchemaDocument);
	            }
	        }
	    });
	    actualSchemas.forEach(function (schema) {
	        typeRegistry.addSchema(schema);
	        var queryType = schema.getQueryType();
	        var mutationType = schema.getMutationType();
	        var subscriptionType = schema.getSubscriptionType();
	        var typeMap = schema.getTypeMap();
	        Object.keys(typeMap).forEach(function (typeName) {
	            var type = typeMap[typeName];
	            if (graphql_1__default.isNamedType(type) &&
	                graphql_1__default.getNamedType(type).name.slice(0, 2) !== '__' &&
	                type !== queryType &&
	                type !== mutationType &&
	                type !== subscriptionType) {
	                var newType = schemaRecreation.recreateType(type, resolveType);
	                typeRegistry.addType(newType.name, newType, onTypeConflict);
	            }
	        });
	        Object.keys(queryType.getFields()).forEach(function (name) {
	            if (!fullResolvers.Query) {
	                fullResolvers.Query = {};
	            }
	            fullResolvers.Query[name] = createDelegatingResolver(mergeInfo, 'query', name);
	        });
	        queryFields = __assign({}, queryFields, queryType.getFields());
	        if (mutationType) {
	            if (!fullResolvers.Mutation) {
	                fullResolvers.Mutation = {};
	            }
	            Object.keys(mutationType.getFields()).forEach(function (name) {
	                fullResolvers.Mutation[name] = createDelegatingResolver(mergeInfo, 'mutation', name);
	            });
	            mutationFields = __assign({}, mutationFields, mutationType.getFields());
	        }
	        if (subscriptionType) {
	            if (!fullResolvers.Subscription) {
	                fullResolvers.Subscription = {};
	            }
	            Object.keys(subscriptionType.getFields()).forEach(function (name) {
	                fullResolvers.Subscription[name] = {
	                    subscribe: createDelegatingResolver(mergeInfo, 'subscription', name),
	                };
	            });
	            subscriptionFields = __assign({}, subscriptionFields, subscriptionType.getFields());
	        }
	    });
	    typeFragments.forEach(function (document) {
	        document.definitions.forEach(function (def) {
	            var type = typeFromAST_1.default(typeRegistry, def);
	            if (type) {
	                typeRegistry.addType(type.name, type, onTypeConflict);
	            }
	        });
	    });
	    var passedResolvers = {};
	    if (resolvers) {
	        if (typeof resolvers === 'function') {
	            passedResolvers = resolvers(mergeInfo);
	        }
	        else if (Array.isArray(resolvers)) {
	            passedResolvers = resolvers
	                .map(function (resolver) {
	                return typeof resolver === 'function' ? resolver(mergeInfo) : resolver;
	            })
	                .reduce(mergeDeep_1.default, {});
	        }
	        else {
	            passedResolvers = __assign({}, resolvers);
	        }
	    }
	    Object.keys(passedResolvers).forEach(function (typeName) {
	        var type = passedResolvers[typeName];
	        if (type instanceof graphql_1__default.GraphQLScalarType) {
	            return;
	        }
	        Object.keys(type).forEach(function (fieldName) {
	            var field = type[fieldName];
	            if (field.fragment) {
	                typeRegistry.addFragment(typeName, fieldName, field.fragment);
	            }
	        });
	    });
	    fullResolvers = mergeDeep_1.default(fullResolvers, passedResolvers);
	    var query = new graphql_1__default.GraphQLObjectType({
	        name: 'Query',
	        fields: function () { return schemaRecreation.fieldMapToFieldConfigMap(queryFields, resolveType); },
	    });
	    var mutation;
	    if (!isEmptyObject_1.default(mutationFields)) {
	        mutation = new graphql_1__default.GraphQLObjectType({
	            name: 'Mutation',
	            fields: function () { return schemaRecreation.fieldMapToFieldConfigMap(mutationFields, resolveType); },
	        });
	    }
	    var subscription;
	    if (!isEmptyObject_1.default(subscriptionFields)) {
	        subscription = new graphql_1__default.GraphQLObjectType({
	            name: 'Subscription',
	            fields: function () { return schemaRecreation.fieldMapToFieldConfigMap(subscriptionFields, resolveType); },
	        });
	    }
	    typeRegistry.addType('Query', query);
	    typeRegistry.addType('Mutation', mutation);
	    typeRegistry.addType('Subscription', subscription);
	    var mergedSchema = new graphql_1__default.GraphQLSchema({
	        query: query,
	        mutation: mutation,
	        subscription: subscription,
	        types: typeRegistry.getAllTypes(),
	    });
	    extensions.forEach(function (extension) {
	        // TODO fix types https://github.com/apollographql/graphql-tools/issues/542
	        mergedSchema = graphql_1__default.extendSchema(mergedSchema, extension, backcompatOptions);
	    });
	    schemaGenerator.addResolveFunctionsToSchema(mergedSchema, fullResolvers);
	    forEachField(mergedSchema, function (field) {
	        if (field.resolve) {
	            var fieldResolver_1 = field.resolve;
	            field.resolve = function (parent, args, context, info) {
	                var newInfo = __assign({}, info, { mergeInfo: mergeInfo });
	                return fieldResolver_1(parent, args, context, newInfo);
	            };
	        }
	    });
	    return mergedSchema;
	}
	exports.default = mergeSchemas;
	function defaultOnTypeConflict(left, right) {
	    return left;
	}
	function createMergeInfo(typeRegistry) {
	    return {
	        delegate: function (operation, fieldName, args, context, info) {
	            var schema = typeRegistry.getSchemaByField(operation, fieldName);
	            if (!schema) {
	                throw new Error("Cannot find subschema for root field " + operation + "." + fieldName);
	            }
	            var fragmentReplacements = typeRegistry.fragmentReplacements;
	            return delegateToSchema_1.default(schema, fragmentReplacements, operation, fieldName, args, context, info);
	        },
	    };
	}
	function createDelegatingResolver(mergeInfo, operation, fieldName) {
	    return function (root, args, context, info) {
	        return mergeInfo.delegate(operation, fieldName, args, context, info);
	    };
	}
	function forEachField(schema, fn) {
	    var typeMap = schema.getTypeMap();
	    Object.keys(typeMap).forEach(function (typeName) {
	        var type = typeMap[typeName];
	        if (!graphql_1__default.getNamedType(type).name.startsWith('__') &&
	            type instanceof graphql_1__default.GraphQLObjectType) {
	            var fields_1 = type.getFields();
	            Object.keys(fields_1).forEach(function (fieldName) {
	                var field = fields_1[fieldName];
	                fn(field, typeName, fieldName);
	            });
	        }
	    });
	}

	});

	unwrapExports(mergeSchemas_1);

	var stitching = createCommonjsModule(function (module, exports) {
	Object.defineProperty(exports, "__esModule", { value: true });

	exports.makeRemoteExecutableSchema = makeRemoteExecutableSchema_1.default;

	exports.introspectSchema = introspectSchema_1.default;

	exports.mergeSchemas = mergeSchemas_1.default;

	exports.delegateToSchema = delegateToSchema_1.default;
	exports.createDocument = delegateToSchema_1.createDocument;

	exports.defaultMergedResolver = defaultMergedResolver_1.default;

	});

	unwrapExports(stitching);
	var stitching_1 = stitching.makeRemoteExecutableSchema;
	var stitching_2 = stitching.introspectSchema;
	var stitching_3 = stitching.mergeSchemas;
	var stitching_4 = stitching.delegateToSchema;
	var stitching_5 = stitching.createDocument;
	var stitching_6 = stitching.defaultMergedResolver;

	var dist$1 = createCommonjsModule(function (module, exports) {
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	__export(schemaGenerator);
	__export(mock);
	__export(stitching);
	__export(schemaVisitor);

	});

	unwrapExports(dist$1);
	var dist_1$1 = dist$1.SchemaDirectiveVisitor;
	var dist_2$1 = dist$1.makeExecutableSchema;
	var dist_3$1 = dist$1.addResolveFunctionsToSchema;

	var lib$1 = createCommonjsModule(function (module, exports) {

	exports.__esModule = true;





	function identity(value) {
	  return value;
	}

	function parseLiteral(ast, variables) {
	  switch (ast.kind) {
	    case language.Kind.STRING:
	    case language.Kind.BOOLEAN:
	      return ast.value;
	    case language.Kind.INT:
	    case language.Kind.FLOAT:
	      return parseFloat(ast.value);
	    case language.Kind.OBJECT:
	      {
	        var value = Object.create(null);
	        ast.fields.forEach(function (field) {
	          value[field.name.value] = parseLiteral(field.value, variables);
	        });

	        return value;
	      }
	    case language.Kind.LIST:
	      return ast.values.map(function (n) {
	        return parseLiteral(n, variables);
	      });
	    case language.Kind.NULL:
	      return null;
	    case language.Kind.VARIABLE:
	      {
	        var name = ast.name.value;
	        return variables ? variables[name] : undefined;
	      }
	    default:
	      return undefined;
	  }
	}

	exports.default = new graphql_1__default.GraphQLScalarType({
	  name: 'JSON',
	  description: 'The `JSON` scalar type represents JSON values as specified by ' + '[ECMA-404](http://www.ecma-international.org/' + 'publications/files/ECMA-ST/ECMA-404.pdf).',
	  serialize: identity,
	  parseValue: identity,
	  parseLiteral: parseLiteral
	});
	module.exports = exports['default'];
	});

	var GraphQLJSON = unwrapExports(lib$1);
	var lib_1 = lib$1.GraphQLJSON;

	/*! *****************************************************************************
	Copyright (c) Microsoft Corporation. All rights reserved.
	Licensed under the Apache License, Version 2.0 (the "License"); you may not use
	this file except in compliance with the License. You may obtain a copy of the
	License at http://www.apache.org/licenses/LICENSE-2.0

	THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
	KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
	WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
	MERCHANTABLITY OR NON-INFRINGEMENT.

	See the Apache Version 2.0 License for specific language governing permissions
	and limitations under the License.
	***************************************************************************** */

	function __awaiter(thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	}

	var pluralize = createCommonjsModule(function (module, exports) {
	/* global define */

	(function (root, pluralize) {
	  /* istanbul ignore else */
	  if (typeof commonjsRequire === 'function' && 'object' === 'object' && 'object' === 'object') {
	    // Node.
	    module.exports = pluralize();
	  } else if (typeof undefined === 'function' && undefined.amd) {
	    // AMD, registers as an anonymous module.
	    undefined(function () {
	      return pluralize();
	    });
	  } else {
	    // Browser global.
	    root.pluralize = pluralize();
	  }
	})(commonjsGlobal, function () {
	  // Rule storage - pluralize and singularize need to be run sequentially,
	  // while other rules can be optimized using an object for instant lookups.
	  var pluralRules = [];
	  var singularRules = [];
	  var uncountables = {};
	  var irregularPlurals = {};
	  var irregularSingles = {};

	  /**
	   * Sanitize a pluralization rule to a usable regular expression.
	   *
	   * @param  {(RegExp|string)} rule
	   * @return {RegExp}
	   */
	  function sanitizeRule (rule) {
	    if (typeof rule === 'string') {
	      return new RegExp('^' + rule + '$', 'i');
	    }

	    return rule;
	  }

	  /**
	   * Pass in a word token to produce a function that can replicate the case on
	   * another word.
	   *
	   * @param  {string}   word
	   * @param  {string}   token
	   * @return {Function}
	   */
	  function restoreCase (word, token) {
	    // Tokens are an exact match.
	    if (word === token) return token;

	    // Upper cased words. E.g. "HELLO".
	    if (word === word.toUpperCase()) return token.toUpperCase();

	    // Title cased words. E.g. "Title".
	    if (word[0] === word[0].toUpperCase()) {
	      return token.charAt(0).toUpperCase() + token.substr(1).toLowerCase();
	    }

	    // Lower cased words. E.g. "test".
	    return token.toLowerCase();
	  }

	  /**
	   * Interpolate a regexp string.
	   *
	   * @param  {string} str
	   * @param  {Array}  args
	   * @return {string}
	   */
	  function interpolate (str, args) {
	    return str.replace(/\$(\d{1,2})/g, function (match, index) {
	      return args[index] || '';
	    });
	  }

	  /**
	   * Replace a word using a rule.
	   *
	   * @param  {string} word
	   * @param  {Array}  rule
	   * @return {string}
	   */
	  function replace (word, rule) {
	    return word.replace(rule[0], function (match, index) {
	      var result = interpolate(rule[1], arguments);

	      if (match === '') {
	        return restoreCase(word[index - 1], result);
	      }

	      return restoreCase(match, result);
	    });
	  }

	  /**
	   * Sanitize a word by passing in the word and sanitization rules.
	   *
	   * @param  {string}   token
	   * @param  {string}   word
	   * @param  {Array}    rules
	   * @return {string}
	   */
	  function sanitizeWord (token, word, rules) {
	    // Empty string or doesn't need fixing.
	    if (!token.length || uncountables.hasOwnProperty(token)) {
	      return word;
	    }

	    var len = rules.length;

	    // Iterate over the sanitization rules and use the first one to match.
	    while (len--) {
	      var rule = rules[len];

	      if (rule[0].test(word)) return replace(word, rule);
	    }

	    return word;
	  }

	  /**
	   * Replace a word with the updated word.
	   *
	   * @param  {Object}   replaceMap
	   * @param  {Object}   keepMap
	   * @param  {Array}    rules
	   * @return {Function}
	   */
	  function replaceWord (replaceMap, keepMap, rules) {
	    return function (word) {
	      // Get the correct token and case restoration functions.
	      var token = word.toLowerCase();

	      // Check against the keep object map.
	      if (keepMap.hasOwnProperty(token)) {
	        return restoreCase(word, token);
	      }

	      // Check against the replacement map for a direct word replacement.
	      if (replaceMap.hasOwnProperty(token)) {
	        return restoreCase(word, replaceMap[token]);
	      }

	      // Run all the rules against the word.
	      return sanitizeWord(token, word, rules);
	    };
	  }

	  /**
	   * Check if a word is part of the map.
	   */
	  function checkWord (replaceMap, keepMap, rules, bool) {
	    return function (word) {
	      var token = word.toLowerCase();

	      if (keepMap.hasOwnProperty(token)) return true;
	      if (replaceMap.hasOwnProperty(token)) return false;

	      return sanitizeWord(token, token, rules) === token;
	    };
	  }

	  /**
	   * Pluralize or singularize a word based on the passed in count.
	   *
	   * @param  {string}  word
	   * @param  {number}  count
	   * @param  {boolean} inclusive
	   * @return {string}
	   */
	  function pluralize (word, count, inclusive) {
	    var pluralized = count === 1
	      ? pluralize.singular(word) : pluralize.plural(word);

	    return (inclusive ? count + ' ' : '') + pluralized;
	  }

	  /**
	   * Pluralize a word.
	   *
	   * @type {Function}
	   */
	  pluralize.plural = replaceWord(
	    irregularSingles, irregularPlurals, pluralRules
	  );

	  /**
	   * Check if a word is plural.
	   *
	   * @type {Function}
	   */
	  pluralize.isPlural = checkWord(
	    irregularSingles, irregularPlurals, pluralRules
	  );

	  /**
	   * Singularize a word.
	   *
	   * @type {Function}
	   */
	  pluralize.singular = replaceWord(
	    irregularPlurals, irregularSingles, singularRules
	  );

	  /**
	   * Check if a word is singular.
	   *
	   * @type {Function}
	   */
	  pluralize.isSingular = checkWord(
	    irregularPlurals, irregularSingles, singularRules
	  );

	  /**
	   * Add a pluralization rule to the collection.
	   *
	   * @param {(string|RegExp)} rule
	   * @param {string}          replacement
	   */
	  pluralize.addPluralRule = function (rule, replacement) {
	    pluralRules.push([sanitizeRule(rule), replacement]);
	  };

	  /**
	   * Add a singularization rule to the collection.
	   *
	   * @param {(string|RegExp)} rule
	   * @param {string}          replacement
	   */
	  pluralize.addSingularRule = function (rule, replacement) {
	    singularRules.push([sanitizeRule(rule), replacement]);
	  };

	  /**
	   * Add an uncountable word rule.
	   *
	   * @param {(string|RegExp)} word
	   */
	  pluralize.addUncountableRule = function (word) {
	    if (typeof word === 'string') {
	      uncountables[word.toLowerCase()] = true;
	      return;
	    }

	    // Set singular and plural references for the word.
	    pluralize.addPluralRule(word, '$0');
	    pluralize.addSingularRule(word, '$0');
	  };

	  /**
	   * Add an irregular word definition.
	   *
	   * @param {string} single
	   * @param {string} plural
	   */
	  pluralize.addIrregularRule = function (single, plural) {
	    plural = plural.toLowerCase();
	    single = single.toLowerCase();

	    irregularSingles[single] = plural;
	    irregularPlurals[plural] = single;
	  };

	  /**
	   * Irregular rules.
	   */
	  [
	    // Pronouns.
	    ['I', 'we'],
	    ['me', 'us'],
	    ['he', 'they'],
	    ['she', 'they'],
	    ['them', 'them'],
	    ['myself', 'ourselves'],
	    ['yourself', 'yourselves'],
	    ['itself', 'themselves'],
	    ['herself', 'themselves'],
	    ['himself', 'themselves'],
	    ['themself', 'themselves'],
	    ['is', 'are'],
	    ['was', 'were'],
	    ['has', 'have'],
	    ['this', 'these'],
	    ['that', 'those'],
	    // Words ending in with a consonant and `o`.
	    ['echo', 'echoes'],
	    ['dingo', 'dingoes'],
	    ['volcano', 'volcanoes'],
	    ['tornado', 'tornadoes'],
	    ['torpedo', 'torpedoes'],
	    // Ends with `us`.
	    ['genus', 'genera'],
	    ['viscus', 'viscera'],
	    // Ends with `ma`.
	    ['stigma', 'stigmata'],
	    ['stoma', 'stomata'],
	    ['dogma', 'dogmata'],
	    ['lemma', 'lemmata'],
	    ['schema', 'schemata'],
	    ['anathema', 'anathemata'],
	    // Other irregular rules.
	    ['ox', 'oxen'],
	    ['axe', 'axes'],
	    ['die', 'dice'],
	    ['yes', 'yeses'],
	    ['foot', 'feet'],
	    ['eave', 'eaves'],
	    ['goose', 'geese'],
	    ['tooth', 'teeth'],
	    ['quiz', 'quizzes'],
	    ['human', 'humans'],
	    ['proof', 'proofs'],
	    ['carve', 'carves'],
	    ['valve', 'valves'],
	    ['looey', 'looies'],
	    ['thief', 'thieves'],
	    ['groove', 'grooves'],
	    ['pickaxe', 'pickaxes'],
	    ['whiskey', 'whiskies']
	  ].forEach(function (rule) {
	    return pluralize.addIrregularRule(rule[0], rule[1]);
	  });

	  /**
	   * Pluralization rules.
	   */
	  [
	    [/s?$/i, 's'],
	    [/[^\u0000-\u007F]$/i, '$0'],
	    [/([^aeiou]ese)$/i, '$1'],
	    [/(ax|test)is$/i, '$1es'],
	    [/(alias|[^aou]us|tlas|gas|ris)$/i, '$1es'],
	    [/(e[mn]u)s?$/i, '$1s'],
	    [/([^l]ias|[aeiou]las|[emjzr]as|[iu]am)$/i, '$1'],
	    [/(alumn|syllab|octop|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1i'],
	    [/(alumn|alg|vertebr)(?:a|ae)$/i, '$1ae'],
	    [/(seraph|cherub)(?:im)?$/i, '$1im'],
	    [/(her|at|gr)o$/i, '$1oes'],
	    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|automat|quor)(?:a|um)$/i, '$1a'],
	    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)(?:a|on)$/i, '$1a'],
	    [/sis$/i, 'ses'],
	    [/(?:(kni|wi|li)fe|(ar|l|ea|eo|oa|hoo)f)$/i, '$1$2ves'],
	    [/([^aeiouy]|qu)y$/i, '$1ies'],
	    [/([^ch][ieo][ln])ey$/i, '$1ies'],
	    [/(x|ch|ss|sh|zz)$/i, '$1es'],
	    [/(matr|cod|mur|sil|vert|ind|append)(?:ix|ex)$/i, '$1ices'],
	    [/(m|l)(?:ice|ouse)$/i, '$1ice'],
	    [/(pe)(?:rson|ople)$/i, '$1ople'],
	    [/(child)(?:ren)?$/i, '$1ren'],
	    [/eaux$/i, '$0'],
	    [/m[ae]n$/i, 'men'],
	    ['thou', 'you']
	  ].forEach(function (rule) {
	    return pluralize.addPluralRule(rule[0], rule[1]);
	  });

	  /**
	   * Singularization rules.
	   */
	  [
	    [/s$/i, ''],
	    [/(ss)$/i, '$1'],
	    [/(wi|kni|(?:after|half|high|low|mid|non|night|[^\w]|^)li)ves$/i, '$1fe'],
	    [/(ar|(?:wo|[ae])l|[eo][ao])ves$/i, '$1f'],
	    [/ies$/i, 'y'],
	    [/\b([pl]|zomb|(?:neck|cross)?t|coll|faer|food|gen|goon|group|lass|talk|goal|cut)ies$/i, '$1ie'],
	    [/\b(mon|smil)ies$/i, '$1ey'],
	    [/(m|l)ice$/i, '$1ouse'],
	    [/(seraph|cherub)im$/i, '$1'],
	    [/(x|ch|ss|sh|zz|tto|go|cho|alias|[^aou]us|tlas|gas|(?:her|at|gr)o|ris)(?:es)?$/i, '$1'],
	    [/(analy|ba|diagno|parenthe|progno|synop|the|empha|cri)(?:sis|ses)$/i, '$1sis'],
	    [/(movie|twelve|abuse|e[mn]u)s$/i, '$1'],
	    [/(test)(?:is|es)$/i, '$1is'],
	    [/(alumn|syllab|octop|vir|radi|nucle|fung|cact|stimul|termin|bacill|foc|uter|loc|strat)(?:us|i)$/i, '$1us'],
	    [/(agend|addend|millenni|dat|extrem|bacteri|desiderat|strat|candelabr|errat|ov|symposi|curricul|quor)a$/i, '$1um'],
	    [/(apheli|hyperbat|periheli|asyndet|noumen|phenomen|criteri|organ|prolegomen|hedr|automat)a$/i, '$1on'],
	    [/(alumn|alg|vertebr)ae$/i, '$1a'],
	    [/(cod|mur|sil|vert|ind)ices$/i, '$1ex'],
	    [/(matr|append)ices$/i, '$1ix'],
	    [/(pe)(rson|ople)$/i, '$1rson'],
	    [/(child)ren$/i, '$1'],
	    [/(eau)x?$/i, '$1'],
	    [/men$/i, 'man']
	  ].forEach(function (rule) {
	    return pluralize.addSingularRule(rule[0], rule[1]);
	  });

	  /**
	   * Uncountable rules.
	   */
	  [
	    // Singular words with no plurals.
	    'adulthood',
	    'advice',
	    'agenda',
	    'aid',
	    'alcohol',
	    'ammo',
	    'anime',
	    'athletics',
	    'audio',
	    'bison',
	    'blood',
	    'bream',
	    'buffalo',
	    'butter',
	    'carp',
	    'cash',
	    'chassis',
	    'chess',
	    'clothing',
	    'cod',
	    'commerce',
	    'cooperation',
	    'corps',
	    'debris',
	    'diabetes',
	    'digestion',
	    'elk',
	    'energy',
	    'equipment',
	    'excretion',
	    'expertise',
	    'flounder',
	    'fun',
	    'gallows',
	    'garbage',
	    'graffiti',
	    'headquarters',
	    'health',
	    'herpes',
	    'highjinks',
	    'homework',
	    'housework',
	    'information',
	    'jeans',
	    'justice',
	    'kudos',
	    'labour',
	    'literature',
	    'machinery',
	    'mackerel',
	    'mail',
	    'media',
	    'mews',
	    'moose',
	    'music',
	    'manga',
	    'news',
	    'pike',
	    'plankton',
	    'pliers',
	    'pollution',
	    'premises',
	    'rain',
	    'research',
	    'rice',
	    'salmon',
	    'scissors',
	    'series',
	    'sewage',
	    'shambles',
	    'shrimp',
	    'species',
	    'staff',
	    'swine',
	    'tennis',
	    'traffic',
	    'transporation',
	    'trout',
	    'tuna',
	    'wealth',
	    'welfare',
	    'whiting',
	    'wildebeest',
	    'wildlife',
	    'you',
	    // Regexes.
	    /[^aeiou]ese$/i, // "chinese", "japanese"
	    /deer$/i, // "deer", "reindeer"
	    /fish$/i, // "fish", "blowfish", "angelfish"
	    /measles$/i,
	    /o[iu]s$/i, // "carnivorous"
	    /pox$/i, // "chickpox", "smallpox"
	    /sheep$/i
	  ].forEach(pluralize.addUncountableRule);

	  return pluralize;
	});
	});

	class Relation {
	    constructor($type, $field, $field0isList) {
	        this.type0 = $type;
	        this.field0 = $field;
	        this.field0isList = $field0isList;
	    }
	    setRelative(relation) {
	        this.type1 = relation.type0;
	        this.field1 = relation.field0;
	        this.field1isList = relation.field0isList;
	    }
	    isValidRelative(relation) {
	        if (!this.type1) {
	            return true;
	        }
	        else {
	            return this.isSameRelative(relation);
	        }
	    }
	    isSameRelative(relation) {
	        return this.type0 === relation.type0 && this.field0 === relation.field0 && this.field0isList === relation.field0isList;
	    }
	    getInverse(type, field) {
	        const inverse = this.getInverseTuple(type, field);
	        return inverse ? inverse[1] : null;
	    }
	    getInverseTuple(type, field) {
	        let inverse = null;
	        if (this.type0 === type && this.field0 === field) {
	            inverse = [this.type1, this.field1];
	        }
	        else if (this.type1 === type && this.field1 === field) {
	            inverse = [this.type0, this.field0];
	        }
	        return inverse;
	    }
	}
	class Relations {
	    constructor() {
	        this.relations = new Map();
	    }
	    getRelation(name) {
	        let relations = null;
	        if (this.relations.has(name)) {
	            relations = this.relations.get(name);
	        }
	        return relations;
	    }
	    getInverseWithoutName(type, field) {
	        let inverse = null;
	        const iter = this.relations.values();
	        let relation = iter.next().value;
	        while (!inverse && relation) {
	            inverse = relation.getInverse(type, field);
	            relation = iter.next().value;
	        }
	        return inverse;
	    }
	    getInverse(name, type, field) {
	        let inverse = null;
	        if (this.relations.has(name)) {
	            const relation = this.relations.get(name);
	            inverse = relation.getInverse(type, field);
	        }
	        return inverse;
	    }
	    setRelation(name, type, field, fieldIsList) {
	        const newRelation = new Relation(type, field, fieldIsList);
	        if (!this.relations.has(name)) {
	            this.relations.set(name, newRelation);
	        }
	        else {
	            const relation = this.relations.get(name);
	            if (relation.isValidRelative(newRelation)) {
	                if (!relation.isSameRelative(newRelation)) {
	                    relation.setRelative(newRelation);
	                }
	            }
	            else {
	                this.throwError(name, type, field, relation.field0);
	            }
	        }
	    }
	    setSelfRelation(name, type, field, fieldIsList) {
	        const newRelation = new Relation(type, field, fieldIsList);
	        newRelation.setRelative(newRelation);
	        this.relations.set(name, newRelation);
	    }
	    throwError(name, type, primaryField, relatedField) {
	        console.error('Bad schema, relation could apply to multiple fields\n', 'relation name', name, '\n', 'fortune name', type, '\n', 'curr field', primaryField, '\n', 'other field', relatedField);
	    }
	}
	const computeNumFieldsOfType = (type, checkFieldTypeName) => {
	    let resultNum = 0;
	    lodash.each(type.fields, field => {
	        if (checkFieldTypeName === getReturnType(field.type)) {
	            resultNum++;
	        }
	    });
	    return resultNum;
	};
	const getNumFieldsOfType = (cache, type, checkFieldTypeName) => {
	    let numFields = 0;
	    const typeName = getReturnType(type);
	    if (cache.has(typeName) && cache.get(typeName).has(checkFieldTypeName)) {
	        numFields = cache.get(typeName).get(checkFieldTypeName);
	    }
	    else {
	        numFields = computeNumFieldsOfType(type, checkFieldTypeName);
	        if (!cache.has(typeName)) {
	            cache.set(typeName, new Map());
	        }
	        cache.get(typeName).set(checkFieldTypeName, numFields);
	    }
	    return numFields;
	};
	const computeRelations = (schemaInfo, typeNameResolver = (name) => name) => {
	    const numFieldsOfTypeCache = new Map();
	    const relations = new Relations();
	    lodash.each(lodash.keys(schemaInfo), (typeName) => {
	        const type = schemaInfo[typeName];
	        lodash.each(type.fields, field => {
	            const relation = lodash.get(field, 'metadata.relation');
	            const fieldTypeName = getReturnType(field.type);
	            const reslovedTypeName = typeNameResolver(fieldTypeName);
	            if (typeName === fieldTypeName) {
	                relations.setSelfRelation(`${field.name}On${typeName}`, reslovedTypeName, field.name, typeIsList(field.type));
	            }
	            else if (relation) {
	                relations.setRelation(relation.name, reslovedTypeName, field.name, typeIsList(field.type));
	            }
	            else {
	                const fieldTypeInfo = schemaInfo[fieldTypeName];
	                if (type && fieldTypeInfo) {
	                    const numFields = getNumFieldsOfType(numFieldsOfTypeCache, type, fieldTypeName);
	                    const reverseNumFields = getNumFieldsOfType(numFieldsOfTypeCache, fieldTypeInfo, typeName);
	                    if (numFields === 1 && reverseNumFields === 1) {
	                        const possibleTypes = [typeName, fieldTypeName];
	                        possibleTypes.sort();
	                        relations.setRelation(possibleTypes.join('_'), reslovedTypeName, field.name, typeIsList(field.type));
	                    }
	                }
	            }
	        });
	    });
	    return relations;
	};
	const stripNonNull = (type) => {
	    if (graphql_1.isNonNullType(type)) {
	        return type.ofType;
	    }
	    else {
	        return type;
	    }
	};
	const typeIsList = (type) => {
	    let isList = false;
	    if (type.name && type.name.endsWith('Connection')) {
	        isList = true;
	    }
	    while (!isList && (graphql_1.isListType(type) || graphql_1.isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST')) {
	        if (graphql_1.isListType(type) || type.kind === 'LIST') {
	            isList = true;
	            break;
	        }
	        type = type.ofType;
	    }
	    return isList;
	};
	const getReturnType = (type) => {
	    if (graphql_1.isListType(type) || graphql_1.isNonNullType(type) || type.kind === 'NON_NULL' || type.kind === 'LIST') {
	        return getReturnType(type.ofType);
	    }
	    else {
	        return type.name;
	    }
	};
	const getReturnGraphQLType = (type) => {
	    if (graphql_1.isListType(type) || graphql_1.isNonNullType(type)) {
	        return getReturnGraphQLType(type.ofType);
	    }
	    else {
	        return type;
	    }
	};
	var Mutation;
	(function (Mutation) {
	    Mutation[Mutation["Create"] = 0] = "Create";
	    Mutation[Mutation["Update"] = 1] = "Update";
	    Mutation[Mutation["Delete"] = 2] = "Delete";
	    Mutation[Mutation["Upsert"] = 3] = "Upsert";
	})(Mutation || (Mutation = {}));
	const clean = (obj) => {
	    const returnObj = {};
	    for (const propName in obj) {
	        if (obj[propName] !== null && obj[propName] !== undefined) {
	            // tslint:disable-next-line:prefer-conditional-expression
	            if (lodash.isObject(obj[propName]) && !lodash.isEmpty(obj[propName])) {
	                returnObj[propName] = obj[propName];
	            }
	            else {
	                returnObj[propName] = obj[propName];
	            }
	        }
	    }
	    return returnObj;
	};
	const setupArgs = (results, args) => {
	    // setup the arguments to use the new types
	    results.forEach((types) => {
	        types = types ? types : [];
	        types.forEach(type => {
	            if (type && type.key && type.id && type.index > -1) {
	                const key = type.key;
	                const id = type.id;
	                const arg = args[type.index];
	                if (lodash.isArray(arg[key])) {
	                    if (lodash.isArray(id)) {
	                        arg[key] = lodash.union(id, arg[key]);
	                    }
	                    else if (!arg[key].includes(id)) {
	                        arg[key].push(id);
	                    }
	                }
	                else {
	                    arg[key] = id;
	                }
	            }
	        });
	    });
	    return args;
	};
	const resolveArgs = (args, returnType, mutation, dataResolver, currRecord, _args, _context, _info) => __awaiter(undefined, void 0, void 0, function* () {
	    const promises = [];
	    args.forEach((currArg, index) => {
	        for (const argName in currArg) {
	            let argReturnType;
	            if ((graphql_1.isObjectType(returnType) || graphql_1.isInterfaceType(returnType)) && returnType.getFields()[argName]) {
	                argReturnType = returnType.getFields()[argName].type;
	            }
	            let argReturnRootType = getReturnGraphQLType(argReturnType);
	            if (!graphql_1.isScalarType(argReturnRootType)) {
	                const arg = currArg[argName];
	                if (lodash.isObject(arg) && argReturnType) {
	                    currArg[argName] = typeIsList(argReturnType) ? [] : undefined;
	                    if (graphql_1.isInterfaceType(argReturnRootType)) {
	                        for (const argKey in arg) {
	                            const argTypeName = capFirst(pluralize.singular(argKey));
	                            argReturnRootType = _info.schema.getType(argTypeName);
	                            promises.push(mutateResolver(mutation, dataResolver)(currRecord, arg[argKey], _context, _info, index, argName, argReturnRootType));
	                        }
	                    }
	                    else {
	                        promises.push(mutateResolver(mutation, dataResolver)(currRecord, arg, _context, _info, index, argName, argReturnRootType));
	                    }
	                }
	            }
	        }
	    });
	    const results = yield Promise.all(promises);
	    args = setupArgs(results, args);
	    return args;
	});
	const mutateResolver = (mutation, dataResolver) => {
	    return (currRecord, _args, _context, _info, index, key, returnType) => __awaiter(undefined, void 0, void 0, function* () {
	        // iterate over all the non-id arguments and recursively create new types
	        const recursed = returnType ? true : false;
	        if (!returnType) {
	            returnType = _info.returnType.getFields().data.type;
	            returnType = getReturnGraphQLType(returnType);
	        }
	        const returnTypeName = getReturnType(returnType);
	        const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
	        let createArgs = _args.create ? _args.create : mutation === Mutation.Create && lodash.get(_args, 'input.data') ? lodash.get(_args, 'input.data') : [];
	        createArgs = createArgs && !lodash.isArray(createArgs) ? [createArgs] : createArgs;
	        let updateArgs = _args.update ? _args.update : mutation === Mutation.Update && lodash.get(_args, 'input.data') ? lodash.get(_args, 'input.data') : [];
	        updateArgs = updateArgs && !lodash.isArray(updateArgs) ? [updateArgs] : updateArgs;
	        let upsertArgs = _args.upsert ? _args.upsert : mutation === Mutation.Upsert && lodash.get(_args, 'input') ? lodash.get(_args, 'input') : [];
	        upsertArgs = upsertArgs && !lodash.isArray(upsertArgs) ? [upsertArgs] : upsertArgs;
	        let deleteArgs = _args.delete ? _args.delete : mutation === Mutation.Delete && _args.input.where ? _args.input.where : [];
	        deleteArgs = deleteArgs && !lodash.isArray(deleteArgs) ? [deleteArgs] : deleteArgs;
	        let connectArgs = _args.connect ? _args.connect : [];
	        connectArgs = connectArgs && !lodash.isArray(connectArgs) ? [connectArgs] : connectArgs;
	        let disconnectArgs = _args.disconnect ? _args.disconnect : [];
	        disconnectArgs = disconnectArgs && !lodash.isArray(disconnectArgs) ? [disconnectArgs] : disconnectArgs;
	        const whereArgs = _args.where ? _args.where : _args.input && _args.input.where ? _args.input.where : null;
	        // lets make sure we are able to add this (prevent duplicates on unique fields, etc)
	        const canAddResults = yield Promise.all([dataResolver.canAdd(returnTypeName, createArgs),
	            dataResolver.canAdd(returnTypeName, updateArgs)]);
	        const cannotAdd = canAddResults.includes(false);
	        if (cannotAdd) {
	            throw new Error('can not create record with duplicate on unique field on type ' + returnTypeName + ' ' + JSON.stringify(createArgs) + ' ' + JSON.stringify(updateArgs));
	        }
	        const dataResolverPromises = [];
	        if (!lodash.isEmpty(updateArgs)) {
	            if (whereArgs) {
	                // we have a where so use that to get the record to update
	                // pass true to where args if currRecord is already the one we want
	                if (whereArgs !== true) {
	                    const returnTypeName = getReturnType(returnType);
	                    currRecord = yield dataResolver.getValueByUnique(returnTypeName, whereArgs);
	                    if (!currRecord || lodash.isEmpty(currRecord)) {
	                        throw new Error(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
	                    }
	                }
	            }
	            else if (updateArgs[0].data && updateArgs[0].where) {
	                // this is a nested update an a list type so we need to individually do updates
	                updateArgs.forEach((currArg) => {
	                    dataResolverPromises.push(new Promise((resolve) => {
	                        mutateResolver(mutation, dataResolver)(currRecord, { update: currArg.data, where: currArg.where }, _context, _info, index, key, returnType).then((result) => {
	                            if (recursed) {
	                                resolve();
	                            }
	                            else {
	                                resolve(result[0]);
	                            }
	                        });
	                    }));
	                });
	                updateArgs = [];
	            }
	            else if (key && currRecord) {
	                // this is a nested input on a single field so we already know the where
	                const recordToUpdate = yield dataResolver.getValueByUnique(returnTypeName, { id: currRecord[key] });
	                if (recordToUpdate) {
	                    currRecord = recordToUpdate;
	                }
	                else {
	                    // trying to update an empty field
	                    updateArgs = [];
	                }
	            }
	        }
	        if (!lodash.isEmpty(upsertArgs)) {
	            yield Promise.all(upsertArgs.map((currArg) => __awaiter(this, void 0, void 0, function* () {
	                const whereArg = currArg.where;
	                let upsertRecord = currRecord;
	                if (whereArg) {
	                    // this is a root upsert or nested upsert with a where field
	                    upsertRecord = yield dataResolver.getValueByUnique(returnTypeName, whereArg);
	                }
	                else if (upsertRecord && key) {
	                    // this is a nested upsert on a single field so we already have the where
	                    upsertRecord = upsertRecord[key] ? yield dataResolver.getValueByUnique(returnTypeName, { id: upsertRecord[key] }) : null;
	                }
	                let newArgs = { create: currArg.create };
	                if (upsertRecord && !lodash.isEmpty(upsertRecord)) {
	                    // pass true to where args if currRecord will already be the one we want
	                    newArgs = { where: true, update: currArg.update };
	                }
	                dataResolverPromises.push(new Promise((resolve) => {
	                    mutateResolver(mutation, dataResolver)(upsertRecord, newArgs, _context, _info, index, key, returnType).then((result) => {
	                        if (result[0]) {
	                            resolve(result[0]);
	                        }
	                        else {
	                            resolve();
	                        }
	                    });
	                }));
	            })));
	        }
	        [createArgs, updateArgs] = yield Promise.all([
	            resolveArgs(createArgs, returnType, Mutation.Create, dataResolver, currRecord, _args, _context, _info),
	            resolveArgs(updateArgs, returnType, Mutation.Update, dataResolver, currRecord, _args, _context, _info)
	        ]);
	        // could be creating more than 1 type
	        createArgs.forEach((createArg) => {
	            createArg = createArg.hasOwnProperty ? createArg : Object.assign({}, createArg);
	            createArg = clean(createArg);
	            if (createArg && !lodash.isEmpty(createArg)) {
	                dataResolverPromises.push(new Promise((resolve) => {
	                    dataResolver.create(returnTypeName, createArg).then(data => {
	                        const id = lodash.isArray(data) ? lodash.map(data, 'id') : data.id;
	                        resolve({ index, key, id, data });
	                    });
	                }));
	            }
	        });
	        // now updates
	        updateArgs.forEach((updateArg) => {
	            updateArg = updateArg.hasOwnProperty ? updateArg : Object.assign({}, updateArg);
	            // only do updates on new values
	            for (const updateArgKey in updateArg) {
	                const currArg = updateArg[updateArgKey];
	                const currRecordArg = currRecord[updateArgKey];
	                if (lodash.eq(currRecordArg, currArg)) {
	                    delete currRecord[updateArgKey];
	                }
	                else if (lodash.isArray(currArg) && lodash.isArray(currRecordArg)) {
	                    updateArg[updateArgKey] = lodash.difference(currArg, currRecordArg);
	                }
	            }
	            const cleanArg = clean(updateArg);
	            if (cleanArg && !lodash.isEmpty(cleanArg)) {
	                dataResolverPromises.push(new Promise((resolve) => {
	                    cleanArg.id = currRecord.id;
	                    dataResolver.update(returnTypeName, cleanArg).then(data => {
	                        const id = lodash.isArray(data) ? lodash.map(data, 'id') : data.id;
	                        resolve({ index, key, id, data });
	                    });
	                }));
	            }
	            else if (currRecord) {
	                currRecord = Object.assign(currRecord, updateArg);
	            }
	        });
	        // now add the connect types
	        connectArgs.forEach(connectArg => {
	            dataResolverPromises.push(new Promise((resolve, reject) => {
	                dataResolver.getValueByUnique(returnTypeName, connectArg).then(data => {
	                    if (data && data['id']) {
	                        resolve({ index, key, id: data['id'], data });
	                    }
	                    else {
	                        reject(new Error('tried to connect using unique value that does not exist ' + JSON.stringify(connectArg)));
	                    }
	                });
	            }));
	        });
	        // disconnect
	        const disconnectPromises = [];
	        disconnectArgs.forEach(disconnectArg => {
	            if (disconnectArg === true) {
	                dataResolverPromises.push(new Promise((resolve) => {
	                    dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: null }).then(data => {
	                        resolve({ index, key, id: null, data });
	                    });
	                }));
	            }
	            else {
	                disconnectPromises.push(new Promise((resolve, reject) => {
	                    dataResolver.getValueByUnique(returnTypeName, disconnectArg).then(data => {
	                        if (data && data['id']) {
	                            resolve(data['id']);
	                        }
	                        else {
	                            reject();
	                        }
	                    });
	                }));
	            }
	        });
	        const disconnectIds = yield Promise.all(disconnectPromises);
	        if (!lodash.isEmpty(disconnectIds)) {
	            dataResolverPromises.push(new Promise((resolve) => {
	                dataResolver.update(currRecord.__typename, { id: currRecord.id, [key]: disconnectIds }, null, { pull: true }).then(data => {
	                    resolve({ index, key, id: data[key], data });
	                });
	            }));
	        }
	        // delete
	        const deletePromises = [];
	        deleteArgs.forEach(deleteArg => {
	            if (deleteArg === true) {
	                dataResolverPromises.push(new Promise((resolve) => {
	                    dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), [currRecord[key]]).then(data => {
	                        resolve({ index, key, id: null, data });
	                    });
	                }));
	            }
	            else if (whereArgs && !currRecord) {
	                dataResolverPromises.push(new Promise((resolve) => {
	                    dataResolver.getValueByUnique(returnTypeName, whereArgs).then(whereData => {
	                        currRecord = whereData;
	                        if (!currRecord || lodash.isEmpty(currRecord)) {
	                            throw new graphql_1.GraphQLError(`${returnTypeName} does not exist with where args ${JSON.stringify(whereArgs)}`);
	                        }
	                        dataResolver.delete(currRecord.__typename, [currRecord.id]).then(() => {
	                            resolve({ index, key, id: null, currRecord });
	                        });
	                    });
	                }));
	            }
	            else {
	                deletePromises.push(new Promise((resolve, reject) => {
	                    dataResolver.getValueByUnique(dataResolver.getLink(currRecord.__typename, key), deleteArg).then(data => {
	                        if (data && data['id']) {
	                            resolve(data['id']);
	                        }
	                        else {
	                            reject();
	                        }
	                    });
	                }));
	            }
	        });
	        const deleteIds = yield Promise.all(deletePromises);
	        if (!lodash.isEmpty(deleteIds)) {
	            dataResolverPromises.push(new Promise((resolve) => {
	                dataResolver.delete(dataResolver.getLink(currRecord.__typename, key), deleteIds).then(data => {
	                    resolve({ index, key, id: data[key], data });
	                });
	            }));
	        }
	        const dataResult = yield Promise.all(dataResolverPromises);
	        // if everything was an id no need to create anything new
	        // if key this is recursed else it's the final value
	        if (recursed) {
	            return dataResult;
	        }
	        else {
	            let data = lodash.get(dataResult, '[0].data');
	            if (!data && mutation === Mutation.Delete) {
	                data = currRecord;
	            }
	            else if (!data) {
	                // if everything was already done on the object (updates, deletions and disconnects) it should be the currRecord but with changes
	                data = currRecord;
	            }
	            return {
	                data,
	                clientMutationId
	            };
	        }
	    });
	};
	const createResolver = (dataResolver) => {
	    return mutateResolver(Mutation.Create, dataResolver);
	};
	const updateResolver = (dataResolver) => {
	    return mutateResolver(Mutation.Update, dataResolver);
	};
	const upsertResolver = (dataResolver) => {
	    return mutateResolver(Mutation.Upsert, dataResolver);
	};
	const deleteResolver = (dataResolver) => {
	    return mutateResolver(Mutation.Delete, dataResolver);
	};
	const getTypeResolver = (dataResolver, schema, field, returnConnection = false) => {
	    const schemaType = schema.getType(getReturnType(field.type));
	    let resolver;
	    if (!graphql_1.isScalarType(schemaType)) {
	        resolver = (root, _args, _context, _info) => __awaiter(undefined, void 0, void 0, function* () {
	            const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
	            if (!fortuneReturn) {
	                return fortuneReturn;
	            }
	            const cache = root && root.cache ? root.cache : new Map();
	            const typeName = getReturnType(field.type);
	            let result = [];
	            let returnArray = false;
	            let fieldValue = fortuneReturn[field.name];
	            returnArray = lodash.isArray(fieldValue);
	            fieldValue = returnArray ? fieldValue : [fieldValue];
	            // actual value is filled from cache not just ids
	            if (lodash.isObject(fieldValue[0])) {
	                result = fieldValue;
	            }
	            const ids = [];
	            let options = {};
	            let filter = null;
	            if (_args && _args.filter) {
	                filter = _args.filter;
	                options = parseFilter(_args.filter, schemaType);
	            }
	            lodash.set(options, 'orderBy', _args.orderBy);
	            lodash.set(options, 'offset', _args.skip);
	            let connection;
	            options = clean(options);
	            // I guess use the args here instead of args as a result of cache
	            if (!lodash.isEmpty(options)) {
	                result = [];
	            }
	            if (lodash.isEmpty(result)) {
	                fieldValue.forEach(id => {
	                    if (id) {
	                        if (cache.has(id)) {
	                            result.push(cache.get(id));
	                        }
	                        else {
	                            ids.push(id);
	                        }
	                    }
	                });
	            }
	            let findOptions = {};
	            let applyOptionsWithCombinedResult = false;
	            if (!lodash.isEmpty(result) && !lodash.isEmpty(options)) {
	                applyOptionsWithCombinedResult = true;
	            }
	            else {
	                findOptions = options;
	            }
	            if (!lodash.isEmpty(ids)) {
	                let findResult = yield dataResolver.find(typeName, ids, findOptions);
	                if (findResult) {
	                    findResult = lodash.isArray(findResult) ? findResult : [findResult];
	                    findResult.forEach(result => {
	                        cache.set(result.id, result);
	                    });
	                    result = result.concat(findResult);
	                }
	            }
	            if (applyOptionsWithCombinedResult) {
	                result = dataResolver.applyOptions(typeName, result, options);
	            }
	            if ((_args.orderBy || filter) && (graphql_1.isObjectType(schemaType) || graphql_1.isInterfaceType(schemaType))) {
	                const pullIds = yield filterNested(filter, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver);
	                result = result.filter(entry => !pullIds.has(entry.id));
	            }
	            // use cached data on subfields in order to support nested orderBy/filter
	            result.forEach(resultElement => {
	                for (const resultElementField in resultElement) {
	                    if (cache.has(`${resultElement.id}.${resultElementField}`)) {
	                        resultElement[resultElementField] = cache.get(`${resultElement.id}.${resultElementField}`);
	                    }
	                }
	            });
	            connection = dataResolver.getConnection(result, _args.before, _args.after, _args.first, _args.last);
	            result = connection.edges;
	            result = result.map((entry) => {
	                return {
	                    fortuneReturn: entry,
	                    cache: cache,
	                    __typename: entry.__typename
	                };
	            });
	            result = result.length === 0 ? null : returnArray ? result : result[0];
	            if (returnConnection) {
	                result = {
	                    edges: result,
	                    pageInfo: connection.pageInfo,
	                    aggregate: connection.aggregate
	                };
	            }
	            return result;
	        });
	    }
	    else {
	        resolver = (root, _args, _context, _info) => __awaiter(undefined, void 0, void 0, function* () {
	            const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
	            const result = yield graphql_1.defaultFieldResolver.apply(this, [fortuneReturn, _args, _context, _info]);
	            return result;
	        });
	    }
	    return resolver;
	};
	const getAllResolver = (dataResolver, schema, type, returnConnection = false) => {
	    return (_root, _args, _context, _info) => __awaiter(undefined, void 0, void 0, function* () {
	        let options = {};
	        let filter = null;
	        const schemaType = schema.getType(type.name);
	        if (_args && _args.filter) {
	            filter = _args.filter;
	            options = parseFilter(_args.filter, schemaType);
	        }
	        lodash.set(options, 'orderBy', _args.orderBy);
	        lodash.set(options, 'offset', _args.skip);
	        let connection;
	        let result;
	        let fortuneReturn = yield dataResolver.find(type.name, null, options);
	        if (fortuneReturn && !lodash.isEmpty(fortuneReturn)) {
	            fortuneReturn = lodash.isArray(fortuneReturn) ? fortuneReturn : [fortuneReturn];
	            connection = dataResolver.getConnection(fortuneReturn, _args.before, _args.after, _args.first, _args.last);
	            fortuneReturn = connection.edges;
	            const cache = new Map();
	            fortuneReturn.forEach(result => {
	                cache.set(result.id, result);
	            });
	            if ((_args.orderBy || filter) && (graphql_1.isObjectType(schemaType) || graphql_1.isInterfaceType(schemaType))) {
	                const pullIds = yield filterNested(filter, _args.orderBy, schemaType, fortuneReturn, cache, dataResolver);
	                fortuneReturn = fortuneReturn.filter(result => !pullIds.has(result.id));
	            }
	            result = fortuneReturn.map((result) => {
	                if (!result) {
	                    return result;
	                }
	                return {
	                    fortuneReturn: result,
	                    cache: cache,
	                    filter,
	                    __typename: result.__typename
	                };
	            });
	        }
	        if (returnConnection) {
	            result = {
	                edges: result,
	                pageInfo: connection.pageInfo,
	                aggregate: connection.aggregate
	            };
	        }
	        return result;
	    });
	};
	const parseScalars = (filter, fieldMap) => {
	    if (!filter || !lodash.isObject(filter) || lodash.isArray(filter)) {
	        return filter;
	    }
	    return lodash.mapValues(filter, (val, key) => {
	        if (lodash.isArray(val)) {
	            return val.map((val) => {
	                if (lodash.isObject(val)) {
	                    return parseScalars(val, fieldMap);
	                }
	                else {
	                    return val && fieldMap.has(key) ? fieldMap.get(key).parseValue(val) : val;
	                }
	            });
	        }
	        else if (lodash.isObject(val)) {
	            if (key === 'range' || key === 'match') {
	                return parseScalars(val, fieldMap);
	            }
	            else {
	                return val;
	            }
	        }
	        else {
	            return val && fieldMap.has(key) ? fieldMap.get(key).parseValue(val) : val;
	        }
	    });
	};
	const queryArgs = {
	    'first': { type: 'Int' },
	    'last': { type: 'Int' },
	    'skip': { type: 'Int' },
	    'before': { type: 'String' },
	    'after': { type: 'String' }
	};
	const fortuneFilters = ['not', 'or', 'and', 'range', 'match', 'exists'];
	const parseFilter = (filter, type) => {
	    if (!graphql_1.isObjectType(type) && !graphql_1.isInterfaceType(type)) {
	        return filter;
	    }
	    if (!filter || !lodash.isObject(filter) || lodash.isArray(filter)) {
	        return filter;
	    }
	    const fieldMap = new Map();
	    lodash.each(type.getFields(), field => {
	        if (!fortuneFilters.includes(field.name) && filter[field.name]) {
	            if (filter['and']) {
	                filter['and'].push({ exists: { [field.name]: true } });
	            }
	            else {
	                lodash.set(filter, `exists.${field.name}`, true);
	            }
	        }
	        const fieldOutputType = getReturnGraphQLType(field.type);
	        if (graphql_1.isScalarType(fieldOutputType)) {
	            fieldMap.set(field.name, fieldOutputType);
	        }
	    });
	    const scalarsParsed = parseScalars(lodash.pick(filter, fortuneFilters), fieldMap);
	    return Object.assign(filter, scalarsParsed);
	};
	const filterNested = (filter, orderBy, type, fortuneReturn, cache, dataResolver) => __awaiter(undefined, void 0, void 0, function* () {
	    // if they have nested filters on types we need to get that data now so we can filter at this root query
	    const pullIds = new Set();
	    if ((orderBy || filter) && (graphql_1.isObjectType(type) || graphql_1.isInterfaceType(type))) {
	        yield Promise.all(lodash.map(type.getFields(), (field) => __awaiter(this, void 0, void 0, function* () {
	            const currFilter = filter && filter[field.name] ? filter[field.name] : filter && filter[`f_${field.name}`] ? filter[`f_${field.name}`] : null;
	            const currOrderBy = orderBy && orderBy[field.name] ? orderBy[field.name] : orderBy && orderBy[`f_${field.name}`] ? orderBy[`f_${field.name}`] : null;
	            const childType = getReturnGraphQLType(field.type);
	            if (!graphql_1.isScalarType(childType) && (currFilter || currOrderBy)) {
	                const options = currFilter ? parseFilter(currFilter, childType) : {};
	                yield Promise.all(fortuneReturn.map((result) => __awaiter(this, void 0, void 0, function* () {
	                    const childIds = result[field.name];
	                    if (childIds && !lodash.isEmpty(childIds)) {
	                        if (currOrderBy) {
	                            options.orderBy = currOrderBy;
	                        }
	                        let childReturn = yield dataResolver.find(childType.name, childIds, options);
	                        if (lodash.isArray(childReturn)) {
	                            const recursePullIds = yield filterNested(currFilter, currOrderBy, childType, childReturn, cache, dataResolver);
	                            childReturn = childReturn ? childReturn.filter(result => !recursePullIds.has(result.id)) : childReturn;
	                        }
	                        if (childReturn && !lodash.isEmpty(childReturn)) {
	                            if (cache) {
	                                if (childReturn.id) {
	                                    cache.set(childReturn.id, childReturn);
	                                }
	                                else {
	                                    cache.set(`${result.id}.${field.name}`, childReturn);
	                                }
	                            }
	                        }
	                        else {
	                            pullIds.add(result.id);
	                        }
	                    }
	                })));
	            }
	        })));
	    }
	    return pullIds;
	});
	const getPayloadTypeName = (typeName) => {
	    return `${typeName}Payload`;
	};
	const getPayloadTypeDef = (typeName) => {
	    return `
		type ${getPayloadTypeName(typeName)} {
			data: ${typeName}!
			clientMutationId: String
		}`;
	};
	const capFirst = (val) => {
	    return val ? val.charAt(0).toUpperCase() + val.slice(1) : '';
	};
	const lowerFirst = (val) => {
	    return val ? val.charAt(0).toLowerCase() + val.slice(1) : '';
	};

	class GraphQLSchemaBuilder {
	    constructor(typeDefs = '', $config) {
	        this.addTypeDefsToSchema = ($typeDefs = '') => {
	            if ($typeDefs) {
	                this.typeDefs += $typeDefs;
	            }
	            if (this.typeDefs.includes('@model') && !this.typeDefs.includes('directive @model')) {
	                this.typeDefs = 'directive @model on OBJECT ' + this.typeDefs;
	            }
	            if (this.typeDefs.includes('@connection') && !this.typeDefs.includes('directive @connection')) {
	                this.typeDefs = 'directive @connection on FIELD_DEFINITION' + this.typeDefs;
	            }
	            if (this.config.generateSubscriptions && !this.typeDefs.includes('enum MUTATION_TYPE')) {
	                this.typeDefs += `
			enum MUTATION_TYPE {
				CREATED
				UPDATED
				DELETED
				CONNECTED
				DISCONNECTED
			}
			`;
	            }
	            if ((this.config.generateGetAll || this.config.generateConnections) && !this.typeDefs.includes('enum ORDER_BY_OPTIONS')) {
	                this.typeDefs += `
			enum ORDER_BY_OPTIONS {
				ASCENDING
				DESCENDING
				ASC
				DESC
			}
			`;
	            }
	            if ((this.config.generateDelete || this.config.generateUpdate) && !this.typeDefs.includes('type BatchPayload')) {
	                this.typeDefs += `
				type BatchPayload {
					"""
					The number of nodes that have been affected by the Batch operation.
					"""
					count: Int!
					clientMutationId: String
				}
			`;
	            }
	            let newTypeDefs = this.typeDefs;
	            if (!this.typeDefs.includes('type Query')) {
	                newTypeDefs += 'type Query {noop:Int}';
	            }
	            this.schema = dist_2$1({
	                typeDefs: newTypeDefs,
	                resolvers: this.resolveFunctions,
	                schemaDirectives: {
	                    display: DisplayDirective,
	                    relation: RelationDirective,
	                    default: DefaultDirective,
	                    unique: UniqueDirective
	                },
	                resolverValidationOptions: {
	                    requireResolversForResolveType: false
	                }
	            });
	            if (this.typeDefs.includes('@connection')) {
	                if (!this.config.generateConnections) {
	                    throw new Error('Generate Connections must be true to use connection directive');
	                }
	                // don't want to attempt this if we didn't create the necessary types yet
	                if (this.typeDefs.includes('Connection') && this.typeDefs.includes('Edge') && this.typeDefs.includes('PageInfo')) {
	                    dist_1$1.visitSchemaDirectives(this.schema, {
	                        connection: ConnectionDirective
	                    });
	                }
	            }
	            const typeMap = this.schema.getTypeMap();
	            if (this.typeDefs.includes('@model')) {
	                dist_1$1.visitSchemaDirectives(this.schema, {
	                    model: ModelDirective
	                });
	            }
	            else {
	                Object.keys(typeMap).forEach(name => {
	                    const type = typeMap[name];
	                    if (graphql_1.isObjectType(type) && type.name !== 'PageInfo' && !type.name.includes('__') && !type.name.endsWith('Aggregate') && !type.name.endsWith('Connection') && !type.name.endsWith('Edge') && !type.name.endsWith('Payload') && !(type.name.toLowerCase() === 'query') && !(type.name.toLowerCase() === 'mutation') && !(type.name.toLowerCase() === 'subscription')) {
	                        type['_interfaces'].push(typeMap.Node);
	                        lodash.has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(type) : lodash.set(this.schema, '_implementations.Node', [type]);
	                    }
	                });
	            }
	            return this.schema;
	        };
	        this.getSchema = () => {
	            if (!this.schema) {
	                this.schema = this.addTypeDefsToSchema();
	            }
	            return this.schema;
	        };
	        this.addResolvers = (typeName, fieldResolvers) => {
	            const resolverMap = {};
	            resolverMap[typeName] = {};
	            this.resolveFunctions[typeName] = this.resolveFunctions[typeName] ? this.resolveFunctions[typeName] : {};
	            fieldResolvers.forEach((resolve, name) => {
	                resolverMap[typeName][name] = resolve;
	                this.resolveFunctions[typeName][name] = resolve; // save in case type defs changed
	            });
	            dist_3$1({
	                schema: this.schema,
	                resolvers: resolverMap,
	                resolverValidationOptions: {
	                    requireResolversForResolveType: false
	                }
	            });
	            return this.schema;
	        };
	        this.typeDefs = `
		scalar JSON
		scalar Date
		scalar Time
		scalar DateTime
		directive @display(
			name: String
		) on FIELD_DEFINITION | ENUM_VALUE | OBJECT

		directive @relation(
			name: String!
		) on FIELD_DEFINITION

		directive @default(
			value: String!
		) on FIELD_DEFINITION

		directive @unique on FIELD_DEFINITION

		interface Node {
			id: ID! @unique
		}
		` + typeDefs;
	        this.resolveFunctions = {
	            JSON: GraphQLJSON,
	            Date: dist_1,
	            Time: dist_2,
	            DateTime: dist_3
	        };
	        this.config = $config;
	    }
	}
	class DisplayDirective extends dist_1$1 {
	    visitFieldDefinition(field) {
	        this.setDisplay(field);
	    }
	    visitEnumValue(value) {
	        this.setDisplay(value);
	    }
	    visitObject(object) {
	        this.setDisplay(object);
	    }
	    setDisplay(field) {
	        field.display = {};
	        if (this.args.name) {
	            field.display.name = this.args.name;
	        }
	    }
	}
	class RelationDirective extends dist_1$1 {
	    visitFieldDefinition(field) {
	        this.setRelation(field);
	    }
	    setRelation(field) {
	        field.relation = {};
	        if (this.args.name) {
	            field.relation.name = this.args.name;
	        }
	        let type = field.type;
	        while (graphql_1.isListType(type) || graphql_1.isNonNullType(type)) {
	            type = type.ofType;
	        }
	        field.relation.outputType = type.name;
	    }
	}
	class DefaultDirective extends dist_1$1 {
	    visitFieldDefinition(field) {
	        let type = field.type;
	        while (graphql_1.isListType(type) || graphql_1.isNonNullType(type)) {
	            type = type.ofType;
	        }
	        if (!graphql_1.isScalarType(type)) {
	            throw new Error('Can not set default on non scalar type which was attempted on ' + field.name);
	        }
	        if (this.args.value) {
	            const currType = type.name;
	            let value = this.args.value;
	            if (currType === 'Int') {
	                value = Number.parseInt(value);
	            }
	            else if (currType === 'Float') {
	                value = Number.parseFloat(value);
	            }
	            else if (currType === 'Boolean') {
	                value = value.toLowerCase();
	                if (value !== 'true' && value !== 'false') {
	                    throw new Error('Default on field ' + field.name + ' which is of type Boolean must be "true" or "false"');
	                }
	                value = value === 'true';
	            }
	            field.defaultValue = value;
	        }
	    }
	}
	class ModelDirective extends dist_1$1 {
	    visitObject(object) {
	        object._interfaces.push(this.schema.getTypeMap().Node);
	        lodash.has(this.schema, '_implementations.Node') ? this.schema['_implementations'].Node.push(object) : lodash.set(this.schema, '_implementations.Node', [object]);
	    }
	}
	class UniqueDirective extends dist_1$1 {
	    visitFieldDefinition(field) {
	        field.unique = true;
	    }
	}
	class ConnectionDirective extends dist_1$1 {
	    visitFieldDefinition(field) {
	        const fieldType = field.type;
	        if (typeIsList(fieldType)) {
	            const connectionName = getReturnType(fieldType) + 'Connection';
	            let connectionType = this.schema.getType(connectionName);
	            if (!connectionType) {
	                throw new Error('Connections must be enabled and output type must be part of model');
	            }
	            if (graphql_1.isNonNullType(fieldType)) {
	                connectionType = new graphql_1.GraphQLNonNull(connectionType);
	            }
	            field.type = connectionType;
	        }
	        else {
	            throw new Error('Can\'t make connection on non list field');
	        }
	    }
	}
	// {
	//   __type(name: "GraphQLInputType") {
	//     name
	//     description
	//     kind
	//     possibleTypes {
	//       name
	//     }
	//     fields {
	//       name
	//       type {
	//         name
	//         kind
	//         ofType {
	//           name
	//           kind
	//           ofType {
	//             name
	//             kind
	//             ofType {
	//               name
	//               kind
	//             }
	//           }
	//         }
	//       }
	//     }
	//     interfaces {
	//       name
	//       possibleTypes {
	//         name
	//       }
	//     }
	//   }
	// }
	// {
	//   allGraphQLDirectives {
	//     id
	//     name
	//     description
	//     args {
	//       id
	//       type {
	//         ... on GraphQLScalarType {
	//           id
	//         }
	//       }
	//     }
	//   }
	// }

	class Connection {
	    constructor() {
	        this.aggregate = {
	            count: -1
	        };
	        this.pageInfo = {
	            hasNextPage: false,
	            hasPreviousPage: false,
	            startCursor: '',
	            endCursor: ''
	        };
	    }
	}

	var eventLite = createCommonjsModule(function (module) {
	/**
	 * event-lite.js - Light-weight EventEmitter (less than 1KB when gzipped)
	 *
	 * @copyright Yusuke Kawasaki
	 * @license MIT
	 * @constructor
	 * @see https://github.com/kawanet/event-lite
	 * @see http://kawanet.github.io/event-lite/EventLite.html
	 * @example
	 * var EventLite = require("event-lite");
	 *
	 * function MyClass() {...}             // your class
	 *
	 * EventLite.mixin(MyClass.prototype);  // import event methods
	 *
	 * var obj = new MyClass();
	 * obj.on("foo", function() {...});     // add event listener
	 * obj.once("bar", function() {...});   // add one-time event listener
	 * obj.emit("foo");                     // dispatch event
	 * obj.emit("bar");                     // dispatch another event
	 * obj.off("foo");                      // remove event listener
	 */

	function EventLite() {
	  if (!(this instanceof EventLite)) return new EventLite();
	}

	(function(EventLite) {
	  // export the class for node.js
	  module.exports = EventLite;

	  // property name to hold listeners
	  var LISTENERS = "listeners";

	  // methods to export
	  var methods = {
	    on: on,
	    once: once,
	    off: off,
	    emit: emit
	  };

	  // mixin to self
	  mixin(EventLite.prototype);

	  // export mixin function
	  EventLite.mixin = mixin;

	  /**
	   * Import on(), once(), off() and emit() methods into target object.
	   *
	   * @function EventLite.mixin
	   * @param target {Prototype}
	   */

	  function mixin(target) {
	    for (var key in methods) {
	      target[key] = methods[key];
	    }
	    return target;
	  }

	  /**
	   * Add an event listener.
	   *
	   * @function EventLite.prototype.on
	   * @param type {string}
	   * @param func {Function}
	   * @returns {EventLite} Self for method chaining
	   */

	  function on(type, func) {
	    getListeners(this, type).push(func);
	    return this;
	  }

	  /**
	   * Add one-time event listener.
	   *
	   * @function EventLite.prototype.once
	   * @param type {string}
	   * @param func {Function}
	   * @returns {EventLite} Self for method chaining
	   */

	  function once(type, func) {
	    var that = this;
	    wrap.originalListener = func;
	    getListeners(that, type).push(wrap);
	    return that;

	    function wrap() {
	      off.call(that, type, wrap);
	      func.apply(this, arguments);
	    }
	  }

	  /**
	   * Remove an event listener.
	   *
	   * @function EventLite.prototype.off
	   * @param [type] {string}
	   * @param [func] {Function}
	   * @returns {EventLite} Self for method chaining
	   */

	  function off(type, func) {
	    var that = this;
	    var listners;
	    if (!arguments.length) {
	      delete that[LISTENERS];
	    } else if (!func) {
	      listners = that[LISTENERS];
	      if (listners) {
	        delete listners[type];
	        if (!Object.keys(listners).length) return off.call(that);
	      }
	    } else {
	      listners = getListeners(that, type, true);
	      if (listners) {
	        listners = listners.filter(ne);
	        if (!listners.length) return off.call(that, type);
	        that[LISTENERS][type] = listners;
	      }
	    }
	    return that;

	    function ne(test) {
	      return test !== func && test.originalListener !== func;
	    }
	  }

	  /**
	   * Dispatch (trigger) an event.
	   *
	   * @function EventLite.prototype.emit
	   * @param type {string}
	   * @param [value] {*}
	   * @returns {boolean} True when a listener received the event
	   */

	  function emit(type, value) {
	    var that = this;
	    var listeners = getListeners(that, type, true);
	    if (!listeners) return false;
	    var arglen = arguments.length;
	    if (arglen === 1) {
	      listeners.forEach(zeroarg);
	    } else if (arglen === 2) {
	      listeners.forEach(onearg);
	    } else {
	      var args = Array.prototype.slice.call(arguments, 1);
	      listeners.forEach(moreargs);
	    }
	    return !!listeners.length;

	    function zeroarg(func) {
	      func.call(that);
	    }

	    function onearg(func) {
	      func.call(that, value);
	    }

	    function moreargs(func) {
	      func.apply(that, args);
	    }
	  }

	  /**
	   * @ignore
	   */

	  function getListeners(that, type, readonly) {
	    if (readonly && !that[LISTENERS]) return;
	    var listeners = that[LISTENERS] || (that[LISTENERS] = {});
	    return listeners[type] || (listeners[type] = []);
	  }

	})(EventLite);
	});

	/**
	 * Pull primitive values from an array.
	 *
	 * @param {*[]} array
	 * @param {*|*[]} values
	 * @return {*[]}
	 */
	var pull = function pull (array, values$$1) {
	  var hash = {}, clone = [], value;
	  var i, j;

	  if (Array.isArray(values$$1))
	    for (i = 0, j = values$$1.length; i < j; i++)
	      hash[values$$1[i]] = true;
	  else hash[values$$1] = true;

	  // Need to iterate backwards.
	  for (i = array.length; i--;) {
	    value = array[i];
	    if (!hash.hasOwnProperty(value)) clone.push(value);
	  }

	  return clone
	};

	/**
	 * Given a record and an update object, apply the update on the record. Note
	 * that the `operate` object is unapplied here.
	 *
	 * @param {Object} record
	 * @param {Object} update
	 */
	var apply_update = function applyUpdate (record, update) {
	  var field;

	  for (field in update.replace)
	    record[field] = update.replace[field];

	  for (field in update.push)
	    record[field] = record[field] ?
	      record[field].concat(update.push[field]) :
	      [].concat(update.push[field]);

	  for (field in update.pull)
	    record[field] = record[field] ?
	      pull(record[field], update.pull[field]) : [];
	};

	/**
	 * A more performant `Array.prototype.map`.
	 *
	 * @param {*[]} array
	 * @param {Function} fn
	 * @return {Boolean}
	 */
	var map = function map (array, fn) {
	  var i, j, k = [], l = 0;

	  for (i = 0, j = array.length; i < j; i++)
	    k[l++] = fn(array[i], i, array);

	  return k
	};

	// This object exists as a container for the Promise implementation. By
	// default, it's the native one.
	var Promise_1 = Promise;

	var promise = {
		Promise: Promise_1
	};

	var global$1 = typeof global !== "undefined" ? global :
	            typeof self !== "undefined" ? self :
	            typeof window !== "undefined" ? window : {}

	var lookup = [];
	var revLookup = [];
	var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
	var inited = false;
	function init () {
	  inited = true;
	  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	  for (var i = 0, len = code.length; i < len; ++i) {
	    lookup[i] = code[i];
	    revLookup[code.charCodeAt(i)] = i;
	  }

	  revLookup['-'.charCodeAt(0)] = 62;
	  revLookup['_'.charCodeAt(0)] = 63;
	}

	function toByteArray (b64) {
	  if (!inited) {
	    init();
	  }
	  var i, j, l, tmp, placeHolders, arr;
	  var len = b64.length;

	  if (len % 4 > 0) {
	    throw new Error('Invalid string. Length must be a multiple of 4')
	  }

	  // the number of equal signs (place holders)
	  // if there are two placeholders, than the two characters before it
	  // represent one byte
	  // if there is only one, then the three characters before it represent 2 bytes
	  // this is just a cheap hack to not do indexOf twice
	  placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

	  // base64 is 4/3 + up to two characters of the original data
	  arr = new Arr(len * 3 / 4 - placeHolders);

	  // if there are placeholders, only get up to the last complete 4 chars
	  l = placeHolders > 0 ? len - 4 : len;

	  var L = 0;

	  for (i = 0, j = 0; i < l; i += 4, j += 3) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
	    arr[L++] = (tmp >> 16) & 0xFF;
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  if (placeHolders === 2) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
	    arr[L++] = tmp & 0xFF;
	  } else if (placeHolders === 1) {
	    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
	    arr[L++] = (tmp >> 8) & 0xFF;
	    arr[L++] = tmp & 0xFF;
	  }

	  return arr
	}

	function tripletToBase64 (num) {
	  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
	}

	function encodeChunk (uint8, start, end) {
	  var tmp;
	  var output = [];
	  for (var i = start; i < end; i += 3) {
	    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
	    output.push(tripletToBase64(tmp));
	  }
	  return output.join('')
	}

	function fromByteArray (uint8) {
	  if (!inited) {
	    init();
	  }
	  var tmp;
	  var len = uint8.length;
	  var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
	  var output = '';
	  var parts = [];
	  var maxChunkLength = 16383; // must be multiple of 3

	  // go through the array every three bytes, we'll deal with trailing stuff later
	  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
	    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
	  }

	  // pad the end with zeros, but make sure to not forget the extra bytes
	  if (extraBytes === 1) {
	    tmp = uint8[len - 1];
	    output += lookup[tmp >> 2];
	    output += lookup[(tmp << 4) & 0x3F];
	    output += '==';
	  } else if (extraBytes === 2) {
	    tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
	    output += lookup[tmp >> 10];
	    output += lookup[(tmp >> 4) & 0x3F];
	    output += lookup[(tmp << 2) & 0x3F];
	    output += '=';
	  }

	  parts.push(output);

	  return parts.join('')
	}

	function read (buffer, offset, isLE, mLen, nBytes) {
	  var e, m;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var nBits = -7;
	  var i = isLE ? (nBytes - 1) : 0;
	  var d = isLE ? -1 : 1;
	  var s = buffer[offset + i];

	  i += d;

	  e = s & ((1 << (-nBits)) - 1);
	  s >>= (-nBits);
	  nBits += eLen;
	  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  m = e & ((1 << (-nBits)) - 1);
	  e >>= (-nBits);
	  nBits += mLen;
	  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

	  if (e === 0) {
	    e = 1 - eBias;
	  } else if (e === eMax) {
	    return m ? NaN : ((s ? -1 : 1) * Infinity)
	  } else {
	    m = m + Math.pow(2, mLen);
	    e = e - eBias;
	  }
	  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
	}

	function write (buffer, value, offset, isLE, mLen, nBytes) {
	  var e, m, c;
	  var eLen = nBytes * 8 - mLen - 1;
	  var eMax = (1 << eLen) - 1;
	  var eBias = eMax >> 1;
	  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
	  var i = isLE ? 0 : (nBytes - 1);
	  var d = isLE ? 1 : -1;
	  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

	  value = Math.abs(value);

	  if (isNaN(value) || value === Infinity) {
	    m = isNaN(value) ? 1 : 0;
	    e = eMax;
	  } else {
	    e = Math.floor(Math.log(value) / Math.LN2);
	    if (value * (c = Math.pow(2, -e)) < 1) {
	      e--;
	      c *= 2;
	    }
	    if (e + eBias >= 1) {
	      value += rt / c;
	    } else {
	      value += rt * Math.pow(2, 1 - eBias);
	    }
	    if (value * c >= 2) {
	      e++;
	      c /= 2;
	    }

	    if (e + eBias >= eMax) {
	      m = 0;
	      e = eMax;
	    } else if (e + eBias >= 1) {
	      m = (value * c - 1) * Math.pow(2, mLen);
	      e = e + eBias;
	    } else {
	      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
	      e = 0;
	    }
	  }

	  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

	  e = (e << mLen) | m;
	  eLen += mLen;
	  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

	  buffer[offset + i - d] |= s * 128;
	}

	var toString = {}.toString;

	var isArray = Array.isArray || function (arr) {
	  return toString.call(arr) == '[object Array]';
	};

	var INSPECT_MAX_BYTES = 50;

	/**
	 * If `Buffer.TYPED_ARRAY_SUPPORT`:
	 *   === true    Use Uint8Array implementation (fastest)
	 *   === false   Use Object implementation (most compatible, even IE6)
	 *
	 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
	 * Opera 11.6+, iOS 4.2+.
	 *
	 * Due to various browser bugs, sometimes the Object implementation will be used even
	 * when the browser supports typed arrays.
	 *
	 * Note:
	 *
	 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
	 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
	 *
	 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
	 *
	 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
	 *     incorrect length in some situations.

	 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
	 * get the Object implementation, which is slower but behaves correctly.
	 */
	Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined
	  ? global$1.TYPED_ARRAY_SUPPORT
	  : true;

	function kMaxLength () {
	  return Buffer.TYPED_ARRAY_SUPPORT
	    ? 0x7fffffff
	    : 0x3fffffff
	}

	function createBuffer (that, length) {
	  if (kMaxLength() < length) {
	    throw new RangeError('Invalid typed array length')
	  }
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = new Uint8Array(length);
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    if (that === null) {
	      that = new Buffer(length);
	    }
	    that.length = length;
	  }

	  return that
	}

	/**
	 * The Buffer constructor returns instances of `Uint8Array` that have their
	 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
	 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
	 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
	 * returns a single octet.
	 *
	 * The `Uint8Array` prototype remains unmodified.
	 */

	function Buffer (arg, encodingOrOffset, length) {
	  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
	    return new Buffer(arg, encodingOrOffset, length)
	  }

	  // Common case.
	  if (typeof arg === 'number') {
	    if (typeof encodingOrOffset === 'string') {
	      throw new Error(
	        'If encoding is specified then the first argument must be a string'
	      )
	    }
	    return allocUnsafe(this, arg)
	  }
	  return from$1(this, arg, encodingOrOffset, length)
	}

	Buffer.poolSize = 8192; // not used by this implementation

	// TODO: Legacy, not needed anymore. Remove in next major version.
	Buffer._augment = function (arr) {
	  arr.__proto__ = Buffer.prototype;
	  return arr
	};

	function from$1 (that, value, encodingOrOffset, length) {
	  if (typeof value === 'number') {
	    throw new TypeError('"value" argument must not be a number')
	  }

	  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
	    return fromArrayBuffer(that, value, encodingOrOffset, length)
	  }

	  if (typeof value === 'string') {
	    return fromString(that, value, encodingOrOffset)
	  }

	  return fromObject(that, value)
	}

	/**
	 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
	 * if value is a number.
	 * Buffer.from(str[, encoding])
	 * Buffer.from(array)
	 * Buffer.from(buffer)
	 * Buffer.from(arrayBuffer[, byteOffset[, length]])
	 **/
	Buffer.from = function (value, encodingOrOffset, length) {
	  return from$1(null, value, encodingOrOffset, length)
	};

	if (Buffer.TYPED_ARRAY_SUPPORT) {
	  Buffer.prototype.__proto__ = Uint8Array.prototype;
	  Buffer.__proto__ = Uint8Array;
	}

	function assertSize (size) {
	  if (typeof size !== 'number') {
	    throw new TypeError('"size" argument must be a number')
	  } else if (size < 0) {
	    throw new RangeError('"size" argument must not be negative')
	  }
	}

	function alloc (that, size, fill, encoding) {
	  assertSize(size);
	  if (size <= 0) {
	    return createBuffer(that, size)
	  }
	  if (fill !== undefined) {
	    // Only pay attention to encoding if it's a string. This
	    // prevents accidentally sending in a number that would
	    // be interpretted as a start offset.
	    return typeof encoding === 'string'
	      ? createBuffer(that, size).fill(fill, encoding)
	      : createBuffer(that, size).fill(fill)
	  }
	  return createBuffer(that, size)
	}

	/**
	 * Creates a new filled Buffer instance.
	 * alloc(size[, fill[, encoding]])
	 **/
	Buffer.alloc = function (size, fill, encoding) {
	  return alloc(null, size, fill, encoding)
	};

	function allocUnsafe (that, size) {
	  assertSize(size);
	  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) {
	    for (var i = 0; i < size; ++i) {
	      that[i] = 0;
	    }
	  }
	  return that
	}

	/**
	 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
	 * */
	Buffer.allocUnsafe = function (size) {
	  return allocUnsafe(null, size)
	};
	/**
	 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
	 */
	Buffer.allocUnsafeSlow = function (size) {
	  return allocUnsafe(null, size)
	};

	function fromString (that, string, encoding) {
	  if (typeof encoding !== 'string' || encoding === '') {
	    encoding = 'utf8';
	  }

	  if (!Buffer.isEncoding(encoding)) {
	    throw new TypeError('"encoding" must be a valid string encoding')
	  }

	  var length = byteLength(string, encoding) | 0;
	  that = createBuffer(that, length);

	  var actual = that.write(string, encoding);

	  if (actual !== length) {
	    // Writing a hex string, for example, that contains invalid characters will
	    // cause everything after the first invalid character to be ignored. (e.g.
	    // 'abxxcd' will be treated as 'ab')
	    that = that.slice(0, actual);
	  }

	  return that
	}

	function fromArrayLike (that, array) {
	  var length = array.length < 0 ? 0 : checked(array.length) | 0;
	  that = createBuffer(that, length);
	  for (var i = 0; i < length; i += 1) {
	    that[i] = array[i] & 255;
	  }
	  return that
	}

	function fromArrayBuffer (that, array, byteOffset, length) {
	  array.byteLength; // this throws if `array` is not a valid ArrayBuffer

	  if (byteOffset < 0 || array.byteLength < byteOffset) {
	    throw new RangeError('\'offset\' is out of bounds')
	  }

	  if (array.byteLength < byteOffset + (length || 0)) {
	    throw new RangeError('\'length\' is out of bounds')
	  }

	  if (byteOffset === undefined && length === undefined) {
	    array = new Uint8Array(array);
	  } else if (length === undefined) {
	    array = new Uint8Array(array, byteOffset);
	  } else {
	    array = new Uint8Array(array, byteOffset, length);
	  }

	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    // Return an augmented `Uint8Array` instance, for best performance
	    that = array;
	    that.__proto__ = Buffer.prototype;
	  } else {
	    // Fallback: Return an object instance of the Buffer class
	    that = fromArrayLike(that, array);
	  }
	  return that
	}

	function fromObject (that, obj) {
	  if (internalIsBuffer(obj)) {
	    var len = checked(obj.length) | 0;
	    that = createBuffer(that, len);

	    if (that.length === 0) {
	      return that
	    }

	    obj.copy(that, 0, 0, len);
	    return that
	  }

	  if (obj) {
	    if ((typeof ArrayBuffer !== 'undefined' &&
	        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
	      if (typeof obj.length !== 'number' || isnan(obj.length)) {
	        return createBuffer(that, 0)
	      }
	      return fromArrayLike(that, obj)
	    }

	    if (obj.type === 'Buffer' && isArray(obj.data)) {
	      return fromArrayLike(that, obj.data)
	    }
	  }

	  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
	}

	function checked (length) {
	  // Note: cannot use `length < kMaxLength()` here because that fails when
	  // length is NaN (which is otherwise coerced to zero.)
	  if (length >= kMaxLength()) {
	    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
	                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
	  }
	  return length | 0
	}
	Buffer.isBuffer = isBuffer;
	function internalIsBuffer (b) {
	  return !!(b != null && b._isBuffer)
	}

	Buffer.compare = function compare (a, b) {
	  if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
	    throw new TypeError('Arguments must be Buffers')
	  }

	  if (a === b) return 0

	  var x = a.length;
	  var y = b.length;

	  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
	    if (a[i] !== b[i]) {
	      x = a[i];
	      y = b[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	Buffer.isEncoding = function isEncoding (encoding) {
	  switch (String(encoding).toLowerCase()) {
	    case 'hex':
	    case 'utf8':
	    case 'utf-8':
	    case 'ascii':
	    case 'latin1':
	    case 'binary':
	    case 'base64':
	    case 'ucs2':
	    case 'ucs-2':
	    case 'utf16le':
	    case 'utf-16le':
	      return true
	    default:
	      return false
	  }
	};

	Buffer.concat = function concat (list, length) {
	  if (!isArray(list)) {
	    throw new TypeError('"list" argument must be an Array of Buffers')
	  }

	  if (list.length === 0) {
	    return Buffer.alloc(0)
	  }

	  var i;
	  if (length === undefined) {
	    length = 0;
	    for (i = 0; i < list.length; ++i) {
	      length += list[i].length;
	    }
	  }

	  var buffer = Buffer.allocUnsafe(length);
	  var pos = 0;
	  for (i = 0; i < list.length; ++i) {
	    var buf = list[i];
	    if (!internalIsBuffer(buf)) {
	      throw new TypeError('"list" argument must be an Array of Buffers')
	    }
	    buf.copy(buffer, pos);
	    pos += buf.length;
	  }
	  return buffer
	};

	function byteLength (string, encoding) {
	  if (internalIsBuffer(string)) {
	    return string.length
	  }
	  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
	      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
	    return string.byteLength
	  }
	  if (typeof string !== 'string') {
	    string = '' + string;
	  }

	  var len = string.length;
	  if (len === 0) return 0

	  // Use a for loop to avoid recursion
	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'ascii':
	      case 'latin1':
	      case 'binary':
	        return len
	      case 'utf8':
	      case 'utf-8':
	      case undefined:
	        return utf8ToBytes(string).length
	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return len * 2
	      case 'hex':
	        return len >>> 1
	      case 'base64':
	        return base64ToBytes(string).length
	      default:
	        if (loweredCase) return utf8ToBytes(string).length // assume utf8
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	}
	Buffer.byteLength = byteLength;

	function slowToString (encoding, start, end) {
	  var loweredCase = false;

	  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
	  // property of a typed array.

	  // This behaves neither like String nor Uint8Array in that we set start/end
	  // to their upper/lower bounds if the value passed is out of range.
	  // undefined is handled specially as per ECMA-262 6th Edition,
	  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
	  if (start === undefined || start < 0) {
	    start = 0;
	  }
	  // Return early if start > this.length. Done here to prevent potential uint32
	  // coercion fail below.
	  if (start > this.length) {
	    return ''
	  }

	  if (end === undefined || end > this.length) {
	    end = this.length;
	  }

	  if (end <= 0) {
	    return ''
	  }

	  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
	  end >>>= 0;
	  start >>>= 0;

	  if (end <= start) {
	    return ''
	  }

	  if (!encoding) encoding = 'utf8';

	  while (true) {
	    switch (encoding) {
	      case 'hex':
	        return hexSlice(this, start, end)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Slice(this, start, end)

	      case 'ascii':
	        return asciiSlice(this, start, end)

	      case 'latin1':
	      case 'binary':
	        return latin1Slice(this, start, end)

	      case 'base64':
	        return base64Slice(this, start, end)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return utf16leSlice(this, start, end)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = (encoding + '').toLowerCase();
	        loweredCase = true;
	    }
	  }
	}

	// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
	// Buffer instances.
	Buffer.prototype._isBuffer = true;

	function swap (b, n, m) {
	  var i = b[n];
	  b[n] = b[m];
	  b[m] = i;
	}

	Buffer.prototype.swap16 = function swap16 () {
	  var len = this.length;
	  if (len % 2 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 16-bits')
	  }
	  for (var i = 0; i < len; i += 2) {
	    swap(this, i, i + 1);
	  }
	  return this
	};

	Buffer.prototype.swap32 = function swap32 () {
	  var len = this.length;
	  if (len % 4 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 32-bits')
	  }
	  for (var i = 0; i < len; i += 4) {
	    swap(this, i, i + 3);
	    swap(this, i + 1, i + 2);
	  }
	  return this
	};

	Buffer.prototype.swap64 = function swap64 () {
	  var len = this.length;
	  if (len % 8 !== 0) {
	    throw new RangeError('Buffer size must be a multiple of 64-bits')
	  }
	  for (var i = 0; i < len; i += 8) {
	    swap(this, i, i + 7);
	    swap(this, i + 1, i + 6);
	    swap(this, i + 2, i + 5);
	    swap(this, i + 3, i + 4);
	  }
	  return this
	};

	Buffer.prototype.toString = function toString () {
	  var length = this.length | 0;
	  if (length === 0) return ''
	  if (arguments.length === 0) return utf8Slice(this, 0, length)
	  return slowToString.apply(this, arguments)
	};

	Buffer.prototype.equals = function equals (b) {
	  if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
	  if (this === b) return true
	  return Buffer.compare(this, b) === 0
	};

	Buffer.prototype.inspect = function inspect () {
	  var str = '';
	  var max = INSPECT_MAX_BYTES;
	  if (this.length > 0) {
	    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
	    if (this.length > max) str += ' ... ';
	  }
	  return '<Buffer ' + str + '>'
	};

	Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
	  if (!internalIsBuffer(target)) {
	    throw new TypeError('Argument must be a Buffer')
	  }

	  if (start === undefined) {
	    start = 0;
	  }
	  if (end === undefined) {
	    end = target ? target.length : 0;
	  }
	  if (thisStart === undefined) {
	    thisStart = 0;
	  }
	  if (thisEnd === undefined) {
	    thisEnd = this.length;
	  }

	  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
	    throw new RangeError('out of range index')
	  }

	  if (thisStart >= thisEnd && start >= end) {
	    return 0
	  }
	  if (thisStart >= thisEnd) {
	    return -1
	  }
	  if (start >= end) {
	    return 1
	  }

	  start >>>= 0;
	  end >>>= 0;
	  thisStart >>>= 0;
	  thisEnd >>>= 0;

	  if (this === target) return 0

	  var x = thisEnd - thisStart;
	  var y = end - start;
	  var len = Math.min(x, y);

	  var thisCopy = this.slice(thisStart, thisEnd);
	  var targetCopy = target.slice(start, end);

	  for (var i = 0; i < len; ++i) {
	    if (thisCopy[i] !== targetCopy[i]) {
	      x = thisCopy[i];
	      y = targetCopy[i];
	      break
	    }
	  }

	  if (x < y) return -1
	  if (y < x) return 1
	  return 0
	};

	// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
	// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
	//
	// Arguments:
	// - buffer - a Buffer to search
	// - val - a string, Buffer, or number
	// - byteOffset - an index into `buffer`; will be clamped to an int32
	// - encoding - an optional encoding, relevant is val is a string
	// - dir - true for indexOf, false for lastIndexOf
	function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
	  // Empty buffer means no match
	  if (buffer.length === 0) return -1

	  // Normalize byteOffset
	  if (typeof byteOffset === 'string') {
	    encoding = byteOffset;
	    byteOffset = 0;
	  } else if (byteOffset > 0x7fffffff) {
	    byteOffset = 0x7fffffff;
	  } else if (byteOffset < -0x80000000) {
	    byteOffset = -0x80000000;
	  }
	  byteOffset = +byteOffset;  // Coerce to Number.
	  if (isNaN(byteOffset)) {
	    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
	    byteOffset = dir ? 0 : (buffer.length - 1);
	  }

	  // Normalize byteOffset: negative offsets start from the end of the buffer
	  if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
	  if (byteOffset >= buffer.length) {
	    if (dir) return -1
	    else byteOffset = buffer.length - 1;
	  } else if (byteOffset < 0) {
	    if (dir) byteOffset = 0;
	    else return -1
	  }

	  // Normalize val
	  if (typeof val === 'string') {
	    val = Buffer.from(val, encoding);
	  }

	  // Finally, search either indexOf (if dir is true) or lastIndexOf
	  if (internalIsBuffer(val)) {
	    // Special case: looking for empty string/buffer always fails
	    if (val.length === 0) {
	      return -1
	    }
	    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
	  } else if (typeof val === 'number') {
	    val = val & 0xFF; // Search for a byte value [0-255]
	    if (Buffer.TYPED_ARRAY_SUPPORT &&
	        typeof Uint8Array.prototype.indexOf === 'function') {
	      if (dir) {
	        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
	      } else {
	        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
	      }
	    }
	    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
	  }

	  throw new TypeError('val must be string, number or Buffer')
	}

	function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
	  var indexSize = 1;
	  var arrLength = arr.length;
	  var valLength = val.length;

	  if (encoding !== undefined) {
	    encoding = String(encoding).toLowerCase();
	    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
	        encoding === 'utf16le' || encoding === 'utf-16le') {
	      if (arr.length < 2 || val.length < 2) {
	        return -1
	      }
	      indexSize = 2;
	      arrLength /= 2;
	      valLength /= 2;
	      byteOffset /= 2;
	    }
	  }

	  function read$$1 (buf, i) {
	    if (indexSize === 1) {
	      return buf[i]
	    } else {
	      return buf.readUInt16BE(i * indexSize)
	    }
	  }

	  var i;
	  if (dir) {
	    var foundIndex = -1;
	    for (i = byteOffset; i < arrLength; i++) {
	      if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
	        if (foundIndex === -1) foundIndex = i;
	        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
	      } else {
	        if (foundIndex !== -1) i -= i - foundIndex;
	        foundIndex = -1;
	      }
	    }
	  } else {
	    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
	    for (i = byteOffset; i >= 0; i--) {
	      var found = true;
	      for (var j = 0; j < valLength; j++) {
	        if (read$$1(arr, i + j) !== read$$1(val, j)) {
	          found = false;
	          break
	        }
	      }
	      if (found) return i
	    }
	  }

	  return -1
	}

	Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
	  return this.indexOf(val, byteOffset, encoding) !== -1
	};

	Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
	};

	Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
	  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
	};

	function hexWrite (buf, string, offset, length) {
	  offset = Number(offset) || 0;
	  var remaining = buf.length - offset;
	  if (!length) {
	    length = remaining;
	  } else {
	    length = Number(length);
	    if (length > remaining) {
	      length = remaining;
	    }
	  }

	  // must be an even number of digits
	  var strLen = string.length;
	  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

	  if (length > strLen / 2) {
	    length = strLen / 2;
	  }
	  for (var i = 0; i < length; ++i) {
	    var parsed = parseInt(string.substr(i * 2, 2), 16);
	    if (isNaN(parsed)) return i
	    buf[offset + i] = parsed;
	  }
	  return i
	}

	function utf8Write (buf, string, offset, length) {
	  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
	}

	function asciiWrite (buf, string, offset, length) {
	  return blitBuffer(asciiToBytes(string), buf, offset, length)
	}

	function latin1Write (buf, string, offset, length) {
	  return asciiWrite(buf, string, offset, length)
	}

	function base64Write (buf, string, offset, length) {
	  return blitBuffer(base64ToBytes(string), buf, offset, length)
	}

	function ucs2Write (buf, string, offset, length) {
	  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
	}

	Buffer.prototype.write = function write$$1 (string, offset, length, encoding) {
	  // Buffer#write(string)
	  if (offset === undefined) {
	    encoding = 'utf8';
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, encoding)
	  } else if (length === undefined && typeof offset === 'string') {
	    encoding = offset;
	    length = this.length;
	    offset = 0;
	  // Buffer#write(string, offset[, length][, encoding])
	  } else if (isFinite(offset)) {
	    offset = offset | 0;
	    if (isFinite(length)) {
	      length = length | 0;
	      if (encoding === undefined) encoding = 'utf8';
	    } else {
	      encoding = length;
	      length = undefined;
	    }
	  // legacy write(string, encoding, offset, length) - remove in v0.13
	  } else {
	    throw new Error(
	      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
	    )
	  }

	  var remaining = this.length - offset;
	  if (length === undefined || length > remaining) length = remaining;

	  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
	    throw new RangeError('Attempt to write outside buffer bounds')
	  }

	  if (!encoding) encoding = 'utf8';

	  var loweredCase = false;
	  for (;;) {
	    switch (encoding) {
	      case 'hex':
	        return hexWrite(this, string, offset, length)

	      case 'utf8':
	      case 'utf-8':
	        return utf8Write(this, string, offset, length)

	      case 'ascii':
	        return asciiWrite(this, string, offset, length)

	      case 'latin1':
	      case 'binary':
	        return latin1Write(this, string, offset, length)

	      case 'base64':
	        // Warning: maxLength not taken into account in base64Write
	        return base64Write(this, string, offset, length)

	      case 'ucs2':
	      case 'ucs-2':
	      case 'utf16le':
	      case 'utf-16le':
	        return ucs2Write(this, string, offset, length)

	      default:
	        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
	        encoding = ('' + encoding).toLowerCase();
	        loweredCase = true;
	    }
	  }
	};

	Buffer.prototype.toJSON = function toJSON () {
	  return {
	    type: 'Buffer',
	    data: Array.prototype.slice.call(this._arr || this, 0)
	  }
	};

	function base64Slice (buf, start, end) {
	  if (start === 0 && end === buf.length) {
	    return fromByteArray(buf)
	  } else {
	    return fromByteArray(buf.slice(start, end))
	  }
	}

	function utf8Slice (buf, start, end) {
	  end = Math.min(buf.length, end);
	  var res = [];

	  var i = start;
	  while (i < end) {
	    var firstByte = buf[i];
	    var codePoint = null;
	    var bytesPerSequence = (firstByte > 0xEF) ? 4
	      : (firstByte > 0xDF) ? 3
	      : (firstByte > 0xBF) ? 2
	      : 1;

	    if (i + bytesPerSequence <= end) {
	      var secondByte, thirdByte, fourthByte, tempCodePoint;

	      switch (bytesPerSequence) {
	        case 1:
	          if (firstByte < 0x80) {
	            codePoint = firstByte;
	          }
	          break
	        case 2:
	          secondByte = buf[i + 1];
	          if ((secondByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
	            if (tempCodePoint > 0x7F) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 3:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
	            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
	              codePoint = tempCodePoint;
	            }
	          }
	          break
	        case 4:
	          secondByte = buf[i + 1];
	          thirdByte = buf[i + 2];
	          fourthByte = buf[i + 3];
	          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
	            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
	            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
	              codePoint = tempCodePoint;
	            }
	          }
	      }
	    }

	    if (codePoint === null) {
	      // we did not generate a valid codePoint so insert a
	      // replacement char (U+FFFD) and advance only 1 byte
	      codePoint = 0xFFFD;
	      bytesPerSequence = 1;
	    } else if (codePoint > 0xFFFF) {
	      // encode to utf16 (surrogate pair dance)
	      codePoint -= 0x10000;
	      res.push(codePoint >>> 10 & 0x3FF | 0xD800);
	      codePoint = 0xDC00 | codePoint & 0x3FF;
	    }

	    res.push(codePoint);
	    i += bytesPerSequence;
	  }

	  return decodeCodePointsArray(res)
	}

	// Based on http://stackoverflow.com/a/22747272/680742, the browser with
	// the lowest limit is Chrome, with 0x10000 args.
	// We go 1 magnitude less, for safety
	var MAX_ARGUMENTS_LENGTH = 0x1000;

	function decodeCodePointsArray (codePoints) {
	  var len = codePoints.length;
	  if (len <= MAX_ARGUMENTS_LENGTH) {
	    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
	  }

	  // Decode in chunks to avoid "call stack size exceeded".
	  var res = '';
	  var i = 0;
	  while (i < len) {
	    res += String.fromCharCode.apply(
	      String,
	      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
	    );
	  }
	  return res
	}

	function asciiSlice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i] & 0x7F);
	  }
	  return ret
	}

	function latin1Slice (buf, start, end) {
	  var ret = '';
	  end = Math.min(buf.length, end);

	  for (var i = start; i < end; ++i) {
	    ret += String.fromCharCode(buf[i]);
	  }
	  return ret
	}

	function hexSlice (buf, start, end) {
	  var len = buf.length;

	  if (!start || start < 0) start = 0;
	  if (!end || end < 0 || end > len) end = len;

	  var out = '';
	  for (var i = start; i < end; ++i) {
	    out += toHex(buf[i]);
	  }
	  return out
	}

	function utf16leSlice (buf, start, end) {
	  var bytes = buf.slice(start, end);
	  var res = '';
	  for (var i = 0; i < bytes.length; i += 2) {
	    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
	  }
	  return res
	}

	Buffer.prototype.slice = function slice (start, end) {
	  var len = this.length;
	  start = ~~start;
	  end = end === undefined ? len : ~~end;

	  if (start < 0) {
	    start += len;
	    if (start < 0) start = 0;
	  } else if (start > len) {
	    start = len;
	  }

	  if (end < 0) {
	    end += len;
	    if (end < 0) end = 0;
	  } else if (end > len) {
	    end = len;
	  }

	  if (end < start) end = start;

	  var newBuf;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    newBuf = this.subarray(start, end);
	    newBuf.__proto__ = Buffer.prototype;
	  } else {
	    var sliceLen = end - start;
	    newBuf = new Buffer(sliceLen, undefined);
	    for (var i = 0; i < sliceLen; ++i) {
	      newBuf[i] = this[i + start];
	    }
	  }

	  return newBuf
	};

	/*
	 * Need to make sure that buffer isn't trying to write out of bounds.
	 */
	function checkOffset (offset, ext, length) {
	  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
	  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
	}

	Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    checkOffset(offset, byteLength, this.length);
	  }

	  var val = this[offset + --byteLength];
	  var mul = 1;
	  while (byteLength > 0 && (mul *= 0x100)) {
	    val += this[offset + --byteLength] * mul;
	  }

	  return val
	};

	Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  return this[offset]
	};

	Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return this[offset] | (this[offset + 1] << 8)
	};

	Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  return (this[offset] << 8) | this[offset + 1]
	};

	Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return ((this[offset]) |
	      (this[offset + 1] << 8) |
	      (this[offset + 2] << 16)) +
	      (this[offset + 3] * 0x1000000)
	};

	Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] * 0x1000000) +
	    ((this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    this[offset + 3])
	};

	Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var val = this[offset];
	  var mul = 1;
	  var i = 0;
	  while (++i < byteLength && (mul *= 0x100)) {
	    val += this[offset + i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) checkOffset(offset, byteLength, this.length);

	  var i = byteLength;
	  var mul = 1;
	  var val = this[offset + --i];
	  while (i > 0 && (mul *= 0x100)) {
	    val += this[offset + --i] * mul;
	  }
	  mul *= 0x80;

	  if (val >= mul) val -= Math.pow(2, 8 * byteLength);

	  return val
	};

	Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 1, this.length);
	  if (!(this[offset] & 0x80)) return (this[offset])
	  return ((0xff - this[offset] + 1) * -1)
	};

	Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset] | (this[offset + 1] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 2, this.length);
	  var val = this[offset + 1] | (this[offset] << 8);
	  return (val & 0x8000) ? val | 0xFFFF0000 : val
	};

	Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset]) |
	    (this[offset + 1] << 8) |
	    (this[offset + 2] << 16) |
	    (this[offset + 3] << 24)
	};

	Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);

	  return (this[offset] << 24) |
	    (this[offset + 1] << 16) |
	    (this[offset + 2] << 8) |
	    (this[offset + 3])
	};

	Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, true, 23, 4)
	};

	Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 4, this.length);
	  return read(this, offset, false, 23, 4)
	};

	Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, true, 52, 8)
	};

	Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
	  if (!noAssert) checkOffset(offset, 8, this.length);
	  return read(this, offset, false, 52, 8)
	};

	function checkInt (buf, value, offset, ext, max, min) {
	  if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
	  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	}

	Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var mul = 1;
	  var i = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  byteLength = byteLength | 0;
	  if (!noAssert) {
	    var maxBytes = Math.pow(2, 8 * byteLength) - 1;
	    checkInt(this, value, offset, byteLength, maxBytes, 0);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    this[offset + i] = (value / mul) & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	function objectWriteUInt16 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
	    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
	      (littleEndian ? i : 1 - i) * 8;
	  }
	}

	Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	function objectWriteUInt32 (buf, value, offset, littleEndian) {
	  if (value < 0) value = 0xffffffff + value + 1;
	  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
	    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
	  }
	}

	Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset + 3] = (value >>> 24);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 1] = (value >>> 8);
	    this[offset] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = 0;
	  var mul = 1;
	  var sub = 0;
	  this[offset] = value & 0xFF;
	  while (++i < byteLength && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) {
	    var limit = Math.pow(2, 8 * byteLength - 1);

	    checkInt(this, value, offset, byteLength, limit - 1, -limit);
	  }

	  var i = byteLength - 1;
	  var mul = 1;
	  var sub = 0;
	  this[offset + i] = value & 0xFF;
	  while (--i >= 0 && (mul *= 0x100)) {
	    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
	      sub = 1;
	    }
	    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
	  }

	  return offset + byteLength
	};

	Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
	  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
	  if (value < 0) value = 0xff + value + 1;
	  this[offset] = (value & 0xff);
	  return offset + 1
	};

	Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	  } else {
	    objectWriteUInt16(this, value, offset, true);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 8);
	    this[offset + 1] = (value & 0xff);
	  } else {
	    objectWriteUInt16(this, value, offset, false);
	  }
	  return offset + 2
	};

	Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value & 0xff);
	    this[offset + 1] = (value >>> 8);
	    this[offset + 2] = (value >>> 16);
	    this[offset + 3] = (value >>> 24);
	  } else {
	    objectWriteUInt32(this, value, offset, true);
	  }
	  return offset + 4
	};

	Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
	  value = +value;
	  offset = offset | 0;
	  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
	  if (value < 0) value = 0xffffffff + value + 1;
	  if (Buffer.TYPED_ARRAY_SUPPORT) {
	    this[offset] = (value >>> 24);
	    this[offset + 1] = (value >>> 16);
	    this[offset + 2] = (value >>> 8);
	    this[offset + 3] = (value & 0xff);
	  } else {
	    objectWriteUInt32(this, value, offset, false);
	  }
	  return offset + 4
	};

	function checkIEEE754 (buf, value, offset, ext, max, min) {
	  if (offset + ext > buf.length) throw new RangeError('Index out of range')
	  if (offset < 0) throw new RangeError('Index out of range')
	}

	function writeFloat (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
	  }
	  write(buf, value, offset, littleEndian, 23, 4);
	  return offset + 4
	}

	Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
	  return writeFloat(this, value, offset, false, noAssert)
	};

	function writeDouble (buf, value, offset, littleEndian, noAssert) {
	  if (!noAssert) {
	    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
	  }
	  write(buf, value, offset, littleEndian, 52, 8);
	  return offset + 8
	}

	Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, true, noAssert)
	};

	Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
	  return writeDouble(this, value, offset, false, noAssert)
	};

	// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
	Buffer.prototype.copy = function copy (target, targetStart, start, end) {
	  if (!start) start = 0;
	  if (!end && end !== 0) end = this.length;
	  if (targetStart >= target.length) targetStart = target.length;
	  if (!targetStart) targetStart = 0;
	  if (end > 0 && end < start) end = start;

	  // Copy 0 bytes; we're done
	  if (end === start) return 0
	  if (target.length === 0 || this.length === 0) return 0

	  // Fatal error conditions
	  if (targetStart < 0) {
	    throw new RangeError('targetStart out of bounds')
	  }
	  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
	  if (end < 0) throw new RangeError('sourceEnd out of bounds')

	  // Are we oob?
	  if (end > this.length) end = this.length;
	  if (target.length - targetStart < end - start) {
	    end = target.length - targetStart + start;
	  }

	  var len = end - start;
	  var i;

	  if (this === target && start < targetStart && targetStart < end) {
	    // descending copy from end
	    for (i = len - 1; i >= 0; --i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
	    // ascending copy from start
	    for (i = 0; i < len; ++i) {
	      target[i + targetStart] = this[i + start];
	    }
	  } else {
	    Uint8Array.prototype.set.call(
	      target,
	      this.subarray(start, start + len),
	      targetStart
	    );
	  }

	  return len
	};

	// Usage:
	//    buffer.fill(number[, offset[, end]])
	//    buffer.fill(buffer[, offset[, end]])
	//    buffer.fill(string[, offset[, end]][, encoding])
	Buffer.prototype.fill = function fill (val, start, end, encoding) {
	  // Handle string cases:
	  if (typeof val === 'string') {
	    if (typeof start === 'string') {
	      encoding = start;
	      start = 0;
	      end = this.length;
	    } else if (typeof end === 'string') {
	      encoding = end;
	      end = this.length;
	    }
	    if (val.length === 1) {
	      var code = val.charCodeAt(0);
	      if (code < 256) {
	        val = code;
	      }
	    }
	    if (encoding !== undefined && typeof encoding !== 'string') {
	      throw new TypeError('encoding must be a string')
	    }
	    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
	      throw new TypeError('Unknown encoding: ' + encoding)
	    }
	  } else if (typeof val === 'number') {
	    val = val & 255;
	  }

	  // Invalid ranges are not set to a default, so can range check early.
	  if (start < 0 || this.length < start || this.length < end) {
	    throw new RangeError('Out of range index')
	  }

	  if (end <= start) {
	    return this
	  }

	  start = start >>> 0;
	  end = end === undefined ? this.length : end >>> 0;

	  if (!val) val = 0;

	  var i;
	  if (typeof val === 'number') {
	    for (i = start; i < end; ++i) {
	      this[i] = val;
	    }
	  } else {
	    var bytes = internalIsBuffer(val)
	      ? val
	      : utf8ToBytes(new Buffer(val, encoding).toString());
	    var len = bytes.length;
	    for (i = 0; i < end - start; ++i) {
	      this[i + start] = bytes[i % len];
	    }
	  }

	  return this
	};

	// HELPER FUNCTIONS
	// ================

	var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

	function base64clean (str) {
	  // Node strips out invalid characters like \n and \t from the string, base64-js does not
	  str = stringtrim(str).replace(INVALID_BASE64_RE, '');
	  // Node converts strings with length < 2 to ''
	  if (str.length < 2) return ''
	  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
	  while (str.length % 4 !== 0) {
	    str = str + '=';
	  }
	  return str
	}

	function stringtrim (str) {
	  if (str.trim) return str.trim()
	  return str.replace(/^\s+|\s+$/g, '')
	}

	function toHex (n) {
	  if (n < 16) return '0' + n.toString(16)
	  return n.toString(16)
	}

	function utf8ToBytes (string, units) {
	  units = units || Infinity;
	  var codePoint;
	  var length = string.length;
	  var leadSurrogate = null;
	  var bytes = [];

	  for (var i = 0; i < length; ++i) {
	    codePoint = string.charCodeAt(i);

	    // is surrogate component
	    if (codePoint > 0xD7FF && codePoint < 0xE000) {
	      // last char was a lead
	      if (!leadSurrogate) {
	        // no lead yet
	        if (codePoint > 0xDBFF) {
	          // unexpected trail
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        } else if (i + 1 === length) {
	          // unpaired lead
	          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	          continue
	        }

	        // valid lead
	        leadSurrogate = codePoint;

	        continue
	      }

	      // 2 leads in a row
	      if (codePoint < 0xDC00) {
	        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	        leadSurrogate = codePoint;
	        continue
	      }

	      // valid surrogate pair
	      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
	    } else if (leadSurrogate) {
	      // valid bmp char, but last char was a lead
	      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
	    }

	    leadSurrogate = null;

	    // encode utf8
	    if (codePoint < 0x80) {
	      if ((units -= 1) < 0) break
	      bytes.push(codePoint);
	    } else if (codePoint < 0x800) {
	      if ((units -= 2) < 0) break
	      bytes.push(
	        codePoint >> 0x6 | 0xC0,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x10000) {
	      if ((units -= 3) < 0) break
	      bytes.push(
	        codePoint >> 0xC | 0xE0,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else if (codePoint < 0x110000) {
	      if ((units -= 4) < 0) break
	      bytes.push(
	        codePoint >> 0x12 | 0xF0,
	        codePoint >> 0xC & 0x3F | 0x80,
	        codePoint >> 0x6 & 0x3F | 0x80,
	        codePoint & 0x3F | 0x80
	      );
	    } else {
	      throw new Error('Invalid code point')
	    }
	  }

	  return bytes
	}

	function asciiToBytes (str) {
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    // Node's code seems to be doing this and not & 0x7F..
	    byteArray.push(str.charCodeAt(i) & 0xFF);
	  }
	  return byteArray
	}

	function utf16leToBytes (str, units) {
	  var c, hi, lo;
	  var byteArray = [];
	  for (var i = 0; i < str.length; ++i) {
	    if ((units -= 2) < 0) break

	    c = str.charCodeAt(i);
	    hi = c >> 8;
	    lo = c % 256;
	    byteArray.push(lo);
	    byteArray.push(hi);
	  }

	  return byteArray
	}


	function base64ToBytes (str) {
	  return toByteArray(base64clean(str))
	}

	function blitBuffer (src, dst, offset, length) {
	  for (var i = 0; i < length; ++i) {
	    if ((i + offset >= dst.length) || (i >= src.length)) break
	    dst[i + offset] = src[i];
	  }
	  return i
	}

	function isnan (val) {
	  return val !== val // eslint-disable-line no-self-compare
	}


	// the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	function isBuffer(obj) {
	  return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
	}

	function isFastBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
	}

	/**
	 * A fast recursive equality check, which covers limited use cases.
	 *
	 * @param {Object}
	 * @param {Object}
	 * @return {Boolean}
	 */
	function deepEqual (a, b) {
	  var key, value, compare, aLength = 0, bLength = 0;

	  // If they are the same object, don't need to go further.
	  if (a === b) return true

	  // Both objects must be defined.
	  if (!a || !b) return false

	  // Objects must be of the same type.
	  if (a.prototype !== b.prototype) return false

	  for (key in a) {
	    aLength++;
	    value = a[key];
	    compare = b[key];

	    if (typeof value === 'object') {
	      if (typeof compare !== 'object' || !deepEqual(value, compare))
	        return false
	      continue
	    }

	    if (isBuffer(value)) {
	      if (!isBuffer(compare) || !value.equals(compare))
	        return false
	      continue
	    }

	    if (value && typeof value.getTime === 'function') {
	      if (!compare || typeof compare.getTime !== 'function' ||
	        value.getTime() !== compare.getTime())
	        return false
	      continue
	    }

	    if (value !== compare) return false
	  }

	  for (key in b) bLength++;

	  // Keys must be of same length.
	  return aLength === bLength
	}


	var deep_equal = deepEqual;

	var message_1 = message;


	/**
	 * Message function for i18n.
	 *
	 * @param {String} id
	 * @param {String} language
	 * @param {Object} [data]
	 * @return {String}
	 */
	function message (id, language$$1, data) {
	  var genericMessage = 'GenericError';
	  var str, key, subtag;

	  if (!message.hasOwnProperty(language$$1)) {
	    subtag = language$$1 && language$$1.match(/.+?(?=-)/);
	    if (subtag) subtag = subtag[0];
	    if (message.hasOwnProperty(subtag)) language$$1 = subtag;
	    else language$$1 = message.defaultLanguage;
	  }

	  if (!message[language$$1].hasOwnProperty(id))
	    return message[language$$1][genericMessage] || message.en[genericMessage]

	  str = message[language$$1][id];

	  for (key in data) str = str.replace('{' + key + '}', data[key]);

	  return str
	}

	// Assign fallback language to "en".
	Object.defineProperty(message, 'defaultLanguage', {
	  value: 'en', writable: true
	});

	// Copy function, useful for not writing over the main function.
	Object.defineProperty(message, 'copy', {
	  value: function () {
	    /* eslint-disable no-new-func */
	    var fn = new Function('return ' + message.toString())();
	    /* eslint-enable no-new-func */
	    var lang;

	    Object.defineProperty(fn, 'defaultLanguage', {
	      value: 'en', writable: true
	    });

	    for (lang in message)
	      fn[lang] = message[lang];

	    return fn
	  }
	});

	// Default language messages.
	/* eslint-disable max-len */
	message.en = {
	  'GenericError': 'An internal error occurred.',

	  // Various errors.
	  'MalformedRequest': 'The request was malformed.',
	  'InvalidBody': 'The request body is invalid.',
	  'SerializerNotFound': 'The serializer for "{id}" does not exist.',
	  'InputOnly': 'Input only.',
	  'InvalidID': 'An ID is invalid.',
	  'DateISO8601': 'Date string must be an ISO 8601 formatted string.',
	  'DateInvalid': 'Date value is invalid.',
	  'BufferEncoding': 'Buffer value must be a {bufferEncoding}-encoded string.',
	  'JSONParse': 'Could not parse value as JSON.',
	  'MissingPayload': 'Payload is missing.',
	  'SpecifiedIDs': 'IDs should not be specified.',
	  'InvalidURL': 'Invalid URL.',
	  'RelatedRecordNotFound': 'A related record for the field "{field}" was not found.',
	  'CreateRecordsInvalid': 'There are no valid records to be created.',
	  'CreateRecordsFail': 'Records could not be created.',
	  'CreateRecordMissingID': 'An ID on a created record is missing.',
	  'DeleteRecordsMissingID': 'IDs are required for deleting records.',
	  'DeleteRecordsInvalid': 'A record to be deleted could not be found.',
	  'DeleteRecordsFail': 'Not all records specified could be deleted.',
	  'UnspecifiedType': 'The type is unspecified.',
	  'InvalidType': 'The requested type "{type}" is not a valid type.',
	  'InvalidLink': 'The field "{field}" does not define a link.',
	  'InvalidMethod': 'The method "{method}" is unrecognized.',
	  'CollisionToOne': 'Multiple records can not have the same to-one link value on the field "{field}".',
	  'CollisionDuplicate': 'Duplicate ID "{id}" in the field "{field}".',
	  'UpdateRecordMissing': 'A record to be updated could not be found.',
	  'UpdateRecordsInvalid': 'There are no valid updates.',
	  'UpdateRecordMissingID': 'An ID on an update is missing.',
	  'EnforceArrayType': 'The value of "{key}" is invalid, it must be an array with values of type "{type}".',
	  'EnforceArray': 'The value of "{key}" is invalid, it must be an array.',
	  'EnforceSameID': 'An ID of "{key}" is invalid, it cannot be the same ID of the record.',
	  'EnforceSingular': 'The value of "{key}" can not be an array, it must be a singular value.',
	  'EnforceValue': 'The value of "{key}" is invalid, it must be a "{type}".',
	  'EnforceValueArray': 'A value in the array of "{key}" is invalid, it must be a "{type}".',
	  'FieldsFormat': 'Fields format is invalid. It may either be inclusive or exclusive, but not both.',
	  'RecordExists': 'A record with ID "{id}" already exists.'
	};

	/**
	 * A more performant `Array.prototype.find`.
	 *
	 * @param {*[]} array
	 * @param {Function} fn
	 * @return {*}
	 */
	var find = function find (array, fn) {
	  var i, j, value, result;

	  for (i = 0, j = array.length; i < j; i++) {
	    value = array[i];
	    result = fn(value);
	    if (result) return value
	  }

	  return void 0
	};

	// Modified base64 with "+" as "-" and "/" as "_".
	var charset =
	  'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
	  'abcdefghijklmnopqrstuvwxyz' +
	  '0123456789-_';

	var charsetLength = charset.length;

	// Should be a multiple of 3 to avoid padding characters.
	var keyLength = 3 * 5;

	var generate_id = function generateId () {
	  var i, array = [];

	  for (i = 0; i < keyLength; i++)
	    array.push(charset.charAt(Math.floor(Math.random() * charsetLength)));

	  return array.join('')
	};

	var hasCaptureStackTrace = 'captureStackTrace' in Error;

	var errorClass_1 = errorClass;


	function errorClass (name) {
	  var ErrorClass;

	  if (!name || typeof name !== 'string')
	    throw new TypeError('Argument "name" must be a non-empty string.')

	  // This is basically `eval`, there's no other way to dynamically define a
	  // function name.
	  ErrorClass = new Function('setupError',
	    'return function ' + name + ' () { ' +
	    'if (!(this instanceof ' + name + ')) ' +
	    'return new (' + name + '.bind.apply(' + name +
	      ', Array.prototype.concat.apply([ null ], arguments))); ' +
	    'setupError.apply(this, arguments); ' +
	    '}')(setupError);

	  ErrorClass.prototype = Object.create(Error.prototype, {
	    constructor: nonEnumerableProperty(ErrorClass),
	    name: nonEnumerableProperty(name)
	  });

	  return ErrorClass
	}


	// Internal function to set up an error.
	function setupError (message) {
	  if (hasCaptureStackTrace)
	    // V8 specific method.
	    Error.captureStackTrace(this, this.constructor);
	  else
	    // Generic way to set the error stack trace.
	    Object.defineProperty(this, 'stack',
	      nonEnumerableProperty(Error(message).stack));

	  // Use the `+` operator with an empty string to implicitly type cast the
	  // `message` argument into a string.
	  Object.defineProperty(this, 'message',
	    nonEnumerableProperty(message !== void 0 ? '' + message : ''));
	}


	function nonEnumerableProperty (value) {
	  // The field `enumerable` is `false` by default.
	  return {
	    value: value,
	    writable: true,
	    configurable: true
	  }
	}

	/**
	 * Like `Object.assign`, but faster and more restricted in what it does.
	 *
	 * @param {Object} target
	 * @return {Object}
	 */
	var assign$1 = function assign (target) {
	  var i, j, key, source;

	  for (i = 1, j = arguments.length; i < j; i++) {
	    source = arguments[i];

	    if (source == null) continue

	    for (key in source)
	      target[key] = source[key];
	  }

	  return target
	};

	// Successes.
	var OK = successClass('OK');
	var Created = successClass('Created');
	var Empty = successClass('Empty');


	// Errors.
	var BadRequestError = errorClass_1('BadRequestError');
	var UnauthorizedError = errorClass_1('UnauthorizedError');
	var ForbiddenError = errorClass_1('ForbiddenError');
	var NotFoundError = errorClass_1('NotFoundError');
	var MethodError = errorClass_1('MethodError');
	var NotAcceptableError = errorClass_1('NotAcceptableError');
	var ConflictError = errorClass_1('ConflictError');
	var UnsupportedError = errorClass_1('UnsupportedError');
	var UnprocessableError = errorClass_1('UnprocessableError');


	// White-list native error types. The list is gathered from here:
	// https://developer.mozilla.org/en-US/docs/Web/JavaScript/
	// Reference/Global_Objects/Error
	var nativeErrors = [
	  Error, TypeError, ReferenceError, RangeError,
	  SyntaxError, EvalError, URIError
	];


	function successClass (name) {
	  return Function('assign', // eslint-disable-line
	    'return function ' + name + ' (x) { ' +
	    'assign(this, x) }')(assign$1)
	}

	var response_classes = {
		OK: OK,
		Created: Created,
		Empty: Empty,
		BadRequestError: BadRequestError,
		UnauthorizedError: UnauthorizedError,
		ForbiddenError: ForbiddenError,
		NotFoundError: NotFoundError,
		MethodError: MethodError,
		NotAcceptableError: NotAcceptableError,
		ConflictError: ConflictError,
		UnsupportedError: UnsupportedError,
		UnprocessableError: UnprocessableError,
		nativeErrors: nativeErrors
	};

	var BadRequestError$1 = response_classes.BadRequestError;
	var UnauthorizedError$1 = response_classes.UnauthorizedError;
	var ForbiddenError$1 = response_classes.ForbiddenError;
	var NotFoundError$1 = response_classes.NotFoundError;
	var MethodError$1 = response_classes.MethodError;
	var NotAcceptableError$1 = response_classes.NotAcceptableError;
	var ConflictError$1 = response_classes.ConflictError;
	var UnsupportedError$1 = response_classes.UnsupportedError;
	var UnprocessableError$1 = response_classes.UnprocessableError;
	var nativeErrors$1 = response_classes.nativeErrors;

	var errors$2 = {
		BadRequestError: BadRequestError$1,
		UnauthorizedError: UnauthorizedError$1,
		ForbiddenError: ForbiddenError$1,
		NotFoundError: NotFoundError$1,
		MethodError: MethodError$1,
		NotAcceptableError: NotAcceptableError$1,
		ConflictError: ConflictError$1,
		UnsupportedError: UnsupportedError$1,
		UnprocessableError: UnprocessableError$1,
		nativeErrors: nativeErrors$1
	};

	var constants = createCommonjsModule(function (module, exports) {

	var hasSymbol = typeof Symbol === 'function';
	var i, j, key;
	var privateKeys = [
	  // This is set on the field definition object internally if it is an
	  // automatically generated denormalized field.
	  'denormalizedInverse',

	  // Used to map update objects to records.
	  'updateRecord',

	  // Used to map update objects to a hash of linked records.
	  'linkedHash'
	];

	// The primary key that must exist per record, can not be user defined.
	exports.primary = 'id';

	// The names of certain reserved keys per field definition.
	exports.type = 'type';
	exports.link = 'link';
	exports.inverse = 'inverse';
	exports.isArray = 'isArray';

	// Should be reserved for private use.
	for (i = 0, j = privateKeys.length; i < j; i++) {
	  key = privateKeys[i];
	  exports[key] = hasSymbol ? Symbol(key) : '__' + key + '__';
	}

	// Events.
	exports.change = 'change';
	exports.sync = 'sync';
	exports.connect = 'connect';
	exports.disconnect = 'disconnect';
	exports.failure = 'failure';

	// Methods.
	exports.find = 'find';
	exports.create = 'create';
	exports.update = 'update';
	exports.delete = 'delete';
	});
	var constants_1 = constants.primary;
	var constants_2 = constants.type;
	var constants_3 = constants.link;
	var constants_4 = constants.inverse;
	var constants_5 = constants.isArray;
	var constants_6 = constants.change;
	var constants_7 = constants.sync;
	var constants_8 = constants.connect;
	var constants_9 = constants.disconnect;
	var constants_10 = constants.failure;
	var constants_11 = constants.find;
	var constants_12 = constants.create;
	var constants_13 = constants.update;

	var primary = constants.primary;
	var type = constants.type;
	var link = constants.link;
	var isArray$1 = constants.isArray;
	var inverse = constants.inverse;
	var denormalizedInverse = constants.denormalizedInverse;

	var keys = {
		primary: primary,
		type: type,
		link: link,
		isArray: isArray$1,
		inverse: inverse,
		denormalizedInverse: denormalizedInverse
	};

	var BadRequestError$2 = errors$2.BadRequestError;


	var primaryKey = keys.primary;
	var typeKey = keys.type;
	var isArrayKey = keys.isArray;

	// For complex types.
	var matchCheck = [
	  [ Date, function (a, b) { return a.getTime() === b.getTime() } ],
	  [ Buffer, function (a, b) { return a.equals(b) } ],
	  [ Object, function (a, b) { return deep_equal(a, b) } ]
	];

	// For comparing sort order.
	var comparisons = [
	  [ Number, function (a, b) { return a - b } ],
	  [ String, function (a, b) { return a === b ? 0 : a > b ? 1 : -1 } ],
	  [ Boolean, function (a, b) { return a === b ? 0 : a ? 1 : -1 } ],
	  [ Date, function (a, b) { return a.getTime() - b.getTime() } ],
	  [ Buffer, Buffer.compare ],

	  // There is no comparison here that makes sense, so this should simply be a
	  // no-op by default.
	  [ Object, function () { return 0 } ]
	];


	// Browser-safe ID generation.
	var generateId_1 = generate_id;


	var applyOptions = function (fields, records, options, meta) {
	  var count, record, field, isInclude, isExclude, language$$1, memoizedRecords;
	  var i, j;

	  if (!options) options = {};
	  if (!meta) meta = {};

	  language$$1 = meta.language;

	  // Apply filters.
	  if (options) {
	    memoizedRecords = records;
	    records = [];
	    for (i = 0, j = memoizedRecords.length; i < j; i++) {
	      record = memoizedRecords[i];
	      if (match(fields, options, record))
	        records.push(record);
	    }
	  }

	  count = records.length;

	  if ('fields' in options) {
	    isInclude = !find(Object.keys(options.fields),
	      function (field) { return !options.fields[field] });
	    isExclude = !find(Object.keys(options.fields),
	      function (field) { return options.fields[field] });

	    if (!isInclude && !isExclude)
	      throw new BadRequestError$2(message_1('FieldsFormat', language$$1))

	    for (i = 0, j = records.length; i < j; i++) {
	      record = records[i];
	      for (field in record) {
	        if (field === primaryKey) continue
	        if ((isInclude && !(options.fields.hasOwnProperty(field))) ||
	          (isExclude && options.fields.hasOwnProperty(field)))
	          delete record[field];
	      }
	    }
	  }

	  if ('sort' in options)
	    records = records.sort(compare(fields, options.sort));

	  if ('limit' in options || 'offset' in options)
	    records = records.slice(options.offset, options.limit ?
	      (options.offset || 0) + options.limit : records.length);

	  records.count = count;

	  return records
	};


	function check (type, a, b) {
	  var matcher;

	  if (b === null) return a === null
	  if (!type) return a === b
	  if (type.compare) return type.compare(a, b) === 0

	  matcher = find(matchCheck, function (pair) {
	    return pair[0] === type.prototype.constructor
	  });
	  if (matcher) return matcher[1](a, b)

	  return a === b
	}


	function checkValue (fieldDefinition, a) {
	  return function (b) {
	    return fieldDefinition[isArrayKey] ?
	      find(a, function (a) {
	        return check(fieldDefinition[typeKey], b, a)
	      }) : check(fieldDefinition[typeKey], b, a)
	  }
	}

	function match (fields, options, record) {
	  var key;

	  for (key in options)
	    switch (key) {
	    case 'and':
	      if (!matchByLogicalAnd(fields, options[key], record)) return false
	      break
	    case 'or':
	      if (!matchByLogicalOr(fields, options[key], record)) return false
	      break
	    case 'not':
	      if (match(fields, options[key], record)) return false
	      break
	    case 'range':
	      if (!matchByRange(fields, options[key], record)) return false
	      break
	    case 'match':
	      if (!matchByField(fields, options[key], record)) return false
	      break
	    case 'exists':
	      if (!matchByExistence(fields, options[key], record)) return false
	      break
	    default:
	    }

	  return true
	}

	function matchByLogicalAnd (fields, clauses, record) {
	  var i;

	  for (i = 0; i < clauses.length; i++)
	    if (!match(fields, clauses[i], record)) return false

	  return true
	}

	function matchByLogicalOr (fields, clauses, record) {
	  var i;

	  for (i = 0; i < clauses.length; i++)
	    if (match(fields, clauses[i], record)) return true

	  return false
	}

	function matchByField (fields, match, record) {
	  var field, matches;

	  for (field in match) {
	    matches = match[field];
	    if (!Array.isArray(matches)) matches = [ matches ];
	    if (find(matches, checkValue(fields[field], record[field])) === void 0)
	      return false
	  }

	  return true
	}


	function matchByExistence (fields, exists, record) {
	  var field, value, isArray;

	  for (field in exists) {
	    value = record[field];
	    isArray = fields[field][isArrayKey];
	    if (exists[field]) {
	      if (!value) return false
	      if (isArray && !value.length) return false
	    }
	    else {
	      if (value && !isArray) return false
	      if (isArray && value.length) return false
	    }
	  }

	  return true
	}


	function matchByRange (fields, ranges, record) {
	  var compare = {};
	  var field, fieldDefinition, fieldType, fieldIsArray, range, value;

	  for (field in ranges) {
	    fieldDefinition = fields[field];
	    fieldType = fieldDefinition[typeKey];
	    fieldIsArray = fieldDefinition[isArrayKey];

	    // Skip for singular link fields.
	    if (!fieldType && !fieldIsArray) continue

	    range = ranges[field];
	    value = record[field];

	    if (value == null) return false
	    if (fieldIsArray) value = value ? value.length : 0;

	    if (!compare[field])
	      compare[field] = !fieldIsArray ? fieldType.compare ||
	        find(comparisons, findByType(fieldType))[1] :
	        find(comparisons, findByType(Number))[1];

	    if (range[0] !== null && compare[field](value, range[0]) < 0)
	      return false

	    if (range[1] !== null && compare[field](range[1], value) < 0)
	      return false
	  }

	  return true
	}


	function findByType (type) {
	  return function (pair) {
	    return pair[0] === type.prototype.constructor
	  }
	}


	function compare (fields, sort) {
	  var field, compare, a, b, isAscending,
	    fieldDefinition, fieldIsArray, fieldType, result;

	  return function (x, y) {
	    for (field in sort) {
	      a = x[field];
	      b = y[field];
	      isAscending = sort[field];
	      fieldDefinition = fields[field];
	      fieldIsArray = fieldDefinition[isArrayKey];
	      fieldType = fieldDefinition[typeKey];

	      if (a === null) return 1
	      if (b === null) return -1

	      result = 0;

	      if (fieldIsArray) result = a.length - b.length;
	      else if (fieldType) {
	        compare = fieldType.compare ||
	          find(comparisons, findByType(fieldType))[1];
	        if (!compare) throw new Error('Missing "compare" function.')
	        result = compare(a, b);
	      }

	      if (result === 0) continue

	      return isAscending ? result : -result
	    }

	    return 0
	  }
	}

	var common = {
		generateId: generateId_1,
		applyOptions: applyOptions
	};

	var generateId = common.generateId;


	var inputRecord = function (type, record) {
	  var recordTypes = this.recordTypes;
	  var primaryKey = this.keys.primary;
	  var isArrayKey = this.keys.isArray;
	  var fields = recordTypes[type];
	  var fieldsArray = Object.getOwnPropertyNames(fields);
	  var result = {};
	  var i, j, field;

	  // Ensure that ID exists on the record.
	  result[primaryKey] = primaryKey in record ?
	    record[primaryKey] : generateId();

	  for (i = 0, j = fieldsArray.length; i < j; i++) {
	    field = fieldsArray[i];
	    if (!record.hasOwnProperty(field)) {
	      result[field] = fields[field][isArrayKey] ? [] : null;
	      continue
	    }

	    result[field] = record[field];
	  }

	  return result
	};


	var outputRecord = function (type, record) {
	  var recordTypes = this.recordTypes;
	  var primaryKey = this.keys.primary;
	  var isArrayKey = this.keys.isArray;
	  var denormalizedInverseKey = this.keys.denormalizedInverse;
	  var fields = recordTypes[type];
	  var fieldsArray = Object.getOwnPropertyNames(fields);
	  var result = {};
	  var i, j, field, hasField, value;

	  // Ensure that ID exists on the record.
	  result[primaryKey] = record[primaryKey];

	  for (i = 0, j = fieldsArray.length; i < j; i++) {
	    field = fieldsArray[i];
	    hasField = record.hasOwnProperty(field);
	    value = hasField ? record[field] :
	      fields[field][isArrayKey] ? [] : null;

	    // Do not enumerate denormalized fields.
	    if (fields[field][denormalizedInverseKey]) {
	      Object.defineProperty(result, field, {
	        configurable: true, writable: true, value: value
	      });
	      continue
	    }

	    if (hasField) result[field] = value;
	  }

	  return result
	};

	var helpers = {
		inputRecord: inputRecord,
		outputRecord: outputRecord
	};

	var applyOptions$1 = common.applyOptions;


	var inputRecord$1 = helpers.inputRecord;
	var outputRecord$1 = helpers.outputRecord;


	/**
	 * Memory adapter.
	 */
	var memory = function (Adapter) {
	  function MemoryAdapter (properties) {
	    Adapter.call(this, properties);
	    if (!this.options) this.options = {};
	    if (!('recordsPerType' in this.options))
	      this.options.recordsPerType = 1000;
	  }

	  MemoryAdapter.prototype = new Adapter();

	  MemoryAdapter.prototype.connect = function () {
	    var Promise = promise.Promise;
	    var recordTypes = this.recordTypes;
	    var type;

	    this.db = {};

	    for (type in recordTypes)
	      this.db[type] = {};

	    return Promise.resolve()
	  };


	  MemoryAdapter.prototype.disconnect = function () {
	    var Promise = promise.Promise;

	    delete this.db;
	    return Promise.resolve()
	  };


	  MemoryAdapter.prototype.find = function (type, ids, options, meta) {
	    var Promise = promise.Promise;
	    var self = this;
	    var recordTypes = self.recordTypes;
	    var fields = recordTypes[type];
	    var collection = self.db[type];
	    var records = [];
	    var i, j, id, record;

	    if (ids && !ids.length) return Adapter.prototype.find.call(self)

	    if (ids) for (i = 0, j = ids.length; i < j; i++) {
	      id = ids[i];
	      if (collection.hasOwnProperty(id)) {
	        record = collection[id];

	        // LRU update.
	        delete collection[id];
	        collection[id] = record;

	        records.push(outputRecord$1.call(self, type, record));
	      }
	    }

	    else for (id in collection)
	      records.push(outputRecord$1.call(self, type, collection[id]));

	    return Promise.resolve(applyOptions$1(fields, records, options, meta))
	  };


	  MemoryAdapter.prototype.create = function (type, records, meta) {
	    var Promise = promise.Promise;
	    var self = this;
	    var message = self.message;
	    var recordsPerType = self.options.recordsPerType;
	    var primaryKey = self.keys.primary;
	    var ConflictError = self.errors.ConflictError;
	    var collection = self.db[type];
	    var i, j, record, id, ids, language$$1;

	    if (!meta) meta = {};
	    language$$1 = meta.language;

	    records = map(records, function (record) {
	      return inputRecord$1.call(self, type, record)
	    });

	    // First check for collisions.
	    for (i = 0, j = records.length; i < j; i++) {
	      record = records[i];
	      id = record[primaryKey];

	      if (collection.hasOwnProperty(id))
	        return Promise.reject(new ConflictError(
	          message('RecordExists', language$$1, { id: id })))
	    }

	    // Then save it to memory.
	    for (i = 0, j = records.length; i < j; i++) {
	      record = records[i];
	      collection[record[primaryKey]] = record;
	    }

	    // Clear least recently used records.
	    if (recordsPerType) {
	      ids = Object.keys(collection);

	      if (ids.length > recordsPerType) {
	        ids = ids.slice(0, ids.length - recordsPerType);

	        for (i = 0, j = ids.length; i < j; i++)
	          delete collection[ids[i]];
	      }
	    }

	    return Promise.resolve(map(records, function (record) {
	      return outputRecord$1.call(self, type, record)
	    }))
	  };


	  MemoryAdapter.prototype.update = function (type, updates) {
	    var Promise = promise.Promise;
	    var self = this;
	    var primaryKey = self.keys.primary;
	    var collection = self.db[type];
	    var count = 0;
	    var i, j, update, id, record;

	    if (!updates.length) return Adapter.prototype.update.call(self)

	    for (i = 0, j = updates.length; i < j; i++) {
	      update = updates[i];
	      id = update[primaryKey];
	      record = collection[id];

	      if (!record) continue

	      count++;
	      record = outputRecord$1.call(self, type, record);

	      apply_update(record, update);

	      // LRU update.
	      delete collection[id];

	      collection[id] = inputRecord$1.call(self, type, record);
	    }

	    return Promise.resolve(count)
	  };


	  MemoryAdapter.prototype.delete = function (type, ids) {
	    var Promise = promise.Promise;
	    var collection = this.db[type];
	    var count = 0;
	    var i, j, id;

	    if (ids && !ids.length) return Adapter.prototype.delete.call(this)

	    if (ids) for (i = 0, j = ids.length; i < j; i++) {
	      id = ids[i];
	      if (collection[id]) {
	        delete collection[id];
	        count++;
	      }
	    }

	    else for (id in collection) {
	      delete collection[id];
	      count++;
	    }

	    return Promise.resolve(count)
	  };

	  // Expose utility functions.
	  MemoryAdapter.common = common;

	  // Expose features for introspection.
	  MemoryAdapter.features = {
	    logicalOperators: true
	  };

	  return MemoryAdapter
	};

	/**
	 * Adapter is an abstract base class containing methods to be implemented. All
	 * records returned by the adapter must have the primary key `id`. The primary
	 * key **MUST** be a string or a number.
	 *
	 * It has one static property, `defaultAdapter` which is a reference to the
	 * memory adapter.
	 */
	function Adapter (properties) {
	  assign$1(this, properties);
	}


	/**
	 * The Adapter should not be instantiated directly, since the constructor
	 * function accepts dependencies. The keys which are injected are:
	 *
	 * - `recordTypes`: an object which enumerates record types and their
	 * definitions.
	 * - `options`: the options passed to the adapter.
	 * - `common`: an object containing all internal utilities.
	 * - `errors`: same as static property on Fortune class.
	 * - `keys`: an object which enumerates reserved constants for record type
	 * - `message`: a function with the signature (`id`, `language`, `data`).
	 *
	 * These keys are accessible on the instance (`this`).
	 *
	 * An adapter may expose a `features` static property, which is an object
	 * that can contain boolean flags. These are used mainly for checking which
	 * additional features may be tested.
	 *
	 * - `logicalOperators`: whether or not `and` and `or` queries are supported.
	 */
	Adapter.prototype.constructor = function () {
	  // This exists here only for documentation purposes.
	};

	delete Adapter.prototype.constructor;


	/**
	 * The responsibility of this method is to ensure that the record types
	 * defined are consistent with the backing data store. If there is any
	 * mismatch it should either try to reconcile differences or fail.
	 * This method **SHOULD NOT** be called manually, and it should not accept
	 * any parameters. This is the time to do setup tasks like create tables,
	 * ensure indexes, etc. On successful completion, it should resolve to no
	 * value.
	 *
	 * @return {Promise}
	 */
	Adapter.prototype.connect = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve()
	};


	/**
	 * Close the database connection.
	 *
	 * @return {Promise}
	 */
	Adapter.prototype.disconnect = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve()
	};


	/**
	 * Create records. A successful response resolves to the newly created
	 * records.
	 *
	 * **IMPORTANT**: the record must have initial values for each field defined
	 * in the record type. For non-array fields, it should be `null`, and for
	 * array fields it should be `[]` (empty array). Note that not all fields in
	 * the record type may be enumerable, such as denormalized inverse fields, so
	 * it may be necessary to iterate over fields using
	 * `Object.getOwnPropertyNames`.
	 *
	 * @param {String} type
	 * @param {Object[]} records
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Adapter.prototype.create = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve([])
	};


	/**
	 * Find records by IDs and options. If IDs is undefined, it should try to
	 * return all records. However, if IDs is an empty array, it should be a
	 * no-op. The format of the options may be as follows:
	 *
	 * ```js
	 * {
	 *   sort: { ... },
	 *   fields: { ... },
	 *   exists: { ... },
	 *   match: { ... },
	 *   range: { ... },
	 *
	 *   // Limit results to this number. Zero means no limit.
	 *   limit: 0,
	 *
	 *   // Offset results by this much from the beginning.
	 *   offset: 0,
	 *
	 *   // The logical operator "and", may be nested. Optional feature.
	 *   and: { ... },
	 *
	 *   // The logical operator "or", may be nested. Optional feature.
	 *   or: { ... },
	 *
	 *   // Reserved field for custom querying.
	 *   query: null
	 * }
	 * ```
	 *
	 * For the fields `exists`, `match`, and `range`, the logical operator should
	 * be "and". The `query` field may be used on a per adapter basis to provide
	 * custom querying functionality.
	 *
	 * The syntax of the `sort` object is as follows:
	 *
	 * ```js
	 * {
	 *   age: false, // descending
	 *   name: true // ascending
	 * }
	 * ```
	 *
	 * Fields can be specified to be either included or omitted, but not both.
	 * Use the values `true` to include, or `false` to omit. The syntax of the
	 * `fields` object is as follows:
	 *
	 * ```js
	 * {
	 *   name: true, // include this field
	 *   age: true // also include this field
	 * }
	 * ```
	 *
	 * The `exists` object specifies if a field should exist or not (`true` or
	 * `false`). For array fields, it should check for non-zero length.
	 *
	 * ```js
	 * {
	 *   name: true, // check if this fields exists
	 *   age: false // check if this field doesn't exist
	 * }
	 * ```
	 *
	 * The syntax of the `match` object is straightforward:
	 *
	 * ```js
	 * {
	 *   name: 'value', // exact match or containment if array
	 *   friends: [ 'joe', 'bob' ] // match any one of these values
	 * }
	 * ```
	 *
	 * The `range` object is used to filter between lower and upper bounds. It
	 * should take precedence over `match`. For array fields, it should apply on
	 * the length of the array. For singular link fields, it should not apply.
	 *
	 * ```js
	 * {
	 *   range: { // Ranges should be inclusive.
	 *     age: [ 18, null ], // From 18 and above.
	 *     name: [ 'a', 'd' ], // Starting with letters A through C.
	 *     createdAt: [ null, new Date(2016, 0) ] // Dates until 2016.
	 *   }
	 * }
	 * ```
	 *
	 * The return value of the promise should be an array, and the array **MUST**
	 * have a `count` property that is the total number of records without limit
	 * and offset.
	 *
	 * @param {String} type
	 * @param {String[]|Number[]} [ids]
	 * @param {Object} [options]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Adapter.prototype.find = function () {
	  var Promise = promise.Promise;
	  var results = [];
	  results.count = 0;
	  return Promise.resolve(results)
	};


	/**
	 * Update records by IDs. Success should resolve to the number of records
	 * updated. The `updates` parameter should be an array of objects that
	 * correspond to updates by IDs. Each update object must be as follows:
	 *
	 * ```js
	 * {
	 *   // ID to update. Required.
	 *   id: 1,
	 *
	 *   // Replace a value of a field. Use a `null` value to unset a field.
	 *   replace: { name: 'Bob' },
	 *
	 *   // Append values to an array field. If the value is an array, all of
	 *   // the values should be pushed.
	 *   push: { pets: 1 },
	 *
	 *   // Remove values from an array field. If the value is an array, all of
	 *   // the values should be removed.
	 *   pull: { friends: [ 2, 3 ] },
	 *
	 *   // The `operate` field is specific to the adapter. This should take
	 *   // precedence over all of the above. Warning: using this may bypass
	 *   // field definitions and referential integrity. Use at your own risk.
	 *   operate: null
	 * }
	 * ```
	 *
	 * Things to consider:
	 *
	 * - `push` and `pull` can not be applied to non-arrays.
	 * - The same value in the same field should not exist in both `push` and
	 * `pull`.
	 *
	 * @param {String} type
	 * @param {Object[]} updates
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Adapter.prototype.update = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve(0)
	};


	/**
	 * Delete records by IDs, or delete the entire collection if IDs are
	 * undefined or empty. Success should resolve to the number of records
	 * deleted.
	 *
	 * @param {String} type
	 * @param {String[]|Number[]} [ids]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Adapter.prototype.delete = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve(0)
	};


	/**
	 * Begin a transaction to write to the data store. This method is optional
	 * to implement, but useful for ACID. It should resolve to an object
	 * containing all of the adapter methods.
	 *
	 * @return {Promise}
	 */
	Adapter.prototype.beginTransaction = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve(this)
	};


	/**
	 * End a transaction. This method is optional to implement.
	 * It should return a Promise with no value if the transaction is
	 * completed successfully, or reject the promise if it failed.
	 *
	 * @param {Error} [error] - If an error is passed, roll back the transaction.
	 * @return {Promise}
	 */
	Adapter.prototype.endTransaction = function () {
	  var Promise = promise.Promise;
	  return Promise.resolve()
	};


	/**
	 * Apply operators on a record, then return the record. If you make use of
	 * update operators, you should implement this method so that the internal
	 * implementation of update requests get records in the correct state. This
	 * method is optional to implement.
	 *
	 * @param {Object} record
	 * @param {Object} operators - The `operate` field on an `update` object.
	 * @return {Object}
	 */
	Adapter.prototype.applyOperators = function (record) {
	  return record
	};


	// Expose the default adapter.
	Adapter.DefaultAdapter = memory(Adapter);

	// Expose features object.
	Adapter.features = {};

	var adapter = Adapter;

	var change = constants.change;
	var sync = constants.sync;
	var connect = constants.connect;
	var disconnect = constants.disconnect;
	var failure = constants.failure;

	var events = {
		change: change,
		sync: sync,
		connect: connect,
		disconnect: disconnect,
		failure: failure
	};

	var find$1 = constants.find;
	var create = constants.create;
	var update = constants.update;
	var delete_1 = constants.delete;

	var methods = {
		find: find$1,
		create: create,
		update: update,
		delete: delete_1
	};

	var cast_to_number = function castToNumber (id) {
	  // Stolen from jQuery source code:
	  // https://api.jquery.com/jQuery.isNumeric/
	  var float = Number.parseFloat(id);
	  return id - float + 1 >= 0 ? float : id
	};

	var BadRequestError$3 = errors$2.BadRequestError;
	var buffer = Buffer.from || function (input, encoding) {
	  return new Buffer(input, encoding)
	};


	var castByType = [
	  [ Number, function (x) { return parseFloat(x) } ],

	  [ Date, function (x, options) {
	    if (typeof x === 'string') {
	      x = Date.parse(x);
	      if (Number.isNaN(x)) throw new BadRequestError$3(
	        message_1('DateISO8601', options.language))
	    }

	    x = new Date(x);
	    if (Number.isNaN(x.getTime())) throw new BadRequestError$3(
	      message_1('DateInvalid', options.language))

	    return x
	  } ],

	  [ Buffer, function (x, options) {
	    var bufferEncoding = options && options.bufferEncoding ?
	      options.bufferEncoding : 'base64';

	    if (typeof x !== 'string') throw new BadRequestError$3(
	      message_1('BufferEncoding', options.language, {
	        bufferEncoding: bufferEncoding
	      }))

	    return buffer(x, bufferEncoding)
	  } ],

	  [ Boolean, function (x) {
	    if (typeof x === 'string')
	      return (/^(?:true|1|yes|t|y)$/i).test(x)
	    return Boolean(x)
	  } ],

	  [ Object, function (x, options) {
	    if (typeof x === 'string') return JSON.parse(x)
	    if (typeof x === 'object') return x
	    throw new BadRequestError$3(message_1('JSONParse', options.language))
	  } ],

	  [ String, function (x) { return '' + x } ]
	];


	/**
	 * Cast a value to the given type. Skip if type is missing or value is null.
	 *
	 * @param {*} value
	 * @param {Function} type - Constructor function.
	 * @param {Object} [options]
	 * @return {*}
	 */
	var cast_value = function castValue (value, type, options) {
	  var i, j, pair, cast;

	  // Special case for empty string: it should be null.
	  if (value === '') return null

	  if (type)
	    for (i = 0, j = castByType.length; i < j; i++) {
	      pair = castByType[i];
	      if (pair[0] === type) {
	        cast = pair[1];
	        break
	      }
	    }
	  else return cast_to_number(value)

	  return cast && value !== null ? cast(value, options) : value
	};

	/**
	 * A fast deep clone function, which covers mostly serializable objects.
	 *
	 * @param {*}
	 * @return {*}
	 */
	var clone = function clone (input) {
	  var output, key, value, isArray;

	  if (Array.isArray(input)) isArray = true;
	  else if (input == null || Object.getPrototypeOf(input) !== Object.prototype)
	    return input

	  output = isArray ? [] : {};

	  for (key in input) {
	    value = input[key];
	    output[key] = value !== null && value !== undefined &&
	      Object.getPrototypeOf(value) === Object.prototype ||
	      Array.isArray(value) ? clone(value) : value;
	  }

	  return output
	};

	var OK$1 = response_classes.OK;
	var Created$1 = response_classes.Created;
	var Empty$1 = response_classes.Empty;

	var success = {
		OK: OK$1,
		Created: Created$1,
		Empty: Empty$1
	};

	/**
	 * A more performant `Array.prototype.filter`.
	 *
	 * @param {*[]} array
	 * @param {Function} fn
	 * @return {Boolean}
	 */
	var filter = function filter (array, fn) {
	  var i, j, k = [], l = 0;

	  for (i = 0, j = array.length; i < j; i++)
	    if (fn(array[i], i, array))
	      k[l++] = array[i];

	  return k
	};

	/**
	 * A more performant `Array.prototype.includes`.
	 *
	 * @param {*[]} array
	 * @param {*} value
	 * @return {Boolean}
	 */
	var includes = function includes (array, value) {
	  var i, j;

	  for (i = 0, j = array.length; i < j; i++)
	    if (array[i] === value) return true

	  return false
	};

	/**
	 * A more performant `Array.prototype.reduce`.
	 *
	 * @param {*[]} array
	 * @param {Function} fn
	 * @param {*} [initialValue]
	 * @return {Boolean}
	 */
	var reduce = function reduce (array, fn, initialValue) {
	  var i, j, k = initialValue;

	  for (i = 0, j = array.length; i < j; i++)
	    k = fn(k, array[i], i, array);

	  return k
	};

	/**
	 * Return an array with unique values. Values must be primitive, and the array
	 * may not be sparse.
	 *
	 * @param {Array}
	 * @return {Array}
	 */
	var unique = function unique (a) {
	  var seen = {};
	  var result = [];
	  var i, j, k;

	  for (i = 0, j = a.length; i < j; i++) {
	    k = a[i];
	    if (seen.hasOwnProperty(k)) continue
	    result.push(k);
	    seen[k] = true;
	  }

	  return result
	};

	var common$1 = {
	  // Keys
	  constants: constants,
	  keys: keys,
	  events: events,
	  methods: methods,

	  // Utility functions
	  assign: assign$1,
	  castToNumber: cast_to_number,
	  castValue: cast_value,
	  clone: clone,
	  deepEqual: deep_equal,
	  generateId: generate_id,

	  // i18n
	  message: message_1,

	  // Typed responses
	  responses: response_classes,
	  errors: errors$2,
	  successes: success,

	  // Arrays
	  filter: filter,
	  find: find,
	  includes: includes,
	  map: map,
	  pull: pull,
	  reduce: reduce,
	  unique: unique
	};

	/**
	 * A singleton for the adapter. For internal use.
	 */
	function AdapterSingleton (properties) {
	  var CustomAdapter, input;

	  input = Array.isArray(properties.adapter) ?
	    properties.adapter : [ properties.adapter ];

	  if (typeof input[0] !== 'function')
	    throw new TypeError('The adapter must be a function.')

	  CustomAdapter = adapter.prototype
	    .isPrototypeOf(input[0].prototype) ? input[0] : input[0](adapter);

	  if (!adapter.prototype.isPrototypeOf(CustomAdapter.prototype))
	    throw new TypeError('The adapter must inherit the Adapter class.')

	  return new CustomAdapter({
	    options: input[1] || {},
	    recordTypes: properties.recordTypes,
	    features: CustomAdapter.features,
	    common: common$1,
	    errors: errors$2,
	    keys: keys,
	    message: properties.message,
	    Promise: promise.Promise
	  })
	}


	var singleton = AdapterSingleton;

	var primaryKey$1 = keys.primary;
	var typeKey$1 = keys.type;
	var linkKey = keys.link;
	var inverseKey = keys.inverse;
	var isArrayKey$1 = keys.isArray;

	var plainObject = {};
	var nativeTypes = [ String, Number, Boolean, Date, Object, Buffer ];
	var stringifiedTypes = map(nativeTypes, function (nativeType) {
	  return nativeType.name.toLowerCase()
	});


	/**
	 * Given a hash of field definitions, validate that the definitions are in the
	 * correct format.
	 *
	 * @param {Object} fields
	 * @return {Object}
	 */
	var validate = function validate (fields) {
	  var key;

	  if (typeof fields !== 'object')
	    throw new TypeError('Type definition must be an object.')

	  for (key in fields) validateField(fields, key);

	  return fields
	};


	/**
	 * Parse a field definition.
	 *
	 * @param {Object} fields
	 * @param {String} key
	 */
	function validateField (fields, key) {
	  var value = fields[key] = castShorthand(fields[key]);

	  if (typeof value !== 'object' || value.constructor !== Object)
	    throw new TypeError('The definition of "' + key + '" must be an object.')

	  if (key === primaryKey$1)
	    throw new Error('Can not define primary key "' + primaryKey$1 + '".')

	  if (key in plainObject)
	    throw new Error('Can not define field name "' + key +
	      '" which is in Object.prototype.')

	  if (!value[typeKey$1] && !value[linkKey])
	    throw new Error('The definition of "' + key + '" must contain either ' +
	      'the "' + typeKey$1 + '" or "' + linkKey + '" property.')

	  if (value[typeKey$1] && value[linkKey])
	    throw new Error('Can not define both "' + typeKey$1 + '" and "' + linkKey +
	      '" on "' + key + '".')

	  if (value[typeKey$1]) {
	    if (typeof value[typeKey$1] === 'string')
	      value[typeKey$1] = nativeTypes[
	        stringifiedTypes.indexOf(value[typeKey$1].toLowerCase())];

	    if (typeof value[typeKey$1] !== 'function')
	      throw new Error('The "' + typeKey$1 + '" on "' + key +
	        '" must be a function.')

	    if (!find(nativeTypes, function (type) {
	      return type === value[typeKey$1].prototype.constructor
	    }))
	      throw new Error('The "' + typeKey$1 + '" on "' + key + '" must inherit ' +
	        'from a valid native type.')

	    if (value[inverseKey])
	      throw new Error('The field "' + inverseKey + '" may not be defined ' +
	        'on "' + key + '".')
	  }

	  if (value[linkKey]) {
	    if (typeof value[linkKey] !== 'string')
	      throw new TypeError('The "' + linkKey + '" on "' + key +
	        '" must be a string.')

	    if (value[inverseKey] && typeof value[inverseKey] !== 'string')
	      throw new TypeError('The "' + inverseKey + '" on "' + key + '" ' +
	        'must be a string.')
	  }

	  if (value[isArrayKey$1] && typeof value[isArrayKey$1] !== 'boolean')
	    throw new TypeError('The key "' + isArrayKey$1 + '" on "' + key + '" ' +
	        'must be a boolean.')
	}


	/**
	 * Cast shorthand definition to standard definition.
	 *
	 * @param {*} value
	 * @return {Object}
	 */
	function castShorthand (value) {
	  var obj;

	  if (typeof value === 'string') obj = { link: value };
	  else if (typeof value === 'function') obj = { type: value };
	  else if (Array.isArray(value)) {
	    obj = {};

	    if (value[1]) obj.inverse = value[1];
	    else obj.isArray = true;

	    // Extract type or link.
	    if (Array.isArray(value[0])) {
	      obj.isArray = true;
	      value = value[0][0];
	    }
	    else value = value[0];

	    if (typeof value === 'string') obj.link = value;
	    else if (typeof value === 'function') obj.type = value;
	  }
	  else return value

	  return obj
	}

	var linkKey$1 = keys.link;
	var inverseKey$1 = keys.inverse;
	var isArrayKey$2 = keys.isArray;
	var denormalizedInverseKey = keys.denormalizedInverse;


	// Generate denormalized inverse field name.
	var denormalizedPrefix = '__';
	var denormalizedDelimiter = '_';
	var denormalizedPostfix = '_inverse';


	/**
	 * Analyze the `types` object to see if `link` and `inverse` values are
	 * valid. Also assign denormalized inverse fields.
	 *
	 * @param {Object} types
	 * @return {Object}
	 */
	var ensure_types = function ensureTypes (types) {
	  var denormalizedFields = {};
	  var type, field, definition, linkedFields,
	    denormalizedField, denormalizedDefinition;

	  for (type in types)
	    for (field in types[type]) {
	      definition = types[type][field];

	      if (!(linkKey$1 in definition)) continue

	      if (!types.hasOwnProperty(definition[linkKey$1]))
	        throw new Error('The value for "' + linkKey$1 + '" on "' + field +
	          '" in type "' + type +
	          '" is invalid, the record type does not exist.')

	      linkedFields = types[definition[linkKey$1]];

	      if (inverseKey$1 in definition) {
	        if (!linkedFields.hasOwnProperty(definition[inverseKey$1]))
	          throw new Error('The value for "' + inverseKey$1 + '" on "' + field +
	            '" in type "' + type + '" is invalid, the field does not exist.')

	        if (linkedFields[definition[inverseKey$1]][inverseKey$1] !== field)
	          throw new Error('The value for "' + inverseKey$1 + '" on "' + field +
	            '" in type "' + type +
	            '" is invalid, the inversely related field must define its ' +
	            'inverse as "' + field + '".')

	        if (linkedFields[definition[inverseKey$1]][linkKey$1] !== type)
	          throw new Error('The value for "' + linkKey$1 + '" on "' + field +
	            '" in type "' + type +
	            '" is invalid, the inversely related field must define its link ' +
	            'as "' + type + '".')

	        continue
	      }

	      // Need to assign denormalized inverse. The denormalized inverse field
	      // is basically an automatically assigned inverse field that should
	      // not be visible to the client, but exists in the data store.
	      denormalizedField = denormalizedPrefix + type +
	        denormalizedDelimiter + field + denormalizedPostfix;

	      denormalizedFields[denormalizedField] = true;

	      Object.defineProperty(definition, inverseKey$1, {
	        value: denormalizedField
	      });

	      denormalizedDefinition = {};
	      denormalizedDefinition[linkKey$1] = type;
	      denormalizedDefinition[inverseKey$1] = field;
	      denormalizedDefinition[isArrayKey$2] = true;
	      denormalizedDefinition[denormalizedInverseKey] = true;

	      Object.defineProperty(linkedFields, denormalizedField, {
	        value: denormalizedDefinition
	      });
	    }

	  return denormalizedFields
	};

	var ConflictError$2 = errors$2.ConflictError;


	var linkKey$2 = keys.link;
	var isArrayKey$3 = keys.isArray;
	var inverseKey$2 = keys.inverse;

	/**
	 * Do some validation on records to be created or updated to determine
	 * if there are any records which have overlapping to-one relationships,
	 * or non-unique array relationships.
	 *
	 * @param {Object[]} records
	 * @param {Object} fields
	 * @param {Object} links
	 * @param {Object} meta
	 */
	var validate_records = function validateRecords (records, fields, links, meta) {
	  var recordTypes = this.recordTypes;
	  var language$$1 = meta.language;
	  var toOneMap = {};
	  var i, j, k, l, m, n, value, field, record, id, ids, seen,
	    fieldLink, fieldInverse, fieldIsArray, inverseIsArray;

	  for (i = 0, j = links.length; i < j; i++) {
	    field = links[i];
	    fieldLink = fields[field][linkKey$2];
	    fieldInverse = fields[field][inverseKey$2];
	    fieldIsArray = fields[field][isArrayKey$3];
	    inverseIsArray = recordTypes[fieldLink][fieldInverse][isArrayKey$3];

	    if (fieldIsArray)
	      for (k = 0, l = records.length; k < l; k++) {
	        record = records[k];
	        if (!Array.isArray(record[field])) continue
	        ids = record[field];
	        seen = {};

	        for (m = 0, n = ids.length; m < n; m++) {
	          id = ids[m];
	          if (seen.hasOwnProperty(id)) throw new ConflictError$2(
	            message_1('CollisionDuplicate', language$$1, { id: id, field: field }))
	          else seen[id] = true;
	        }
	      }

	    if (!inverseIsArray) {
	      toOneMap[field] = {};

	      for (k = 0, l = records.length; k < l; k++) {
	        record = records[k];
	        value = record[field];
	        ids = Array.isArray(value) ? value : value ? [ value ] : [];

	        for (m = 0, n = ids.length; m < n; m++) {
	          id = ids[m];
	          if (!toOneMap[field].hasOwnProperty(id)) toOneMap[field][id] = true;
	          else throw new ConflictError$2(
	            message_1('CollisionToOne', language$$1, { field: field }))
	        }
	      }
	    }
	  }
	};

	var BadRequestError$4 = errors$2.BadRequestError;


	var primaryKey$2 = keys.primary;
	var linkKey$3 = keys.link;
	var isArrayKey$4 = keys.isArray;
	var inverseKey$3 = keys.inverse;

	var check_links = checkLinks;


	/**
	 * Ensure referential integrity by checking if related records exist.
	 *
	 * @param {Object} transaction
	 * @param {Object} record
	 * @param {Object} fields
	 * @param {String[]} links - An array of strings indicating which fields are
	 * links. Need to pass this so that it doesn't get computed each time.
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	function checkLinks (transaction, record, fields, links, meta) {
	  var Promise = promise.Promise;
	  var enforceLinks = this.options.settings.enforceLinks;

	  return Promise.all(map(links, function (field) {
	    var ids = Array.isArray(record[field]) ? record[field] :
	      !record.hasOwnProperty(field) || record[field] === null ?
	        [] : [ record[field] ];
	    var fieldLink = fields[field][linkKey$3];
	    var fieldInverse = fields[field][inverseKey$3];
	    var findOptions = { fields: {} };

	    // Don't need the entire records.
	    findOptions.fields[fieldInverse] = true;

	    return new Promise(function (resolve, reject) {
	      if (!ids.length) return resolve()

	      return transaction.find(fieldLink, ids, findOptions, meta)

	        .then(function (records) {
	          var recordIds, i, j;

	          if (enforceLinks) {
	            recordIds = unique(map(records, function (record) {
	              return record[primaryKey$2]
	            }));

	            for (i = 0, j = ids.length; i < j; i++)
	              if (!includes(recordIds, ids[i]))
	                return reject(new BadRequestError$4(
	                  message_1('RelatedRecordNotFound', meta.language,
	                    { field: field })
	                ))
	          }

	          return resolve(records)
	        })
	    })
	  }))

	    .then(function (partialRecords) {
	      var object = {}, records, i, j;

	      for (i = 0, j = partialRecords.length; i < j; i++) {
	        records = partialRecords[i];

	        if (records) object[links[i]] =
	        fields[links[i]][isArrayKey$4] ? records : records[0];
	      }

	      return object
	    })
	}

	var BadRequestError$5 = errors$2.BadRequestError;


	var primaryKey$3 = keys.primary;
	var typeKey$2 = keys.type;
	var linkKey$4 = keys.link;
	var isArrayKey$5 = keys.isArray;


	// Check input values.
	var checkInput = [
	  [ String, function (value) {
	    return typeof value === 'string'
	  } ],
	  [ Number, function (value) {
	    return typeof value === 'number'
	  } ],
	  [ Boolean, function (value) {
	    return typeof value === 'boolean'
	  } ],
	  [ Date, function (value) {
	    return value && typeof value.getTime === 'function' &&
	      !Number.isNaN(value.getTime())
	  } ],
	  [ Object, function (value) {
	    return value !== null && typeof value === 'object'
	  } ],
	  [ Buffer, function (value) {
	    return isBuffer(value)
	  } ]
	];


	/**
	 * Throw errors for mismatched types on a record.
	 *
	 * @param {String} type
	 * @param {Object} record
	 * @param {Object} fields
	 * @param {Object} meta
	 * @return {Object}
	 */
	var enforce = function enforce (type, record, fields, meta) {
	  var i, j, key, value, fieldDefinition, language$$1;

	  if (!meta) meta = {};
	  language$$1 = meta.language;

	  for (key in record) {
	    fieldDefinition = fields[key];

	    if (!fieldDefinition) {
	      if (key !== primaryKey$3) delete record[key];
	      continue
	    }

	    value = record[key];

	    if (fieldDefinition[typeKey$2]) {
	      if (fieldDefinition[isArrayKey$5]) {
	        // If the field is defined as an array but the value is not,
	        // then throw an error.
	        if (!Array.isArray(value))
	          throw new BadRequestError$5(message_1('EnforceArrayType', language$$1, {
	            key: key, type: fieldDefinition[typeKey$2].name
	          }))

	        for (i = 0, j = value.length; i < j; i++)
	          checkValue$1(fieldDefinition, key, value[i], meta);
	      }
	      else checkValue$1(fieldDefinition, key, value, meta);

	      continue
	    }

	    if (fieldDefinition[linkKey$4]) {
	      if (fieldDefinition[isArrayKey$5]) {
	        if (!Array.isArray(value))
	          throw new BadRequestError$5(
	            message_1('EnforceArray', language$$1, { key: key }))

	        if (type === fieldDefinition[linkKey$4] &&
	          find(value, matchId(record[primaryKey$3])))
	          throw new BadRequestError$5(
	            message_1('EnforceSameID', language$$1, { key: key }))

	        continue
	      }

	      if (Array.isArray(value))
	        throw new BadRequestError$5(
	          message_1('EnforceSingular', language$$1, { key: key }))

	      if (type === fieldDefinition[linkKey$4] && record[primaryKey$3] === value)
	        throw new BadRequestError$5(
	          message_1('EnforceSameID', language$$1, { key: key }))

	      continue
	    }
	  }

	  return record
	};


	function checkValue$1 (field, key, value, meta) {
	  var language$$1 = meta.language;
	  var check;
	  var type = field[typeKey$2];

	  // Skip `null` case.
	  if (value === null) return

	  check = find(checkInput, function (pair) {
	    return pair[0] === type
	  });
	  if (check) check = check[1];
	  else check = type;

	  // Fields may be nullable, but if they're defined, then they must be defined
	  // properly.
	  if (!check(value)) throw new BadRequestError$5(
	    message_1(field[isArrayKey$5] ? 'EnforceValueArray' : 'EnforceValue',
	      language$$1, { key: key, type: type.displayName || type.name }))
	}


	function matchId (a) {
	  return function (b) {
	    return a === b
	  }
	}

	var primaryKey$4 = keys.primary;


	// Get a related update object by ID, or return a new one if not found.
	var getUpdate = function (type, id, updates, cache) {
	  var update;

	  if (cache[type] && cache[type][id])
	    return find(updates[type],
	      function (update) {
	        return update[primaryKey$4] === id
	      })

	  update = { id: id };
	  if (!updates[type]) updates[type] = [];
	  updates[type].push(update);
	  cache[type] = {};
	  cache[type][id] = true;
	  return update
	};


	// Add an ID to an update object.
	var addId = function (id, update, field, isArray) {
	  if (isArray) {
	    if (!update.push) update.push = {};
	    if (!update.push[field]) update.push[field] = [];
	    update.push[field].push(id);
	    return
	  }

	  if (!update.replace) update.replace = {};
	  update.replace[field] = id;
	};


	// Remove an ID from an update object.
	var removeId = function (id, update, field, isArray) {
	  if (isArray) {
	    if (!update.pull) update.pull = {};
	    if (!update.pull[field]) update.pull[field] = [];
	    update.pull[field].push(id);
	    return
	  }

	  if (!update.replace) update.replace = {};
	  update.replace[field] = null;
	};


	// Remove denormalized fields from appearing in updates on change events.
	var scrubDenormalizedUpdates = function (updates, denormalizedFields) {
	  var i, update, operation, field;

	  // Iterate in reverse, so we can easily remove indices in the array.
	  for (i = updates.length; i--;) {
	    update = updates[i];

	    for (operation in update) {
	      if (operation === primaryKey$4) continue

	      for (field in update[operation])
	        if (field in denormalizedFields)
	          delete update[operation][field];

	      if (!Object.keys(update[operation]).length)
	        delete update[operation];
	    }

	    // If only the primary key is present, then remove the entire update.
	    if (Object.keys(update).length === 1) updates.splice(i, 1);
	  }
	};

	var update_helpers = {
		getUpdate: getUpdate,
		addId: addId,
		removeId: removeId,
		scrubDenormalizedUpdates: scrubDenormalizedUpdates
	};

	var BadRequestError$6 = errors$2.BadRequestError;


	var scrubDenormalizedUpdates$1 = update_helpers.scrubDenormalizedUpdates;
	var getUpdate$1 = update_helpers.getUpdate;
	var addId$1 = update_helpers.addId;


	var changeEvent = constants.change;
	var createMethod = constants.create;
	var updateMethod = constants.update;
	var primaryKey$5 = constants.primary;
	var linkKey$5 = constants.link;
	var inverseKey$4 = constants.inverse;
	var isArrayKey$6 = constants.isArray;
	var denormalizedInverseKey$1 = constants.denormalizedInverse;


	/**
	 * Extend context so that it includes the parsed records and create them.
	 * This mutates the response object.
	 *
	 * @return {Promise}
	 */
	var create$1 = function (context) {
	  var Promise = promise.Promise;
	  var self = this;
	  var denormalizedFields = self.denormalizedFields;
	  var recordTypes = self.recordTypes;
	  var hooks = self.hooks;
	  var updates = {};
	  var links = [];
	  var transaction, records, type, meta, hook, fields, language$$1;

	  // Start a promise chain.
	  return Promise.resolve(context.request.payload)

	    .then(function (payload) {
	      var i, j, field;

	      records = payload;

	      if (!records || !records.length)
	        throw new BadRequestError$6(
	          message_1('CreateRecordsInvalid', language$$1))

	      type = context.request.type;
	      meta = context.request.meta;
	      transaction = context.transaction;
	      language$$1 = meta.language;

	      hook = hooks[type];
	      fields = recordTypes[type];

	      for (field in fields) {
	        if (linkKey$5 in fields[field])
	          links.push(field);

	        // Delete denormalized inverse fields.
	        if (denormalizedInverseKey$1 in fields[field])
	          for (i = 0, j = records.length; i < j; i++)
	            delete records[i][field];
	      }

	      return typeof hook[0] === 'function' ?
	        Promise.all(map(records, function (record) {
	          return hook[0](context, record)
	        })) : records
	    })

	    .then(function (results) {
	      return Promise.all(map(results, function (record, i) {
	        if (record && typeof record === 'object') records[i] = record;
	        else record = records[i];

	        // Enforce the fields.
	        enforce(type, record, fields, meta);

	        // Ensure referential integrity.
	        return check_links.call(self, transaction, record, fields, links, meta)
	      }))
	    })

	    .then(function () {
	      validate_records.call(self, records, fields, links, meta);
	      return transaction.create(type, records, meta)
	    })

	    .then(function (createdRecords) {
	      var i, j, k, l, m, n, record, field, inverseField,
	        linkedType, linkedIsArray, linkedIds, id;

	      // Update inversely linked records on created records.
	      // Trying to batch updates to be as few as possible.
	      var idCache = {};

	      // Adapter must return something.
	      if (!createdRecords.length)
	        throw new BadRequestError$6(
	          message_1('CreateRecordsFail', language$$1))

	      records = createdRecords;

	      Object.defineProperty(context.response, 'records', {
	        configurable: true,
	        value: records
	      });

	      // Iterate over each record to generate updates object.
	      for (i = 0, j = records.length; i < j; i++) {
	        record = records[i];

	        // Each created record must have an ID.
	        if (!(primaryKey$5 in record))
	          throw new Error(
	            message_1('CreateRecordMissingID', language$$1))

	        for (k = 0, l = links.length; k < l; k++) {
	          field = links[k];
	          inverseField = fields[field][inverseKey$4];

	          if (!record.hasOwnProperty(field) || !inverseField) continue

	          linkedType = fields[field][linkKey$5];
	          linkedIsArray =
	          recordTypes[linkedType][inverseField][isArrayKey$6];
	          linkedIds = Array.isArray(record[field]) ?
	            record[field] : [ record[field] ];

	          // Do some initialization.
	          if (!updates[linkedType]) updates[linkedType] = [];
	          if (!idCache[linkedType]) idCache[linkedType] = {};

	          for (m = 0, n = linkedIds.length; m < n; m++) {
	            id = linkedIds[m];
	            if (id !== null)
	              addId$1(record[primaryKey$5],
	                getUpdate$1(linkedType, id, updates, idCache),
	                inverseField, linkedIsArray);
	          }
	        }
	      }

	      return Promise.all(map(Object.keys(updates), function (type) {
	        return updates[type].length ?
	          transaction.update(type, updates[type], meta) :
	          null
	      }))
	    })

	    .then(function () {
	      var eventData = {}, currentType;

	      eventData[createMethod] = {};
	      eventData[createMethod][type] = records;

	      for (currentType in updates) {
	        scrubDenormalizedUpdates$1(updates[currentType], denormalizedFields);

	        if (!updates[currentType].length) continue

	        if (!(updateMethod in eventData)) eventData[updateMethod] = {};
	        eventData[updateMethod][currentType] = updates[currentType];
	      }

	      // Summarize changes during the lifecycle of the request.
	      self.emit(changeEvent, eventData);

	      return context
	    })
	};

	var NotFoundError$2 = errors$2.NotFoundError;


	var scrubDenormalizedUpdates$2 = update_helpers.scrubDenormalizedUpdates;
	var getUpdate$2 = update_helpers.getUpdate;
	var removeId$1 = update_helpers.removeId;


	var changeEvent$1 = constants.change;
	var deleteMethod = constants.delete;
	var updateMethod$1 = constants.update;
	var primaryKey$6 = constants.primary;
	var linkKey$6 = constants.link;
	var inverseKey$5 = constants.inverse;
	var isArrayKey$7 = constants.isArray;


	/**
	 * Delete records. This does not mutate context.
	 *
	 * @return {Promise}
	 */
	var _delete = function (context) {
	  var Promise = promise.Promise;
	  var self = this;
	  var denormalizedFields = self.denormalizedFields;
	  var request = context.request;
	  var type = request.type;
	  var ids = request.ids;
	  var meta = request.meta;
	  var language$$1 = meta.language;
	  var recordTypes = self.recordTypes;
	  var hooks = self.hooks;
	  var updates = {};
	  var fields = recordTypes[type];
	  var hook = hooks[type];
	  var links = [];
	  var transaction, field, records;

	  transaction = context.transaction;

	  for (field in fields)
	    if (linkKey$6 in fields[field]) links.push(field);

	  if (!ids || !ids.length)
	    throw new NotFoundError$2(message_1('DeleteRecordsMissingID', language$$1))

	  return transaction.find(type, ids, null, meta)

	    .then(function (foundRecords) {
	      records = foundRecords;

	      if (records.length < ids.length)
	        throw new NotFoundError$2(message_1('DeleteRecordsInvalid', language$$1))

	      Object.defineProperty(context.response, 'records', {
	        configurable: true,
	        value: records
	      });

	      return typeof hook[0] === 'function' ?
	        Promise.all(map(records, function (record) {
	          return hook[0](context, record)
	        })) : records
	    })

	    .then(function () {
	      return transaction.delete(type, ids, meta)
	    })

	    .then(function (count) {
	      var i, j, k, l, m, n, record, field, id, inverseField,
	        linkedType, linkedIsArray, linkedIds;

	      // Remove all instances of the deleted IDs in all records.
	      var idCache = {};

	      // Sanity check.
	      if (count < ids.length)
	        throw new Error(message_1('DeleteRecordsFail', language$$1))

	      // Loop over each record to generate updates object.
	      for (i = 0, j = records.length; i < j; i++) {
	        record = records[i];
	        for (k = 0, l = links.length; k < l; k++) {
	          field = links[k];
	          inverseField = fields[field][inverseKey$5];

	          if (!record.hasOwnProperty(field) || !inverseField) continue

	          linkedType = fields[field][linkKey$6];
	          linkedIsArray = recordTypes[linkedType][inverseField][isArrayKey$7];
	          linkedIds = Array.isArray(record[field]) ?
	            record[field] : [ record[field] ];

	          // Do some initialization.
	          if (!updates[linkedType]) updates[linkedType] = [];
	          if (!idCache[linkedType]) idCache[linkedType] = {};

	          for (m = 0, n = linkedIds.length; m < n; m++) {
	            id = linkedIds[m];
	            if (id !== null)
	              removeId$1(record[primaryKey$6],
	                getUpdate$2(linkedType, id, updates, idCache),
	                inverseField, linkedIsArray);
	          }
	        }
	      }

	      return Promise.all(map(Object.keys(updates), function (type) {
	        return updates[type].length ?
	          transaction.update(type, updates[type], meta) :
	          null
	      }))
	    })

	    .then(function () {
	      var eventData = {}, currentType;

	      eventData[deleteMethod] = {};
	      eventData[deleteMethod][type] = ids;

	      for (currentType in updates) {
	        scrubDenormalizedUpdates$2(updates[currentType], denormalizedFields);

	        if (!updates[currentType].length) continue

	        if (!(updateMethod$1 in eventData)) eventData[updateMethod$1] = {};
	        eventData[updateMethod$1][currentType] = updates[currentType];
	      }

	      // Summarize changes during the lifecycle of the request.
	      self.emit(changeEvent$1, eventData);

	      return context
	    })
	};

	var scrubDenormalizedUpdates$3 = update_helpers.scrubDenormalizedUpdates;
	var getUpdate$3 = update_helpers.getUpdate;
	var addId$2 = update_helpers.addId;
	var removeId$2 = update_helpers.removeId;


	var NotFoundError$3 = errors$2.NotFoundError;
	var BadRequestError$7 = errors$2.BadRequestError;






	var changeEvent$2 = constants.change;
	var updateMethod$2 = constants.update;
	var primaryKey$7 = constants.primary;
	var linkKey$7 = constants.link;
	var inverseKey$6 = constants.inverse;
	var isArrayKey$8 = constants.isArray;
	var denormalizedInverseKey$2 = constants.denormalizedInverse;
	var updateRecordKey = constants.updateRecord;
	var linkedHashKey = constants.linkedHash;


	/**
	 * Do updates. First, it must find the records to update, then run hooks
	 * and validation, then apply the update as well as links on related records.
	 *
	 * @return {Promise}
	 */
	var update$1 = function (context) {
	  var Promise = promise.Promise;
	  var self = this;
	  var denormalizedFields = self.denormalizedFields;
	  var adapter = self.adapter;
	  var recordTypes = self.recordTypes;
	  var hooks = self.hooks;

	  var relatedUpdates = {};
	  var hookedUpdates = [];

	  var links = [];
	  var transaction, updates, fields, hook, type, meta, language$$1;

	  // Start a promise chain.
	  return Promise.resolve(context.request.payload)

	    .then(function (payload) {
	      var i, j, update, field;

	      updates = payload;
	      validateUpdates(updates, context.request.meta);

	      type = context.request.type;
	      meta = context.request.meta;
	      transaction = context.transaction;
	      language$$1 = meta.language;

	      fields = recordTypes[type];
	      hook = hooks[type];

	      // Delete denormalized inverse fields, can't be updated.
	      for (field in fields) {
	        if (linkKey$7 in fields[field]) links.push(field);
	        if (denormalizedInverseKey$2 in fields[field])
	          for (i = 0, j = updates.length; i < j; i++) {
	            update = updates[i];
	            if (update.replace) delete update.replace[field];
	            if (update.pull) delete update.pull[field];
	            if (update.push) delete update.push[field];
	          }
	      }

	      return transaction.find(type, map(updates, function (update) {
	        return update[primaryKey$7]
	      }), null, meta)
	    })

	    .then(function (records) {
	      if (records.length < updates.length)
	        throw new NotFoundError$3(message_1('UpdateRecordMissing', language$$1))

	      return Promise.all(map(records, function (record) {
	        var update, cloneUpdate;
	        var hasHook = typeof hook[0] === 'function';
	        var id = record[primaryKey$7];

	        update = find(updates, function (update) {
	          return update[primaryKey$7] === id
	        });

	        if (!update) throw new NotFoundError$3(
	          message_1('UpdateRecordMissing', language$$1))

	        if (hasHook) cloneUpdate = clone(update);

	        return Promise.resolve(hasHook ?
	          hook[0](context, record, update) : update)
	          .then(function (result) {
	            if (result && typeof result === 'object') update = result;

	            if (hasHook) {
	              // Check if the update has been modified or not.
	              if (!deep_equal(update, cloneUpdate))
	                context.response.meta.updateModified = true;

	              // Runtime safety check: primary key must be the same.
	              if (update[primaryKey$7] !== id) throw new BadRequestError$7(
	                message_1('InvalidID', language$$1))
	            }

	            hookedUpdates.push(update);
	            Object.defineProperty(update, updateRecordKey, { value: record });

	            // Shallow clone the record.
	            record = assign$1({}, record);

	            // Apply updates to record.
	            apply_update(record, update);

	            // Apply operators to record.
	            if (update.operate)
	              record = adapter.applyOperators(record, update.operate);

	            // Enforce the fields.
	            enforce(type, record, fields, meta);

	            // Ensure referential integrity.
	            return check_links.call(
	              self, transaction, record, fields, links, meta)
	              .then(function (linked) {
	                Object.defineProperty(update, linkedHashKey, { value: linked });
	                return record
	              })
	          })
	      }))
	    })

	    .then(function (records) {
	      var i, j;

	      validate_records.call(self, records, fields, links, meta);

	      Object.defineProperty(context.response, 'records', {
	        configurable: true,
	        value: records
	      });

	      // Drop fields in the updates that aren't defined in the record type
	      // before doing the update.
	      for (i = 0, j = hookedUpdates.length; i < j; i++)
	        dropFields(hookedUpdates[i], fields);

	      return transaction.update(type, hookedUpdates, meta)
	    })

	    .then(function () {
	      var inverseField, isArray, linkedType, linkedIsArray, linked, record,
	        partialRecord, partialRecords, ids, id, push, pull, update, field;
	      var i, j, k, l, m, n;

	      // Build up related updates based on update objects.
	      var idCache = {};

	      // Iterate over each update to generate related updates.
	      for (i = 0, j = hookedUpdates.length; i < j; i++) {
	        update = hookedUpdates[i];

	        for (k = 0, l = links.length; k < l; k++) {
	          field = links[k];
	          inverseField = fields[field][inverseKey$6];

	          if (!inverseField) continue

	          isArray = fields[field][isArrayKey$8];
	          linkedType = fields[field][linkKey$7];
	          linkedIsArray =
	          recordTypes[linkedType][inverseField][isArrayKey$8];

	          // Do some initialization.
	          if (!relatedUpdates[linkedType]) relatedUpdates[linkedType] = [];
	          if (!idCache[linkedType]) idCache[linkedType] = {};

	          record = update[updateRecordKey];
	          linked = update[linkedHashKey];

	          // Replacing a link field is pretty complicated.
	          if (update.replace && update.replace.hasOwnProperty(field)) {
	            id = update.replace[field];

	            if (!Array.isArray(id)) {
	            // Don't need to worry about inverse updates if the value does not
	            // change.
	              if (id === record[field]) continue

	              // Set related field.
	              if (id !== null)
	                addId$2(update[primaryKey$7],
	                  getUpdate$3(linkedType, id, relatedUpdates, idCache),
	                  inverseField, linkedIsArray);

	              // Unset 2nd degree related record.
	              if (linked.hasOwnProperty(field) &&
	              linked[field][inverseField] !== null &&
	              !linkedIsArray &&
	              linked[field][inverseField] !== update[primaryKey$7])
	                removeId$2(id,
	                  getUpdate$3(
	                    linkedType, linked[field][inverseField],
	                    relatedUpdates, idCache),
	                  inverseField, linkedIsArray);

	              // For unsetting, remove ID from related record.
	              if (record[field] !== null &&
	              record[field] !== update[field] &&
	              record[field] !== id)
	                removeId$2(update[primaryKey$7],
	                  getUpdate$3(
	                    linkedType, record[field], relatedUpdates, idCache),
	                  inverseField, linkedIsArray);

	              // After this point, there's no need to go over push/pull.
	              continue
	            }

	            ids = id;

	            // Compute differences for pull, and mutate the update.
	            for (m = 0, n = record[field].length; m < n; m++) {
	              id = record[field][m];
	              if (!includes(ids, id)) {
	                if (!('pull' in update)) update.pull = {};
	                if (update.pull.hasOwnProperty(field)) {
	                  if (Array.isArray(update.pull[field])) {
	                    update.pull[field].push(id);
	                    continue
	                  }
	                  update.pull[field] = [ update.pull[field], id ];
	                  continue
	                }
	                update.pull[field] = [ id ];
	              }
	            }

	            // Compute differences for push, and mutate the update.
	            for (m = 0, n = ids.length; m < n; m++) {
	              id = ids[m];
	              if (!includes(record[field], id)) {
	                if (!('push' in update)) update.push = {};
	                if (update.push.hasOwnProperty(field)) {
	                  if (Array.isArray(update.push[field])) {
	                    update.push[field].push(id);
	                    continue
	                  }
	                  update.push[field] = [ update.push[field], id ];
	                  continue
	                }
	                update.push[field] = [ id ];
	              }
	            }

	            // Delete the original replace, since it is no longer valid.
	            delete update.replace[field];
	          }

	          if (update.pull && update.pull[field]) {
	            pull = Array.isArray(update.pull[field]) ?
	              update.pull[field] : [ update.pull[field] ];

	            for (m = 0, n = pull.length; m < n; m++) {
	              id = pull[m];
	              if (id !== null)
	                removeId$2(update[primaryKey$7],
	                  getUpdate$3(linkedType, id, relatedUpdates, idCache),
	                  inverseField, linkedIsArray);
	            }
	          }

	          if (update.push && update.push[field]) {
	            push = Array.isArray(update.push[field]) ?
	              update.push[field] : [ update.push[field] ];

	            for (m = 0, n = push.length; m < n; m++) {
	              id = push[m];
	              if (id !== null)
	                addId$2(update[primaryKey$7],
	                  getUpdate$3(linkedType, id, relatedUpdates, idCache),
	                  inverseField, linkedIsArray);
	            }
	          }

	          // Unset from 2nd degree related records.
	          if (linked.hasOwnProperty(field) && !linkedIsArray) {
	            partialRecords = Array.isArray(linked[field]) ?
	              linked[field] : [ linked[field] ];

	            for (m = 0, n = partialRecords.length; m < n; m++) {
	              partialRecord = partialRecords[m];

	              if (partialRecord[inverseField] === update[primaryKey$7])
	                continue

	              removeId$2(partialRecord[primaryKey$7],
	                getUpdate$3(
	                  type, partialRecord[inverseField],
	                  relatedUpdates, idCache),
	                field, isArray);
	            }
	          }
	        }
	      }

	      return Promise.all(map(Object.keys(relatedUpdates), function (type) {
	        return relatedUpdates[type].length ?
	          transaction.update(type, relatedUpdates[type], meta) :
	          null
	      }))
	    })

	    .then(function () {
	      var eventData = {}, linkedType;

	      eventData[updateMethod$2] = {};
	      eventData[updateMethod$2][type] = hookedUpdates;

	      for (linkedType in relatedUpdates) {
	        scrubDenormalizedUpdates$3(
	          relatedUpdates[linkedType], denormalizedFields);

	        if (!relatedUpdates[linkedType].length) continue

	        if (linkedType !== type)
	          eventData[updateMethod$2][linkedType] = relatedUpdates[linkedType];

	        // Get the union of update IDs.
	        else eventData[updateMethod$2][type] =
	        eventData[updateMethod$2][type].concat(relatedUpdates[type]);
	      }

	      // Summarize changes during the lifecycle of the request.
	      self.emit(changeEvent$2, eventData);

	      return context
	    })
	};


	// Validate updates.
	function validateUpdates (updates, meta) {
	  var language$$1 = meta.language;
	  var i, j, update;

	  if (!updates || !updates.length)
	    throw new BadRequestError$7(
	      message_1('UpdateRecordsInvalid', language$$1))

	  for (i = 0, j = updates.length; i < j; i++) {
	    update = updates[i];
	    if (!update[primaryKey$7])
	      throw new BadRequestError$7(
	        message_1('UpdateRecordMissingID', language$$1))
	  }
	}


	function dropFields (update, fields) {
	  var field;

	  for (field in update.replace)
	    if (!fields.hasOwnProperty(field)) delete update.replace[field];

	  for (field in update.pull)
	    if (!fields.hasOwnProperty(field)) delete update.pull[field];

	  for (field in update.push)
	    if (!fields.hasOwnProperty(field)) delete update.push[field];
	}

	/**
	 * Fetch the primary records. This mutates `context.response`
	 * for the next method.
	 *
	 * @return {Promise}
	 */
	var find$2 = function (context) {
	  var transaction = context.transaction;
	  var request = context.request;
	  var type = request.type;
	  var ids = request.ids;
	  var options = request.options;
	  var meta = request.meta;

	  if (!type) return context

	  return transaction.find(type, ids, options, meta)
	    .then(function (records) {
	      Object.defineProperty(context.response, 'records', {
	        configurable: true,
	        value: records
	      });

	      return context
	    })
	};

	var BadRequestError$8 = errors$2.BadRequestError;


	var primaryKey$8 = keys.primary;
	var linkKey$8 = keys.link;


	/**
	 * Fetch included records. This mutates `context.response`
	 * for the next method.
	 *
	 * @return {Promise}
	 */
	var include = function include (context) {
	  var Promise = promise.Promise;
	  var request = context.request;
	  var type = request.type;
	  var ids = request.ids || [];
	  var include = request.include;
	  var meta = request.meta;
	  var language$$1 = meta.language;
	  var response = context.response;
	  var transaction = context.transaction;
	  var records = response.records;
	  var recordTypes = this.recordTypes;
	  var hasField = true;
	  var idCache = {};
	  var i, j, record, id;

	  // Skip if there's nothing to be done.
	  if (!type || !include || !records) return context

	  // This cache is used to keep unique IDs per type.
	  idCache[type] = {};
	  for (i = 0, j = ids.length; i < j; i++)
	    idCache[type][ids[i]] = true;

	  // It's necessary to iterate over primary records if no IDs were
	  // provided initially.
	  if (!ids.length)
	    for (i = 0, j = records.length; i < j; i++) {
	      record = records[i];
	      id = record[primaryKey$8];
	      if (!idCache[type][id]) idCache[type][id] = true;
	    }

	  // Cast `include` into an array if it's using shorthand.
	  if (include.length && !Array.isArray(include[0]))
	    include = [ include ];

	  return Promise.all(map(include, function (fields) {
	    return new Promise(function (resolve, reject) {
	      var currentType = type;
	      var includeOptions = [];
	      var currentCache, currentIds, currentOptions, currentField;
	      var i, j, ensureFields;

	      // Cast `fields` into an array if it's using shorthand.
	      if (!Array.isArray(fields) ||
	        (!Array.isArray(fields[1]) && typeof fields[1] === 'object'))
	        fields = [ fields ];

	      for (i = 0, j = fields.length; i < j; i++)
	        if (Array.isArray(fields[i])) {
	          includeOptions[i] = fields[i][1];
	          fields[i] = fields[i][0];
	        }

	      // Check if first level field in in each record.
	      for (i = 0, j = records.length; i < j; i++)
	        if (!(fields[0] in records[i])) {
	          hasField = false;
	          break
	        }

	      // Ensure that the first level field is in each record.
	      if (hasField)
	        ensureFields = Promise.resolve(records);
	      else {
	        currentOptions = { fields: {} };
	        currentOptions.fields[fields[0]] = true;
	        currentIds = [];
	        for (i = 0, j = records.length; i < j; i++)
	          currentIds.push(records[i][primaryKey$8]);
	        ensureFields = transaction.find(
	          type, currentIds, currentOptions, meta);
	      }

	      return ensureFields
	        .then(function (records) {
	          return reduce(fields, function (records, field, index) {
	            // `cursor` refers to the current collection of records.
	            return records.then(function (cursor) {
	              currentField = recordTypes[currentType][field];

	              if (!currentType || !currentField) return []
	              if (!(linkKey$8 in currentField))
	                throw new BadRequestError$8(
	                  message_1('InvalidLink', language$$1, { field: field }))

	              currentCache = {};
	              currentType = currentField[linkKey$8];
	              currentIds = reduce(cursor, function (ids, record) {
	                var linkedIds = Array.isArray(record[field]) ?
	                  record[field] : [ record[field] ];
	                var i, j, id;

	                for (i = 0, j = linkedIds.length; i < j; i++) {
	                  id = linkedIds[i];
	                  if (id && !currentCache[id]) {
	                    currentCache[id] = true;
	                    ids.push(id);
	                  }
	                }

	                return ids
	              }, []);

	              if (index in includeOptions)
	                currentOptions = includeOptions[index];
	              else if (index < fields.length - 1) {
	                currentOptions = { fields: {} };
	                currentOptions.fields[fields[index + 1]] = true;
	              }
	              else currentOptions = null;

	              return currentIds.length ?
	                transaction.find(
	                  currentType, currentIds, currentOptions, meta) :
	                []
	            })
	          }, Promise.resolve(records))
	        })

	        .then(function (records) {
	          return resolve({
	            type: currentType,
	            ids: currentIds,
	            records: records
	          })
	        }, function (error$$1) {
	          return reject(error$$1)
	        })
	    })
	  }))

	    .then(function (containers) {
	      var include = reduce(containers, function (include, container) {
	        var i, j, id, record;

	        if (!container.ids.length) return include

	        if (!include[container.type])
	          include[container.type] = [];

	        // Only include unique IDs per type.
	        if (!idCache[container.type])
	          idCache[container.type] = {};

	        for (i = 0, j = container.ids.length; i < j; i++) {
	          id = container.ids[i];

	          if (idCache[container.type][id]) continue

	          record = find(container.records, matchId$1(id));

	          if (record) {
	            idCache[container.type][id] = true;
	            include[container.type].push(record);
	          }
	        }

	        // If nothing so far, delete the type from include.
	        if (!include[container.type].length)
	          delete include[container.type];

	        return include
	      }, {});

	      if (Object.keys(include).length)
	        Object.defineProperty(context.response, 'include', {
	          configurable: true,
	          value: include
	        });

	      return context
	    })
	};


	function matchId$1 (id) {
	  return function (record) {
	    return record[primaryKey$8] === id
	  }
	}

	/**
	 * Apply `output` hook per record, this mutates `context.response`.
	 *
	 * @return {Promise}
	 */
	var end = function (context) {
	  var Promise = promise.Promise;
	  var hooks = this.hooks;
	  var request = context.request;
	  var response = context.response;
	  var type = request.type;
	  var hook = hooks[type];
	  var records = response.records;
	  var include = response.include;

	  // Delete temporary keys.
	  delete response.records;
	  delete response.include;

	  // Run hooks on primary type.
	  return (records ? Promise.all(map(records, function (record) {
	    return Promise.resolve(typeof hook[1] === 'function' ?
	      hook[1](context, record) : record)
	  }))

	    .then(function (updatedRecords) {
	      var includeTypes;
	      var i, j;

	      for (i = 0, j = updatedRecords.length; i < j; i++)
	        if (updatedRecords[i]) records[i] = updatedRecords[i];

	      if (!include) return void 0

	      // The order of the keys and their corresponding indices matter.
	      includeTypes = Object.keys(include);

	      // Run output hooks per include type.
	      return Promise.all(map(includeTypes, function (includeType) {
	        // This is useful for output hooks to know which type that the current
	        // record belongs to. It is temporary and gets deleted later.
	        request.includeType = includeType;

	        return Promise.all(map(include[includeType], function (record) {
	          return Promise.resolve(
	            typeof hooks[includeType][1] === 'function' ?
	              hooks[includeType][1](context, record) : record)
	        }))
	      }))

	        .then(function (types) {
	          var i, j, k, l;

	          // Don't need this anymore.
	          delete request.includeType;

	          // Assign results of output hooks on includes.
	          for (i = 0, j = types.length; i < j; i++)
	            for (k = 0, l = types[i].length; k < l; k++)
	              if (types[i][k]) include[includeTypes[i]][k] = types[i][k];
	        })
	    }) : Promise.resolve())

	    .then(function () {
	      context.response.payload = {
	        records: records
	      };

	      if (include) context.response.payload.include = include;

	      // Expose the "count" property so that it is serializable.
	      if (records && 'count' in records)
	        context.response.payload.count = records.count;

	      return context
	    })
	};

	var BadRequestError$9 = response_classes.BadRequestError;
	var NotFoundError$4 = response_classes.NotFoundError;
	var MethodError$2 = response_classes.MethodError;
	var OK$2 = response_classes.OK;
	var Empty$2 = response_classes.Empty;
	var Created$2 = response_classes.Created;


	var findMethod = methods.find;
	var createMethod$1 = methods.create;


	/*!
	 * Internal function to dispatch a request. Must be called in the context of
	 * the Fortune instance.
	 *
	 * @param {Object} options
	 * @return {Promise}
	 */
	function dispatch (options) {
	  var Promise = promise.Promise;
	  var flows = this.flows;
	  var recordTypes = this.recordTypes;
	  var adapter = this.adapter;

	  var context = setDefaults(options);
	  var method = context.request.method;
	  var hasTransaction = 'transaction' in options;

	  // Start a promise chain.
	  return Promise.resolve(context)

	    .then(function (context) {
	      var type = context.request.type;
	      var ids = context.request.ids;
	      var language$$1 = context.request.meta.language;
	      var error$$1;

	      // Make sure that IDs are an array of unique values.
	      if (ids) context.request.ids = unique(ids);

	      // If a type is unspecified, block the request.
	      if (type === null) {
	        error$$1 = new BadRequestError$9(message_1('UnspecifiedType', language$$1));
	        error$$1.isTypeUnspecified = true;
	        throw error$$1
	      }

	      // If a type is specified and it doesn't exist, block the request.
	      if (!recordTypes.hasOwnProperty(type))
	        throw new NotFoundError$4(
	          message_1('InvalidType', language$$1, { type: type }))

	      // Block invalid method.
	      if (!(method in flows))
	        throw new MethodError$2(
	          message_1('InvalidMethod', language$$1, { method: method }))

	      return hasTransaction ?
	        Promise.resolve(options.transaction) :
	        adapter.beginTransaction()
	    })

	    .then(function (transaction) {
	      var chain, flow, i, j;

	      context.transaction = transaction;
	      chain = Promise.resolve(context);
	      flow = flows[method];

	      for (i = 0, j = flow.length; i < j; i++)
	        chain = chain.then(flow[i]);

	      return chain
	    })

	    .then(function (context) {
	      return hasTransaction ?
	        Promise.resolve() : context.transaction.endTransaction()
	          .then(function () {
	            var method = context.request.method;
	            var response = context.response;
	            var payload = response.payload;

	            if (!payload) return new Empty$2(response)
	            if (method === createMethod$1) return new Created$2(response)

	            return new OK$2(response)
	          })
	    })

	  // This makes sure to call `endTransaction` before re-throwing the error.
	    .catch(function (error$$1) {
	      return 'transaction' in context && !hasTransaction ?
	        context.transaction.endTransaction(error$$1)
	          .then(throwError, throwError) :
	        throwError()

	      function throwError () {
	        throw assign$1(error$$1, context.response)
	      }
	    })
	}


	// Re-exporting internal middlewares.
	dispatch.middlewares = {
	  create: create$1,
	  'delete': _delete,
	  update: update$1,
	  find: find$2,
	  include: include,
	  end: end
	};


	/*!
	 * Set default options on a context's request. For internal use.
	 *
	 * @param {Object} [options]
	 * @return {Object}
	 */
	function setDefaults (options) {
	  var context = {
	    request: {
	      method: findMethod,
	      type: null,
	      ids: null,
	      options: {},
	      include: [],
	      meta: {},
	      payload: null
	    },
	    response: {
	      meta: {},
	      payload: null
	    }
	  };

	  assign$1(context.request, options);

	  return context
	}


	var dispatch_1 = dispatch;

	// Local modules.






	var middlewares = dispatch_1.middlewares;

	// Static re-exports.


	var assign$2 = common$1.assign;
	var methods$1 = common$1.methods;
	var events$1 = common$1.events;


	/**
	 * This is the default export of the `fortune` package. It implements a
	 * [subset of `EventEmitter`](https://www.npmjs.com/package/event-lite), and it
	 * has a few static properties attached to it that may be useful to access:
	 *
	 * - `Adapter`: abstract base class for the Adapter.
	 * - `adapters`: included adapters, defaults to memory adapter.
	 * - `errors`: custom error types, useful for throwing errors in I/O hooks.
	 * - `methods`: a hash that maps to string constants. Available are: `find`,
	 *   `create`, `update`, and `delete`.
	 * - `events`: names for events on the Fortune instance. Available are:
	 *   `change`, `sync`, `connect`, `disconnect`, `failure`.
	 * - `message`: a function which accepts the arguments (`id`, `language`,
	 *   `data`). It has properties keyed by two-letter language codes, which by
	 *   default includes only `en`.
	 * - `Promise`: assign this to set the Promise implementation that Fortune
	 *   will use.
	 */
	function Fortune (recordTypes, options) {
	  if (!(this instanceof Fortune))
	    return new Fortune(recordTypes, options)

	  this.constructor(recordTypes, options);
	}


	// Inherit from EventLite class.
	Fortune.prototype = new eventLite();


	/**
	 * Create a new instance, the only required input is record type definitions.
	 * The first argument must be an object keyed by name, valued by definition
	 * objects.
	 *
	 * Here are some example field definitions:
	 *
	 * ```js
	 * {
	 *   // Top level keys are names of record types.
	 *   person: {
	 *     // Data types may be singular or plural.
	 *     name: String, // Singular string value.
	 *     luckyNumbers: Array(Number), // Array of numbers.
	 *
	 *     // Relationships may be singular or plural. They must specify which
	 *     // record type it refers to, and may also specify an inverse field
	 *     // which is optional but recommended.
	 *     pets: [ Array('animal'), 'owner' ], // Has many.
	 *     employer: [ 'organization', 'employees' ], // Belongs to.
	 *     likes: Array('thing'), // Has many (no inverse).
	 *     doing: 'activity', // Belongs to (no inverse).
	 *
	 *     // Reflexive relationships are relationships in which the record type,
	 *     // the first position, is of the same type.
	 *     following: [ Array('person'), 'followers' ],
	 *     followers: [ Array('person'), 'following' ],
	 *
	 *     // Mutual relationships are relationships in which the inverse,
	 *     // the second position, is defined to be the same field on the same
	 *     // record type.
	 *     friends: [ Array('person'), 'friends' ],
	 *     spouse: [ 'person', 'spouse' ]
	 *   }
	 * }
	 * ```
	 *
	 * The above shows the shorthand which will be transformed internally to a
	 * more verbose data structure. The internal structure is as follows:
	 *
	 * ```js
	 * {
	 *   person: {
	 *     // A singular value.
	 *     name: { type: String },
	 *
	 *     // An array containing values of a single type.
	 *     luckyNumbers: { type: Number, isArray: true },
	 *
	 *     // Creates a to-many link to `animal` record type. If the field `owner`
	 *     // on the `animal` record type is not an array, this is a many-to-one
	 *     // relationship, otherwise it is many-to-many.
	 *     pets: { link: 'animal', isArray: true, inverse: 'owner' },
	 *
	 *     // The `min` and `max` keys are open to interpretation by the specific
	 *     // adapter, which may introspect the field definition.
	 *     thing: { type: Number, min: 0, max: 100 },
	 *
	 *     // Nested field definitions are invalid. Use `Object` type instead.
	 *     nested: { thing: { ... } } // Will throw an error.
	 *   }
	 * }
	 * ```
	 *
	 * The allowed native types are `String`, `Number`, `Boolean`, `Date`,
	 * `Object`, and `Buffer`. Note that the `Object` type should be a JSON
	 * serializable object that may be persisted. The only other allowed type is
	 * a `Function`, which may be used to define custom types.
	 *
	 * A custom type function should accept one argument, the value, and return a
	 * boolean based on whether the value is valid for the type or not. It may
	 * optionally have a method `compare`, used for sorting in the built-in
	 * adapters. The `compare` method should have the same signature as the native
	 * `Array.prototype.sort`.
	 *
	 * A custom type function must inherit one of the allowed native types. For
	 * example:
	 *
	 * ```js
	 * function Integer (x) { return (x | 0) === x }
	 * Integer.prototype = new Number()
	 * ```
	 *
	 * The options object may contain the following keys:
	 *
	 * - `adapter`: configuration array for the adapter. The default type is the
	 *   memory adapter. If the value is not an array, its settings will be
	 *   considered omitted.
	 *
	 *   ```js
	 *   {
	 *     adapter: [
	 *       // Must be a class that extends `Fortune.Adapter`, or a function
	 *       // that accepts the Adapter class and returns a subclass. Required.
	 *       Adapter => { ... },
	 *
	 *       // An options object that is specific to the adapter. Optional.
	 *       { ... }
	 *     ]
	 *   }
	 *   ```
	 *
	 * - `hooks`: keyed by type name, valued by an array containing an `input`
	 *   and/or `output` function at indices `0` and `1` respectively.
	 *
	 *   A hook function takes at least two arguments, the internal `context`
	 *   object and a single `record`. A special case is the `update` argument for
	 *   the `update` method.
	 *
	 *   There are only two kinds of hooks, before a record is written (input),
	 *   and after a record is read (output), both are optional. If an error occurs
	 *   within a hook function, it will be forwarded to the response. Use typed
	 *   errors to provide the appropriate feedback.
	 *
	 *   For a create request, the input hook may return the second argument
	 *   `record` either synchronously, or asynchronously as a Promise. The return
	 *   value of a delete request is inconsequential, but it may return a value or
	 *   a Promise. The `update` method accepts a `update` object as a third
	 *   parameter, which may be returned synchronously or as a Promise.
	 *
	 *   An example hook to apply a timestamp on a record before creation, and
	 *   displaying the timestamp in the server's locale:
	 *
	 *   ```js
	 *   {
	 *     recordType: [
	 *       (context, record, update) => {
	 *         switch (context.request.method) {
	 *           case 'create':
	 *             record.timestamp = new Date()
	 *             return record
	 *           case 'update': return update
	 *           case 'delete': return null
	 *         }
	 *       },
	 *       (context, record) => {
	 *         record.timestamp = record.timestamp.toLocaleString()
	 *         return record
	 *       }
	 *     ]
	 *   }
	 *   ```
	 *
	 *   Requests to update a record will **NOT** have the updates already applied
	 *   to the record.
	 *
	 *   Another feature of the input hook is that it will have access to a
	 *   temporary field `context.transaction`. This is useful for ensuring that
	 *   bulk write operations are all or nothing. Each request is treated as a
	 *   single transaction.
	 *
	 * - `documentation`: an object mapping names to descriptions. Note that there
	 *   is only one namepspace, so field names can only have one description.
	 *   This is optional, but useful for the HTML serializer, which also emits
	 *   this information as micro-data.
	 *
	 *   ```js
	 *   {
	 *     documentation: {
	 *       recordType: 'Description of a type.',
	 *       fieldName: 'Description of a field.',
	 *       anotherFieldName: {
	 *         en: 'Two letter language code indicates localized description.'
	 *       }
	 *     }
	 *   }
	 *   ```
	 *
	 * - `settings`: internal settings to configure.
	 *
	 *   ```js
	 *   {
	 *     settings: {
	 *       // Whether or not to enforce referential integrity. Default: `true`
	 *       // for server, `false` for browser.
	 *       enforceLinks: true,
	 *
	 *       // Name of the application used for display purposes.
	 *       name: 'My Awesome Application',
	 *
	 *       // Description of the application used for display purposes.
	 *       description: 'media type "application/vnd.micro+json"'
	 *     }
	 *   }
	 *   ```
	 *
	 * The return value of the constructor is the instance itself.
	 *
	 * @param {Object} [recordTypes]
	 * @param {Object} [options]
	 * @return {Fortune}
	 */
	Fortune.prototype.constructor = function Fortune (recordTypes, options) {
	  var self = this;
	  var plainObject = {};
	  var message = common$1.message.copy();
	  var adapter$$1, method, stack, flows, type, hooks, i, j;

	  if (recordTypes === void 0) recordTypes = {};
	  if (options === void 0) options = {};

	  if (!('adapter' in options)) options.adapter = [ memory(adapter) ];
	  if (!('settings' in options)) options.settings = {};
	  if (!('hooks' in options)) options.hooks = {};
	  if (!('enforceLinks' in options.settings))
	    options.settings.enforceLinks = true;

	  // Bind middleware methods to instance.
	  flows = {};
	  for (method in methods$1) {
	    stack = [ middlewares[method], middlewares.include, middlewares.end ];

	    for (i = 0, j = stack.length; i < j; i++)
	      stack[i] = bindMiddleware(self, stack[i]);

	    flows[methods$1[method]] = stack;
	  }

	  hooks = options.hooks;

	  // Validate hooks.
	  for (type in hooks) {
	    if (!recordTypes.hasOwnProperty(type)) throw new Error(
	      'Attempted to define hook on "' + type + '" type ' +
	      'which does not exist.')
	    if (!Array.isArray(hooks[type]))
	      throw new TypeError('Hook value for "' + type + '" type ' +
	        'must be an array.')
	  }

	  // Validate record types.
	  for (type in recordTypes) {
	    if (type in plainObject)
	      throw new Error('Can not define type name "' + type +
	        '" which is in Object.prototype.')

	    validate(recordTypes[type]);
	    if (!hooks.hasOwnProperty(type)) hooks[type] = [];
	  }

	  /*!
	   * Adapter singleton that is coupled to the Fortune instance.
	   *
	   * @type {Adapter}
	   */
	  adapter$$1 = new singleton({
	    adapter: options.adapter,
	    recordTypes: recordTypes,
	    hooks: hooks,
	    message: message
	  });

	  // Internal properties.
	  Object.defineProperties(self, {
	    // 0 = not started, 1 = started, 2 = done.
	    connectionStatus: { value: 0, writable: true },

	    // Configuration settings.
	    options: { value: options },
	    hooks: { value: hooks },
	    recordTypes: { value: recordTypes, enumerable: true },
	    message: { value: message, enumerable: true },

	    // Singleton instances.
	    adapter: { value: adapter$$1, enumerable: true, configurable: true },

	    // Dispatch.
	    flows: { value: flows }
	  });
	};


	/**
	 * This is the primary method for initiating a request. The options object
	 * may contain the following keys:
	 *
	 * - `method`: The method is a either a function or a constant, which is keyed
	 *   under `Fortune.common.methods` and may be one of `find`, `create`,
	 *   `update`, or `delete`. Default: `find`.
	 *
	 * - `type`: Name of a type. **Required**.
	 *
	 * - `ids`: An array of IDs. Used for `find` and `delete` methods only. This is
	 *   optional for the `find` method.
	 *
	 * - `include`: A 3-dimensional array specifying links to include. The first
	 *   dimension is a list, the second dimension is depth, and the third
	 *   dimension is an optional tuple with field and query options. For example:
	 *   `[['comments'], ['comments', ['author', { ... }]]]`.
	 *
	 * - `options`: Exactly the same as the [`find` method](#adapter-find)
	 *   options in the adapter. These options do not apply on methods other than
	 *   `find`, and do not affect the records returned from `include`. Optional.
	 *
	 * - `meta`: Meta-information object of the request. Optional.
	 *
	 * - `payload`: Payload of the request. **Required** for `create` and `update`
	 *   methods only, and must be an array of objects. The objects must be the
	 *   records to create, or update objects as expected by the Adapter.
	 *
	 * - `transaction`: if an existing transaction should be re-used, this may
	 *   optionally be passed in. This must be ended manually.
	 *
	 * The response object may contain the following keys:
	 *
	 * - `meta`: Meta-info of the response.
	 *
	 * - `payload`: An object containing the following keys:
	 *   - `records`: An array of records returned.
	 *   - `count`: Total number of records without options applied (only for
	 *     responses to the `find` method).
	 *   - `include`: An object keyed by type, valued by arrays of included
	 *     records.
	 *
	 * The resolved response object should always be an instance of a response
	 * type.
	 *
	 * @param {Object} options
	 * @return {Promise}
	 */
	Fortune.prototype.request = function (options) {
	  var self = this;
	  var connectionStatus = self.connectionStatus;
	  var Promise = promise.Promise;

	  if (connectionStatus === 0)
	    return self.connect()
	      .then(function () { return dispatch_1.call(self, options) })

	  else if (connectionStatus === 1)
	    return new Promise(function (resolve, reject) {
	      // Wait for changes to connection status.
	      self.once(events$1.failure, function () {
	        reject(new Error('Connection failed.'));
	      });
	      self.once(events$1.connect, function () {
	        resolve(dispatch_1.call(self, options));
	      });
	    })

	  return dispatch_1.call(self, options)
	};


	/**
	 * The `find` method retrieves record by type given IDs, querying options,
	 * or both. This is a convenience method that wraps around the `request`
	 * method, see the `request` method for documentation on its arguments.
	 *
	 * @param {String} type
	 * @param {*|*[]} [ids]
	 * @param {Object} [options]
	 * @param {Array[]} [include]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Fortune.prototype.find = function (type, ids, options, include, meta) {
	  var obj = { method: methods$1.find, type: type };

	  if (ids) obj.ids = Array.isArray(ids) ? ids : [ ids ];
	  if (options) obj.options = options;
	  if (include) obj.include = include;
	  if (meta) obj.meta = meta;

	  return this.request(obj)
	};


	/**
	 * The `create` method creates records by type given records to create. This
	 * is a convenience method that wraps around the `request` method, see the
	 * request `method` for documentation on its arguments.
	 *
	 * @param {String} type
	 * @param {Object|Object[]} records
	 * @param {Array[]} [include]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Fortune.prototype.create = function (type, records, include, meta) {
	  var options = { method: methods$1.create, type: type,
	    payload: Array.isArray(records) ? records : [ records ] };

	  if (include) options.include = include;
	  if (meta) options.meta = meta;

	  return this.request(options)
	};


	/**
	 * The `update` method updates records by type given update objects. See the
	 * [Adapter.update](#adapter-update) method for the format of the update
	 * objects. This is a convenience method that wraps around the `request`
	 * method, see the `request` method for documentation on its arguments.
	 *
	 * @param {String} type
	 * @param {Object|Object[]} updates
	 * @param {Array[]} [include]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Fortune.prototype.update = function (type, updates, include, meta) {
	  var options = { method: methods$1.update, type: type,
	    payload: Array.isArray(updates) ? updates : [ updates ] };

	  if (include) options.include = include;
	  if (meta) options.meta = meta;

	  return this.request(options)
	};


	/**
	 * The `delete` method deletes records by type given IDs (optional). This is a
	 * convenience method that wraps around the `request` method, see the `request`
	 * method for documentation on its arguments.
	 *
	 * @param {String} type
	 * @param {*|*[]} [ids]
	 * @param {Array[]} [include]
	 * @param {Object} [meta]
	 * @return {Promise}
	 */
	Fortune.prototype.delete = function (type, ids, include, meta) {
	  var options = { method: methods$1.delete, type: type };

	  if (ids) options.ids = Array.isArray(ids) ? ids : [ ids ];
	  if (include) options.include = include;
	  if (meta) options.meta = meta;

	  return this.request(options)
	};


	/**
	 * This method does not need to be called manually, it is automatically called
	 * upon the first request if it is not connected already. However, it may be
	 * useful if manually reconnect is needed. The resolved value is the instance
	 * itself.
	 *
	 * @return {Promise}
	 */
	Fortune.prototype.connect = function () {
	  var self = this;
	  var Promise = promise.Promise;

	  if (self.connectionStatus === 1)
	    return Promise.reject(new Error('Connection is in progress.'))

	  else if (self.connectionStatus === 2)
	    return Promise.reject(new Error('Connection is already done.'))

	  self.connectionStatus = 1;

	  return new Promise(function (resolve, reject) {
	    Object.defineProperty(self, 'denormalizedFields', {
	      value: ensure_types(self.recordTypes),
	      writable: true,
	      configurable: true
	    });

	    self.adapter.connect().then(function () {
	      self.connectionStatus = 2;
	      self.emit(events$1.connect);
	      return resolve(self)
	    }, function (error$$1) {
	      self.connectionStatus = 0;
	      self.emit(events$1.failure);
	      return reject(error$$1)
	    });
	  })
	};


	/**
	 * Close adapter connection, and reset connection state. The resolved value is
	 * the instance itself.
	 *
	 * @return {Promise}
	 */
	Fortune.prototype.disconnect = function () {
	  var self = this;
	  var Promise = promise.Promise;

	  if (self.connectionStatus !== 2)
	    return Promise.reject(new Error('Instance has not been connected.'))

	  self.connectionStatus = 1;

	  return new Promise(function (resolve, reject) {
	    return self.adapter.disconnect().then(function () {
	      self.connectionStatus = 0;
	      self.emit(events$1.disconnect);
	      return resolve(self)
	    }, function (error$$1) {
	      self.connectionStatus = 2;
	      self.emit(events$1.failure);
	      return reject(error$$1)
	    })
	  })
	};


	// Useful for dependency injection. All instances of Fortune have the same
	// common internal dependencies.
	Fortune.prototype.common = common$1;


	// Assign useful static properties to the default export.
	assign$2(Fortune, {
	  Adapter: adapter,
	  adapters: {
	    memory: memory(adapter)
	  },
	  errors: common$1.errors,
	  message: common$1.message,
	  methods: methods$1,
	  events: events$1
	});


	// Set the `Promise` property.
	Object.defineProperty(Fortune, 'Promise', {
	  enumerable: true,
	  get: function () {
	    return promise.Promise
	  },
	  set: function (value) {
	    promise.Promise = value;
	  }
	});


	// Internal helper function.
	function bindMiddleware (scope, method) {
	  return function (x) {
	    return method.call(scope, x)
	  }
	}


	var lib$2 = Fortune;

	class FortuneGraph {
	    constructor(fortuneOptions, schemaInfo) {
	        this.getValueByUnique = (returnTypeName, args) => __awaiter(this, void 0, void 0, function* () {
	            let currValue;
	            // tslint:disable-next-line:prefer-conditional-expression
	            if (args.id) {
	                currValue = yield this.find(returnTypeName, [args.id]);
	            }
	            else {
	                currValue = yield this.find(returnTypeName, undefined, { match: args });
	            }
	            return lodash.isArray(currValue) ? currValue[0] : currValue;
	        });
	        this.canAdd = (graphQLTypeName, inputRecords) => __awaiter(this, void 0, void 0, function* () {
	            let canAdd = true;
	            if (inputRecords && this.uniqueIndexes.has(graphQLTypeName)) {
	                yield Promise.all(this.uniqueIndexes.get(graphQLTypeName).map((fieldName) => __awaiter(this, void 0, void 0, function* () {
	                    yield Promise.all(inputRecords.map((inputRecord) => __awaiter(this, void 0, void 0, function* () {
	                        if (canAdd && inputRecord[fieldName]) {
	                            const dbRecord = yield this.getValueByUnique(graphQLTypeName, { [fieldName]: inputRecord[fieldName] });
	                            if (dbRecord) {
	                                canAdd = false;
	                            }
	                        }
	                    })));
	                })));
	            }
	            return canAdd;
	        });
	        this.create = (graphQLTypeName, records, include, meta) => __awaiter(this, void 0, void 0, function* () {
	            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	            records['__typename'] = graphQLTypeName;
	            let results = yield this.store.create(fortuneType, records, include, meta);
	            results = results.payload.records;
	            return lodash.isArray(records) ? results : results[0];
	        });
	        this.getConnection = (allEdges, before, after, first, last) => {
	            const connection = new Connection();
	            const edgesWithCursorApplied = this.applyCursorsToEdges(allEdges, before, after);
	            connection.aggregate.count = allEdges.length;
	            connection.edges = this.edgesToReturn(edgesWithCursorApplied, first, last);
	            if (typeof last !== 'undefined') {
	                if (edgesWithCursorApplied.length > last) {
	                    connection.pageInfo.hasPreviousPage = true;
	                }
	            }
	            else if (typeof after !== 'undefined' && lodash.get(allEdges, '[0].id', 'id0') !== lodash.get(edgesWithCursorApplied, '[0].id', 'id1')) {
	                connection.pageInfo.hasPreviousPage = true;
	            }
	            if (typeof first !== 'undefined') {
	                if (edgesWithCursorApplied.length > first) {
	                    connection.pageInfo.hasNextPage = true;
	                }
	            }
	            else if (typeof before !== 'undefined' && lodash.get(allEdges, `[${allEdges.length - 1}].id`, 'id0') !== lodash.get(edgesWithCursorApplied, `[${edgesWithCursorApplied.length - 1}].id`, 'id1')) {
	                connection.pageInfo.hasNextPage = true;
	            }
	            connection.pageInfo.startCursor = lodash.get(connection.edges, '[0].id');
	            connection.pageInfo.endCursor = lodash.get(connection.edges, `[${connection.edges.length - 1}].id`);
	            return connection;
	        };
	        this.edgesToReturn = (edgesWithCursorApplied, first, last) => {
	            if (typeof first !== 'undefined') {
	                if (first < 0) {
	                    throw new Error('first must be greater than 0');
	                }
	                else if (edgesWithCursorApplied.length > first) {
	                    edgesWithCursorApplied = edgesWithCursorApplied.slice(0, first);
	                }
	            }
	            if (typeof last !== 'undefined') {
	                if (last < 0) {
	                    throw new Error('first must be greater than 0');
	                }
	                else if (edgesWithCursorApplied.length > last) {
	                    edgesWithCursorApplied = edgesWithCursorApplied.slice(edgesWithCursorApplied.length - last, edgesWithCursorApplied.length);
	                }
	            }
	            return edgesWithCursorApplied;
	        };
	        this.applyCursorsToEdges = (allEdges, before, after) => {
	            let edges = allEdges;
	            if (after) {
	                const afterEdgeIndex = lodash.findIndex(edges, ['id', after]);
	                if (afterEdgeIndex > -1) {
	                    edges = edges.slice(afterEdgeIndex + 1, edges.length);
	                }
	            }
	            if (before) {
	                const beforeEdgeIndex = lodash.findIndex(edges, ['id', before]);
	                if (beforeEdgeIndex > -1) {
	                    edges = edges.slice(0, beforeEdgeIndex);
	                }
	            }
	            return edges;
	        };
	        this.find = (graphQLTypeName, ids, options, include, meta) => __awaiter(this, void 0, void 0, function* () {
	            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	            // pull the id out of the match options
	            if (lodash.get(options, 'match.id')) {
	                ids = lodash.get(options, 'match.id');
	                delete options.match.id;
	            }
	            options = this.generateOptions(options, graphQLTypeName, ids);
	            const results = yield this.store.find(fortuneType, ids, options, include, meta);
	            let graphReturn = results.payload.records;
	            if (graphReturn) {
	                // if one id sent in we just want to return the value not an array
	                graphReturn = ids && ids.length === 1 ? graphReturn[0] : graphReturn;
	            }
	            if (!graphReturn) {
	                console.log('Nothing Found ' + graphQLTypeName + ' ' + JSON.stringify(ids) + ' ' + JSON.stringify(options));
	            }
	            return graphReturn;
	        });
	        this.generateUpdates = (record, options = {}) => {
	            const updates = { id: record['id'], replace: {}, push: {}, pull: {} };
	            for (const argName in record) {
	                const arg = record[argName];
	                if (argName !== 'id') {
	                    if (lodash.isArray(arg)) {
	                        if (options['pull']) {
	                            updates.pull[argName] = arg;
	                        }
	                        else {
	                            updates.push[argName] = arg;
	                        }
	                    }
	                    else {
	                        updates.replace[argName] = arg;
	                    }
	                }
	            }
	            return updates;
	        };
	        this.update = (graphQLTypeName, records, meta, options) => __awaiter(this, void 0, void 0, function* () {
	            const updates = lodash.isArray(records) ? records.map(value => this.generateUpdates(value, options)) : this.generateUpdates(records, options);
	            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	            let results = yield this.store.update(fortuneType, updates, meta);
	            results = results.payload.records;
	            return lodash.isArray(records) ? results : results[0];
	        });
	        this.delete = (graphQLTypeName, ids, meta) => __awaiter(this, void 0, void 0, function* () {
	            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	            yield this.store.delete(fortuneType, ids, meta);
	            return true;
	        });
	        this.getLink = (graphQLTypeName, field) => {
	            const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	            return lodash.get(this.store, `recordTypes.${fortuneType}.${field}.link`);
	        };
	        this.getStore = () => {
	            if (!this.store) {
	                this.store = this.buildFortune();
	            }
	            return this.store;
	        };
	        this.computeFortuneTypeNames = () => {
	            this.fortuneTypeNames = new Map();
	            lodash.each(lodash.keys(this.schemaInfo), (typeName) => {
	                if (typeName !== 'Node' && !this.fortuneTypeNames.has(typeName)) {
	                    const type = this.schemaInfo[typeName];
	                    if (!lodash.isEmpty(type.possibleTypes)) {
	                        const possibleTypes = [type.name];
	                        lodash.each(type.possibleTypes, possibleType => {
	                            if (possibleTypes.indexOf(possibleType.name) < 0) {
	                                possibleTypes.push(possibleType.name);
	                            }
	                            possibleType = this.schemaInfo[possibleType.name];
	                            lodash.each(possibleType['interfaces'], currInterface => {
	                                if (currInterface.name !== 'Node' && currInterface.name !== typeName) {
	                                    if (possibleTypes.indexOf(currInterface.name) < 0) {
	                                        possibleTypes.push(currInterface.name);
	                                    }
	                                }
	                            });
	                            lodash.each(possibleType['unions'], currUnion => {
	                                if (currUnion.name !== typeName) {
	                                    if (possibleTypes.indexOf(currUnion.name) < 0) {
	                                        possibleTypes.push(currUnion.name);
	                                    }
	                                }
	                            });
	                        });
	                        possibleTypes.sort();
	                        const fortuneTypeName = possibleTypes.join('_');
	                        lodash.each(possibleTypes, currTypeName => {
	                            this.fortuneTypeNames.set(currTypeName, fortuneTypeName);
	                        });
	                    }
	                }
	            });
	            return this.fortuneTypeNames;
	        };
	        this.getFortuneTypeName = (name) => {
	            name = this.getDataTypeName(name);
	            return this.fortuneTypeNames.has(name) ? this.fortuneTypeNames.get(name) : name;
	        };
	        this.buildFortune = () => {
	            this.computeFortuneTypeNames();
	            const relations = computeRelations(this.schemaInfo, this.getFortuneTypeName);
	            const fortuneConfig = {};
	            lodash.forOwn(this.schemaInfo, (type, name) => {
	                if (type.kind === 'OBJECT' && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
	                    const fields = {};
	                    lodash.forOwn(type.fields, (field) => {
	                        if (field.name !== 'id') {
	                            let currType = field.type;
	                            let isArray = false;
	                            while (currType.kind === 'NON_NULL' || currType.kind === 'LIST') {
	                                if (currType.kind === 'LIST') {
	                                    isArray = true;
	                                }
	                                currType = currType.ofType;
	                            }
	                            if (lodash.get(field, 'metadata.unique') === true) {
	                                if (isArray) {
	                                    console.error('Unique may not work on list types', name, field.name);
	                                }
	                                if (!this.uniqueIndexes.has(name)) {
	                                    this.uniqueIndexes.set(name, []);
	                                }
	                                this.uniqueIndexes.get(name).push(field.name);
	                            }
	                            currType = currType.kind === 'ENUM' ? 'String' : currType.name;
	                            if (currType === 'ID' || currType === 'String') {
	                                currType = String;
	                            }
	                            else if (currType === 'Int' || currType === 'Float') {
	                                currType = Number;
	                            }
	                            else if (currType === 'Boolean') {
	                                currType = Boolean;
	                            }
	                            else if (currType === 'JSON') {
	                                currType = Object;
	                            }
	                            else if (currType === 'Date' || currType === 'Time' || currType === 'DateTime') {
	                                currType = Date;
	                            }
	                            let inverse;
	                            if (lodash.isString(currType)) {
	                                currType = this.getFortuneTypeName(currType);
	                                inverse = relations.getInverseWithoutName(currType, field.name);
	                            }
	                            currType = isArray ? Array(currType) : currType;
	                            if (inverse) {
	                                currType = [currType, inverse];
	                            }
	                            fields[field.name] = currType;
	                        }
	                        fields['__typename'] = String;
	                    });
	                    const fortuneName = this.getFortuneTypeName(name);
	                    const fortuneConfigForName = fortuneConfig[fortuneName] ? fortuneConfig[fortuneName] : {};
	                    lodash.each(lodash.keys(fields), (fieldName) => {
	                        const currType = fortuneConfigForName[fieldName];
	                        const newType = fields[fieldName];
	                        if (!currType) {
	                            fortuneConfigForName[fieldName] = newType;
	                        }
	                        else {
	                            let badSchema = typeof newType !== typeof currType;
	                            badSchema = badSchema ? badSchema : !lodash.isEqual(fortuneConfigForName[fieldName], fields[fieldName]);
	                            if (badSchema) {
	                                console.error('Bad schema. Types that share unions/interfaces have fields of the same name but different types. This is not allowed\n', 'fortune type', fortuneName, '\n', 'field name', fieldName, '\n', 'currType', fortuneConfigForName[fieldName], '\n', 'newType', fields[fieldName]);
	                            }
	                        }
	                    });
	                    fortuneConfig[fortuneName] = fortuneConfigForName;
	                }
	            });
	            const store = lib$2(fortuneConfig, this.fortuneOptions);
	            window['store'] = store;
	            return store;
	        };
	        this.generateOptions = (options, graphQLTypeName, ids) => {
	            options = options ? Object.assign({}, options) : {};
	            // if no ids we need to make sure we only get the necessary typename so that this works with interfaces/unions
	            if (graphQLTypeName && (!ids || ids.length < 1)) {
	                lodash.set(options, 'match.__typename', this.getDataTypeName(graphQLTypeName));
	            }
	            // make sure sort is boolean rather than enum
	            if (options.orderBy) {
	                const sort = {};
	                for (const fieldName in options.orderBy) {
	                    if (options.orderBy[fieldName] === 'ASCENDING' || options.orderBy[fieldName] === 'ASC') {
	                        sort[fieldName] = true;
	                    }
	                    else if (options.orderBy[fieldName] === 'DESCENDING' || options.orderBy[fieldName] === 'DESC') {
	                        sort[fieldName] = false;
	                    }
	                }
	                options.sort = sort;
	                delete options.orderBy;
	            }
	            return options;
	        };
	        this.fortuneOptions = fortuneOptions;
	        this.schemaInfo = schemaInfo;
	        this.uniqueIndexes = new Map();
	        this.store = this.buildFortune();
	    }
	    getDataTypeName(graphQLTypeName) {
	        graphQLTypeName = graphQLTypeName.endsWith('Connection') ? graphQLTypeName.replace(/Connection$/g, '') : graphQLTypeName;
	        graphQLTypeName = graphQLTypeName.endsWith('Edge') ? graphQLTypeName.replace(/Edge$/g, '') : graphQLTypeName;
	        return graphQLTypeName;
	    }
	    getFeatures() {
	        return this.store.adapter.features;
	    }
	    applyOptions(graphQLTypeName, records, options, meta) {
	        options = this.generateOptions(options);
	        const fortuneType = this.getFortuneTypeName(graphQLTypeName);
	        return common.applyOptions(this.store.recordTypes[fortuneType], records, options, meta);
	    }
	}

	class InputGenerator {
	    constructor($type, $config, $currInputObjectTypes, $schemaInfo, $schema, $relations, $dummy = false) {
	        this.generateFieldForInput = (fieldName, inputType, defaultValue) => {
	            const field = {};
	            field[fieldName] = {
	                type: inputType,
	                defaultValue: defaultValue
	            };
	            return field;
	        };
	        this.type = $type;
	        this.config = $config;
	        this.currInputObjectTypes = $currInputObjectTypes;
	        this.schemaInfo = $schemaInfo;
	        this.schema = $schema;
	        this.relations = $relations;
	        this.nestedGenerators = new Map();
	        this.dummy = $dummy;
	    }
	    handleNestedGenerators() {
	        this.nestedGenerators.forEach((generator) => {
	            if (generator.function) {
	                generator.function.apply(generator.this, generator.args);
	            }
	            generator.function = null;
	        });
	    }
	    generateInputTypeForField(field, manyWithout, oneWithout, many, one) {
	        let inputType;
	        const fieldType = getReturnGraphQLType(field.type);
	        const relationFieldName = this.relations.getInverseWithoutName(fieldType.name, field.name);
	        const isList = typeIsList(field.type);
	        // tslint:disable-next-line:prefer-conditional-expression
	        if (relationFieldName) {
	            inputType = isList ? manyWithout.call(this, fieldType, relationFieldName) : oneWithout.call(this, fieldType, relationFieldName);
	        }
	        else {
	            inputType = isList ? many.call(this, fieldType) : one.call(this, fieldType);
	        }
	        return inputType;
	    }
	    generateInputTypeForFieldInfo(field, mutation) {
	        let inputType;
	        const fieldTypeName = getReturnType(field.type);
	        const schemaType = this.schema.getType(fieldTypeName);
	        if (graphql_1.isInputType(schemaType)) {
	            inputType = schemaType;
	        }
	        else {
	            const isArray = typeIsList(field.type);
	            let fieldInputName = schemaType.name;
	            let fieldSuffix = Mutation[mutation];
	            fieldSuffix += isArray ? 'Many' : 'One';
	            const relationFieldName = this.relations.getInverseWithoutName(fieldTypeName, field.name);
	            fieldSuffix += relationFieldName ? 'Without' : '';
	            fieldInputName += fieldSuffix + capFirst(relationFieldName) + 'Input';
	            if (graphql_1.isInterfaceType(schemaType) || graphql_1.isUnionType(schemaType)) {
	                if (this.currInputObjectTypes.has(fieldInputName)) {
	                    inputType = this.currInputObjectTypes.get(fieldInputName);
	                }
	                else {
	                    const fields = {};
	                    const possibleTypes = this.schemaInfo[fieldTypeName].possibleTypes;
	                    possibleTypes.forEach(typeInfo => {
	                        const typeName = isArray ? pluralize(typeInfo.name) : typeInfo.name;
	                        const fieldName = lowerFirst(typeName);
	                        const fieldInputTypeName = typeInfo.name + fieldSuffix + capFirst(relationFieldName) + 'Input';
	                        lodash.merge(fields, this.generateFieldForInput(fieldName, new graphql_1.GraphQLInputObjectType({ name: fieldInputTypeName, fields: {} })));
	                        const functionName = `generate${fieldSuffix}Input`;
	                        if (!this.dummy && !this.nestedGenerators.has(fieldInputTypeName)) {
	                            const possibleSchemaType = getReturnGraphQLType(this.schema.getType(typeInfo.name));
	                            const possibleTypeGenerator = new InputGenerator(possibleSchemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations, true);
	                            this.nestedGenerators.set(fieldInputTypeName, {
	                                'function': possibleTypeGenerator[functionName],
	                                'args': [possibleSchemaType, relationFieldName],
	                                'this': possibleTypeGenerator
	                            });
	                        }
	                    });
	                    this.currInputObjectTypes.set(fieldInputName, new graphql_1.GraphQLInputObjectType({
	                        name: fieldInputName,
	                        fields
	                    }));
	                    inputType = this.currInputObjectTypes.get(fieldInputName);
	                }
	            }
	            else {
	                inputType = new graphql_1.GraphQLInputObjectType({ name: fieldInputName, fields: {} });
	            }
	        }
	        if (!this.dummy) {
	            this.handleNestedGenerators();
	        }
	        return inputType;
	    }
	    generateWhereUniqueInput(fieldType = this.type) {
	        const name = fieldType.name + 'WhereUniqueInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            const infoType = this.schemaInfo[fieldType.name];
	            infoType.fields.forEach(field => {
	                if (lodash.get(field, 'metadata.unique') === true) {
	                    const isArray = typeIsList(field.type);
	                    const schemaType = this.schema.getType(getReturnType(field.type));
	                    let inputType;
	                    if (graphql_1.isInputType(schemaType)) {
	                        inputType = schemaType;
	                    }
	                    else {
	                        const fieldInputName = schemaType.name + 'WhereUniqueInput';
	                        inputType = new graphql_1.GraphQLInputObjectType({ name: fieldInputName, fields: {} });
	                    }
	                    if (isArray) {
	                        inputType = new graphql_1.GraphQLList(inputType);
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType, lodash.get(field, 'metadata.defaultValue')));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    getFilterInput(typeName, fields, existsFields, matchFields, rangeFields, addLogicalOperators) {
	        const name = typeName + 'FilterInput';
	        const existsName = typeName + 'ExistsInput';
	        const matchName = typeName + 'MatchInput';
	        const rangeName = typeName + 'RangeInput';
	        const existsInput = new graphql_1.GraphQLInputObjectType({
	            name: existsName,
	            fields: existsFields
	        });
	        const matchInput = new graphql_1.GraphQLInputObjectType({
	            name: matchName,
	            fields: matchFields
	        });
	        const rangeInput = new graphql_1.GraphQLInputObjectType({
	            name: rangeName,
	            fields: rangeFields
	        });
	        this.currInputObjectTypes.set(existsName, existsInput);
	        this.currInputObjectTypes.set(matchName, matchInput);
	        this.currInputObjectTypes.set(rangeName, rangeInput);
	        lodash.merge(fields, {
	            exists: { type: existsInput },
	            match: { type: matchInput },
	            range: { type: rangeInput }
	        });
	        if (addLogicalOperators) {
	            const dummyListOfFilterInput = new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(new graphql_1.GraphQLInputObjectType({ name, fields: {} })));
	            lodash.merge(fields, {
	                and: { type: dummyListOfFilterInput },
	                or: { type: dummyListOfFilterInput },
	                not: { type: dummyListOfFilterInput }
	            });
	        }
	        this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	            name,
	            fields
	        }));
	        return this.currInputObjectTypes.get(name);
	    }
	    generateFilterInput(addLogicalOperators, fieldType = this.type) {
	        const name = fieldType.name + 'FilterInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const existsFields = {};
	            const matchFields = {};
	            const rangeFields = {};
	            const fields = {};
	            const infoType = this.schemaInfo[fieldType.name];
	            infoType.fields.forEach(field => {
	                const schemaType = this.schema.getType(getReturnType(field.type));
	                lodash.merge(existsFields, this.generateFieldForInput(field.name, graphql_1.GraphQLBoolean));
	                let inputType;
	                if (graphql_1.isScalarType(schemaType)) {
	                    inputType = schemaType;
	                    lodash.merge(matchFields, this.generateFieldForInput(field.name, new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(inputType))));
	                    lodash.merge(rangeFields, this.generateFieldForInput(field.name, new graphql_1.GraphQLList(inputType)));
	                }
	                else {
	                    const fieldInputName = schemaType.name + 'FilterInput';
	                    let fieldName = field.name;
	                    if (graphql_1.isInterfaceType(schemaType) || graphql_1.isUnionType(schemaType)) {
	                        if (!this.currInputObjectTypes.has(fieldInputName)) {
	                            const interfaceExistsFields = {};
	                            const interfaceMatchFields = {};
	                            const interfaceRangeFields = {};
	                            const interfaceFields = {};
	                            const possibleTypes = this.schemaInfo[schemaType.name].possibleTypes;
	                            possibleTypes.forEach(typeInfo => {
	                                const possibleSchemaType = getReturnGraphQLType(this.schema.getType(typeInfo.name));
	                                const possibleTypeGenerator = new InputGenerator(possibleSchemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations, true);
	                                const possibleTypeFilter = possibleTypeGenerator.generateFilterInput(addLogicalOperators);
	                                const possibleTypeFieldMap = possibleTypeFilter.getFields();
	                                lodash.merge(interfaceFields, possibleTypeFieldMap);
	                                lodash.merge(interfaceExistsFields, possibleTypeFieldMap['exists'].type.getFields());
	                                lodash.merge(interfaceMatchFields, possibleTypeFieldMap['match'].type.getFields());
	                                lodash.merge(interfaceRangeFields, possibleTypeFieldMap['range'].type.getFields());
	                            });
	                            inputType = this.getFilterInput(schemaType.name, interfaceFields, interfaceExistsFields, interfaceMatchFields, interfaceRangeFields, addLogicalOperators);
	                        }
	                    }
	                    else {
	                        inputType = new graphql_1.GraphQLInputObjectType({ name: fieldInputName, fields: {} });
	                        if (fortuneFilters.includes(fieldName)) {
	                            fieldName = 'f_' + fieldName;
	                        }
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(fieldName, inputType));
	                }
	            });
	            this.getFilterInput(fieldType.name, fields, existsFields, matchFields, rangeFields, addLogicalOperators);
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateOrderByInput(fieldType = this.type) {
	        const name = fieldType.name + 'OrderByInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const orderByEnum = this.schema.getType('ORDER_BY_OPTIONS');
	            const fields = {};
	            const infoType = this.schemaInfo[fieldType.name];
	            infoType.fields.forEach(field => {
	                const schemaType = this.schema.getType(getReturnType(field.type));
	                let inputType;
	                if (graphql_1.isScalarType(schemaType)) {
	                    inputType = schemaType;
	                    lodash.merge(fields, this.generateFieldForInput(field.name, orderByEnum));
	                }
	                else {
	                    const fieldInputName = schemaType.name + 'OrderByInput';
	                    if (graphql_1.isInterfaceType(schemaType) || graphql_1.isUnionType(schemaType)) {
	                        if (!this.currInputObjectTypes.has(fieldInputName)) {
	                            const interfaceFields = {};
	                            const possibleTypes = this.schemaInfo[schemaType.name].possibleTypes;
	                            possibleTypes.forEach(typeInfo => {
	                                const possibleSchemaType = getReturnGraphQLType(this.schema.getType(typeInfo.name));
	                                const possibleTypeGenerator = new InputGenerator(possibleSchemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations, true);
	                                const possibleTypeFilter = possibleTypeGenerator.generateOrderByInput();
	                                const possibleTypeFieldMap = possibleTypeFilter.getFields();
	                                lodash.merge(interfaceFields, possibleTypeFieldMap);
	                            });
	                            inputType = new graphql_1.GraphQLInputObjectType({
	                                name: fieldInputName,
	                                fields: interfaceFields
	                            });
	                            this.currInputObjectTypes.set(fieldInputName, inputType);
	                        }
	                    }
	                    else {
	                        inputType = new graphql_1.GraphQLInputObjectType({ name: fieldInputName, fields: {} });
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateWithoutInput(fieldType = this.type, relationFieldName) {
	        let name = fieldType.name + 'Create';
	        name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
	        name += 'Input';
	        if (!relationFieldName) {
	            return new graphql_1.GraphQLInputObjectType({ name, fields: {} });
	        }
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            const infoType = this.schemaInfo[fieldType.name];
	            infoType.fields.forEach(field => {
	                if (field.name !== relationFieldName && field.name !== 'id') {
	                    let inputType = this.generateInputTypeForFieldInfo(field, Mutation.Create);
	                    if (field.type.kind === 'NON_NULL') {
	                        inputType = new graphql_1.GraphQLNonNull(inputType);
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType, lodash.get(field, 'metadata.defaultValue')));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateManyWithoutInput(fieldType = this.type, relationFieldName) {
	        const name = fieldType.name + 'CreateManyWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName))) };
	            fields['connect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateOneWithoutInput(fieldType, relationFieldName) {
	        const name = fieldType.name + 'CreateOneWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: this.generateCreateWithoutInput(fieldType, relationFieldName) };
	            fields['connect'] = { type: this.generateWhereUniqueInput(fieldType) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateManyInput(fieldType) {
	        const name = fieldType.name + 'CreateManyInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType))) };
	            fields['connect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateOneInput(fieldType) {
	        const name = fieldType.name + 'CreateOneInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: this.generateCreateWithoutInput(fieldType) };
	            fields['connect'] = { type: this.generateWhereUniqueInput(fieldType) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateCreateInput() {
	        const name = this.type.name + 'CreateInput';
	        const fields = {};
	        if (graphql_1.isObjectType(this.type) && !this.currInputObjectTypes.has(name)) {
	            lodash.each(this.type.getFields(), field => {
	                if (field.name !== 'id') {
	                    let inputType;
	                    if (graphql_1.isInputType(field.type)) {
	                        inputType = field.type;
	                    }
	                    else {
	                        inputType = this.generateInputTypeForField(field, this.generateCreateManyWithoutInput, this.generateCreateOneWithoutInput, this.generateCreateManyInput, this.generateCreateOneInput);
	                        if (graphql_1.isNonNullType(field.type)) {
	                            inputType = new graphql_1.GraphQLNonNull(inputType);
	                        }
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType, lodash.get(this.schemaInfo[this.type.name].fields.find((introField) => introField.name === field.name), 'metadata.defaultValue')));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateWithoutInput(fieldType, relationFieldName) {
	        let name = fieldType.name + 'Update';
	        name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
	        name += 'Input';
	        if (!relationFieldName) {
	            return new graphql_1.GraphQLInputObjectType({ name, fields: {} });
	        }
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            const infoType = this.schemaInfo[fieldType.name];
	            infoType.fields.forEach(field => {
	                if (field.name !== relationFieldName && field.name !== 'id') {
	                    const inputType = this.generateInputTypeForFieldInfo(field, Mutation.Update);
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateWithWhereUniqueWithoutInput(fieldType, relationFieldName) {
	        const name = fieldType.name + 'UpdateWithWhereUniqueWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['data'] = { type: new graphql_1.GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName)) };
	            fields['where'] = { type: new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType)) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateManyWithoutInput(fieldType, relationFieldName) {
	        const name = fieldType.name + 'UpdateManyWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName))) };
	            fields['connect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['disconnect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['delete'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['update'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateUpdateWithWhereUniqueWithoutInput(fieldType, relationFieldName))) };
	            if (this.config.generateUpsert) {
	                fields['upsert'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateUpsertWithWhereUniqueWithoutInput(fieldType, relationFieldName))) };
	            }
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateOneWithoutInput(fieldType, relationFieldName) {
	        const name = fieldType.name + 'UpdateOneWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: this.generateCreateWithoutInput(fieldType, relationFieldName) };
	            fields['connect'] = { type: this.generateWhereUniqueInput(fieldType) };
	            fields['disconnect'] = { type: graphql_1.GraphQLBoolean };
	            fields['delete'] = { type: graphql_1.GraphQLBoolean };
	            fields['update'] = { type: this.generateUpdateWithoutInput(fieldType, relationFieldName) };
	            if (this.config.generateUpsert) {
	                fields['upsert'] = { type: this.generateUpsertWithoutInput(fieldType, relationFieldName) };
	            }
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateManyInput(fieldType) {
	        const name = fieldType.name + 'UpdateManyInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType))) };
	            fields['connect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['disconnect'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['delete'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType))) };
	            fields['update'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateUpdateWithWhereUniqueWithoutInput(fieldType))) };
	            if (this.config.generateUpsert) {
	                fields['upsert'] = { type: new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(this.generateUpsertWithWhereUniqueWithoutInput(fieldType))) };
	            }
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateOneInput(fieldType) {
	        const name = fieldType.name + 'UpdateOneInput';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['create'] = { type: this.generateCreateWithoutInput(fieldType) };
	            fields['connect'] = { type: this.generateWhereUniqueInput(fieldType) };
	            fields['disconnect'] = { type: graphql_1.GraphQLBoolean };
	            fields['delete'] = { type: graphql_1.GraphQLBoolean };
	            fields['update'] = { type: this.generateUpdateWithoutInput(fieldType) };
	            if (this.config.generateUpsert) {
	                fields['upsert'] = { type: this.generateUpsertWithoutInput(fieldType) };
	            }
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpdateInput() {
	        const name = this.type.name + 'UpdateInput';
	        const fields = {};
	        if (graphql_1.isObjectType(this.type) && !this.currInputObjectTypes.has(name)) {
	            lodash.each(this.type.getFields(), field => {
	                if (field.name !== 'id') {
	                    let inputType;
	                    if (graphql_1.isInputType(field.type)) {
	                        inputType = stripNonNull(field.type);
	                    }
	                    else {
	                        inputType = this.generateInputTypeForField(field, this.generateUpdateManyWithoutInput, this.generateUpdateOneWithoutInput, this.generateUpdateManyInput, this.generateUpdateOneInput);
	                    }
	                    lodash.merge(fields, this.generateFieldForInput(field.name, inputType));
	                }
	            });
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpsertWithoutInput(fieldType, relationFieldName) {
	        let name = fieldType.name + 'Upsert';
	        name += relationFieldName ? 'Without' + capFirst(relationFieldName) : '';
	        name += 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['update'] = { type: new graphql_1.GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName)) };
	            fields['create'] = { type: new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName)) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	    generateUpsertWithWhereUniqueWithoutInput(fieldType, relationFieldName) {
	        const name = fieldType.name + 'UpsertWithWhereUniqueWithout' + capFirst(relationFieldName) + 'Input';
	        if (!this.currInputObjectTypes.has(name)) {
	            const fields = {};
	            fields['update'] = { type: new graphql_1.GraphQLNonNull(this.generateUpdateWithoutInput(fieldType, relationFieldName)) };
	            fields['create'] = { type: new graphql_1.GraphQLNonNull(this.generateCreateWithoutInput(fieldType, relationFieldName)) };
	            fields['where'] = { type: new graphql_1.GraphQLNonNull(this.generateWhereUniqueInput(fieldType)) };
	            this.currInputObjectTypes.set(name, new graphql_1.GraphQLInputObjectType({
	                name,
	                fields
	            }));
	        }
	        return this.currInputObjectTypes.get(name);
	    }
	}

	class GenerateConnections {
	    constructor(dataResolver, objectName, types, $schema, $currOutputObjectTypeDefs, $currInputObjectTypes, $schemaInfo, $relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.schema = $schema;
	        this.currOutputObjectTypeDefs = $currOutputObjectTypeDefs;
	        this.currInputObjectTypes = $currInputObjectTypes;
	        this.schemaInfo = $schemaInfo;
	        this.relations = $relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.edgeResolvers = new Map();
	        this.currOutputObjectTypeDefs.add(`
			type PageInfo {
				hasNextPage: Boolean!
				hasPreviousPage: Boolean!
				startCursor: String
				endCursor: String
			}
		`);
	        this.generate();
	    }
	    generate() {
	        this.types.forEach(type => {
	            const fieldName = `${pluralize(type.name.toLowerCase())}Connection`;
	            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Connection {
					edges: [${type.name}Edge]
					pageInfo: PageInfo
					aggregate: ${type.name}Aggregate
				}
			`);
	            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Aggregate {
					count: Int!
				}
			`);
	            this.currOutputObjectTypeDefs.add(`
				type ${type.name}Edge {
					node: ${type.name}!
					cursor: String!
				}
			`);
	            const schemaType = this.schema.getType(type.name);
	            const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
	            const args = Object.assign({
	                filter: { type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators) },
	                orderBy: { type: generator.generateOrderByInput() }
	            }, queryArgs);
	            this.fields[fieldName] = {
	                type: `${type.name}Connection`,
	                args
	            };
	            this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type, true));
	            const edgeFieldResolvers = new Map();
	            edgeFieldResolvers.set('node', (root) => {
	                return root;
	            });
	            edgeFieldResolvers.set('cursor', (root) => {
	                const fortuneReturn = root && root.fortuneReturn ? root.fortuneReturn : root;
	                return fortuneReturn.id;
	            });
	            this.edgeResolvers.set(`${type.name}Edge`, edgeFieldResolvers);
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers], ...this.edgeResolvers]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class GenerateCreate {
	    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.config = $config;
	        this.currInputObjectTypes = currInputObjectTypes;
	        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
	        this.schema = schema;
	        this.schemaInfo = schemaInfo;
	        this.relations = relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.generate();
	    }
	    generate() {
	        console.log('generate create');
	        this.types.forEach(type => {
	            const args = {};
	            const createInputName = `Create${type.name}MutationInput`;
	            const createInput = new graphql_1.GraphQLInputObjectType({
	                name: createInputName,
	                fields: {
	                    data: { type: new graphql_1.GraphQLNonNull(new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations).generateCreateInput()) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(createInputName, createInput);
	            args['input'] = {
	                type: new graphql_1.GraphQLNonNull(createInput)
	            };
	            const outputTypeName = getPayloadTypeName(type.name);
	            this.fields[`create${type.name}`] = {
	                type: outputTypeName,
	                args: args
	            };
	            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
	            this.resolvers.set(`create${type.name}`, createResolver(this.dataResolver));
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers]]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class GenerateDelete {
	    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, $relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.config = $config;
	        this.currInputObjectTypes = currInputObjectTypes;
	        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
	        this.schema = schema;
	        this.schemaInfo = schemaInfo;
	        this.relations = $relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.generate();
	    }
	    generate() {
	        this.types.forEach(type => {
	            const args = {};
	            const generator = new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
	            const deleteInputName = `Delete${type.name}MutationInput`;
	            const deleteInput = new graphql_1.GraphQLInputObjectType({
	                name: deleteInputName,
	                fields: {
	                    where: { type: new graphql_1.GraphQLNonNull(generator.generateWhereUniqueInput()) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(deleteInputName, deleteInput);
	            args['input'] = {
	                type: new graphql_1.GraphQLNonNull(deleteInput)
	            };
	            const outputTypeName = getPayloadTypeName(type.name);
	            this.fields[`delete${type.name}`] = {
	                type: outputTypeName,
	                args: args
	            };
	            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
	            this.resolvers.set(`delete${type.name}`, deleteResolver(this.dataResolver));
	            // DELETE MANY
	            const deleteManyInputName = `DeleteMany${pluralize(type.name)}MutationInput`;
	            const deleteManyInput = new graphql_1.GraphQLInputObjectType({
	                name: deleteManyInputName,
	                fields: {
	                    filter: { type: new graphql_1.GraphQLNonNull(generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(deleteManyInputName, deleteManyInput);
	            const manyArgs = {};
	            manyArgs['input'] = {
	                type: new graphql_1.GraphQLNonNull(deleteManyInput)
	            };
	            this.fields[`deleteMany${pluralize(type.name)}`] = {
	                type: 'BatchPayload',
	                args: manyArgs
	            };
	            this.resolvers.set(`deleteMany${pluralize(type.name)}`, (_root, _args) => __awaiter(this, void 0, void 0, function* () {
	                let count = 0;
	                const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
	                const filter = _args.input && _args.input.filter ? _args.input.filter : '';
	                if (filter) {
	                    const schemaType = this.schema.getType(type.name);
	                    const options = parseFilter(filter, schemaType);
	                    let fortuneReturn = yield this.dataResolver.find(type.name, null, options);
	                    count = fortuneReturn.length;
	                    fortuneReturn = fortuneReturn.map((value) => {
	                        return value.id;
	                    });
	                    yield this.dataResolver.delete(type.name, fortuneReturn);
	                }
	                return {
	                    count,
	                    clientMutationId
	                };
	            }));
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers]]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class GenerateGetAll {
	    constructor(dataResolver, objectName, types, $schema, $currInputObjectTypes, $schemaInfo, $relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.schema = $schema;
	        this.currInputObjectTypes = $currInputObjectTypes;
	        this.schemaInfo = $schemaInfo;
	        this.relations = $relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.generate();
	    }
	    generate() {
	        this.types.forEach(type => {
	            const schemaType = this.schema.getType(type.name);
	            const generator = new InputGenerator(schemaType, null, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
	            const args = Object.assign({
	                filter: { type: generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators) },
	                orderBy: { type: generator.generateOrderByInput() }
	            }, queryArgs);
	            const fieldName = `${pluralize(type.name.toLowerCase())}`;
	            this.fields[fieldName] = {
	                type: `[${type.name}]`,
	                args
	            };
	            this.resolvers.set(fieldName, getAllResolver(this.dataResolver, this.schema, type));
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers]]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class GenerateUpdate {
	    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, $relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.config = $config;
	        this.currInputObjectTypes = currInputObjectTypes;
	        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
	        this.schema = schema;
	        this.schemaInfo = schemaInfo;
	        this.relations = $relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.generate();
	    }
	    generate() {
	        this.types.forEach(type => {
	            const args = {};
	            const schemaType = this.schema.getType(type.name);
	            const generator = new InputGenerator(schemaType, this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
	            const updateInputName = `Update${type.name}MutationInput`;
	            const updateInput = new graphql_1.GraphQLInputObjectType({
	                name: updateInputName,
	                fields: {
	                    data: { type: new graphql_1.GraphQLNonNull(generator.generateUpdateInput()) },
	                    where: { type: new graphql_1.GraphQLNonNull(generator.generateWhereUniqueInput()) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(updateInputName, updateInput);
	            args['input'] = {
	                type: new graphql_1.GraphQLNonNull(updateInput)
	            };
	            const outputTypeName = getPayloadTypeName(type.name);
	            this.fields[`update${type.name}`] = {
	                type: outputTypeName,
	                args: args
	            };
	            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
	            this.resolvers.set(`update${type.name}`, updateResolver(this.dataResolver));
	            // UPDATE MANY
	            const updateManyInputName = `UpdateMany${pluralize(type.name)}MutationInput`;
	            const updateManyInput = new graphql_1.GraphQLInputObjectType({
	                name: updateManyInputName,
	                fields: {
	                    data: { type: new graphql_1.GraphQLNonNull(generator.generateUpdateInput()) },
	                    filter: { type: new graphql_1.GraphQLNonNull(generator.generateFilterInput(this.dataResolver.getFeatures().logicalOperators)) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(updateManyInputName, updateManyInput);
	            const manyArgs = {};
	            manyArgs['input'] = {
	                type: new graphql_1.GraphQLNonNull(updateManyInput)
	            };
	            this.fields[`updateMany${pluralize(type.name)}`] = {
	                type: 'BatchPayload',
	                args: manyArgs
	            };
	            this.resolvers.set(`updateMany${pluralize(type.name)}`, (_root, _args, _context, _info) => __awaiter(this, void 0, void 0, function* () {
	                let count = 0;
	                const clientMutationId = _args.input && _args.input.clientMutationId ? _args.input.clientMutationId : '';
	                const filter = _args.input && _args.input.filter ? _args.input.filter : '';
	                const updateArgs = _args.input && _args.input.data ? _args.input.data : '';
	                if (filter && updateArgs) {
	                    const options = parseFilter(filter, schemaType);
	                    const fortuneReturn = yield this.dataResolver.find(type.name, null, options);
	                    count = fortuneReturn.length;
	                    yield Promise.all(fortuneReturn.map((fortuneRecord) => __awaiter(this, void 0, void 0, function* () {
	                        return yield updateResolver(this.dataResolver)(fortuneRecord, { update: updateArgs, where: true }, _context, _info, null, null, schemaType);
	                    })));
	                }
	                return {
	                    count,
	                    clientMutationId
	                };
	            }));
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers]]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class GenerateUpsert {
	    constructor(dataResolver, objectName, types, $config, currInputObjectTypes, currOutputObjectTypeDefs, schemaInfo, schema, $relations) {
	        this.dataResolver = dataResolver;
	        this.objectName = objectName;
	        this.types = types;
	        this.config = $config;
	        this.currInputObjectTypes = currInputObjectTypes;
	        this.currOutputObjectTypeDefs = currOutputObjectTypeDefs;
	        this.schema = schema;
	        this.schemaInfo = schemaInfo;
	        this.relations = $relations;
	        this.fields = {};
	        this.resolvers = new Map();
	        this.generate();
	    }
	    generate() {
	        this.types.forEach(type => {
	            const args = {};
	            const generator = new InputGenerator(this.schema.getType(type.name), this.config, this.currInputObjectTypes, this.schemaInfo, this.schema, this.relations);
	            const upsertInputName = `Upsert${type.name}MutationInput`;
	            const upsertInput = new graphql_1.GraphQLInputObjectType({
	                name: upsertInputName,
	                fields: {
	                    create: { type: new graphql_1.GraphQLNonNull(generator.generateCreateInput()) },
	                    update: { type: new graphql_1.GraphQLNonNull(generator.generateUpdateInput()) },
	                    where: { type: new graphql_1.GraphQLNonNull(generator.generateWhereUniqueInput()) },
	                    clientMutationId: { type: graphql_1.GraphQLString }
	                }
	            });
	            this.currInputObjectTypes.set(upsertInputName, upsertInput);
	            args['input'] = {
	                type: new graphql_1.GraphQLNonNull(upsertInput)
	            };
	            const outputTypeName = getPayloadTypeName(type.name);
	            this.fields[`upsert${type.name}`] = {
	                type: outputTypeName,
	                args: args
	            };
	            this.currOutputObjectTypeDefs.add(getPayloadTypeDef(type.name));
	            this.resolvers.set(`upsert${type.name}`, upsertResolver(this.dataResolver));
	        });
	    }
	    getResolvers() {
	        return new Map([[this.objectName, this.resolvers]]);
	    }
	    getFieldsOnObject() {
	        return new Map([[this.objectName, this.fields]]);
	    }
	}

	class SchemaInfoBuilder {
	    constructor(schema) {
	        this.schema = schema;
	    }
	    getSchemaInfo() {
	        return __awaiter(this, void 0, void 0, function* () {
	            if (!this.schemaInfo) {
	                this.schemaInfo = yield this.buildSchemaInfo(this.schema);
	            }
	            return this.schemaInfo;
	        });
	    }
	    addDirectiveFromAST(astDirective, schemaInfo, path) {
	        const name = astDirective.name.value;
	        const args = [];
	        lodash.each(astDirective.arguments, arg => {
	            args.push(Object.assign({ name: arg.name.value }, lodash.omit(arg.value, ['loc'])));
	        });
	        const directives = lodash.get(schemaInfo, path) ? lodash.get(schemaInfo, path) : [];
	        directives.push({ name: name, args: args });
	        lodash.set(schemaInfo, path, directives);
	    }
	    buildSchemaInfo(schema) {
	        return __awaiter(this, void 0, void 0, function* () {
	            let originalSchemaInfo = yield graphql_1.graphql(schema, graphql_1.getIntrospectionQuery({ descriptions: true }));
	            originalSchemaInfo = originalSchemaInfo.data;
	            let schemaInfo = originalSchemaInfo;
	            schemaInfo = lodash.omitBy(schemaInfo.__schema.types, (value) => {
	                return lodash.startsWith(value.name, '__') || lodash.includes(['Boolean', 'String', 'ID', 'Int', 'Float'], value.name);
	            });
	            schemaInfo = lodash.mapKeys(schemaInfo, (type) => type.name);
	            lodash.each(lodash.keys(schemaInfo), (typeName) => {
	                const type = schemaInfo[typeName];
	                // directives on type
	                lodash.each(lodash.get(schema.getType(typeName), 'astNode.directives'), (astDirective) => {
	                    this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.directives`);
	                });
	                // directives on fields
	                lodash.each(lodash.get(schema.getType(typeName), 'astNode.fields'), (field) => {
	                    const fieldName = field.name.value;
	                    lodash.each(lodash.get(field, 'directives'), (astDirective) => {
	                        const fieldIndex = lodash.findIndex(lodash.get(schemaInfo, `${typeName}.fields`), { 'name': fieldName });
	                        this.addDirectiveFromAST(astDirective, schemaInfo, `${typeName}.fields[${fieldIndex}].directives`);
	                    });
	                });
	                // metadata on type
	                lodash.set(schemaInfo, `${typeName}.metadata`, lodash.omit(lodash.get(schema, `_typeMap.${typeName}`), ['astNode', 'name', 'description', 'extensionASTNodes', 'isTypeOf', '_fields', '_interfaces', '_typeConfig', 'getFields', 'getInterfaces', 'toString', 'inspect', 'toJSON', '_enumConfig', 'getValue', 'getValues', 'parseLiteral', 'parseValue', 'getValue', 'serialize', '_getNameLookup', '_getValueLookup', '_values', 'resolveType', 'getTypes', '_types']));
	                // metadata of fields
	                lodash.each(lodash.get(schema, `_typeMap.${typeName}._fields`), (field) => {
	                    const fieldIndex = lodash.findIndex(lodash.get(schemaInfo, `${typeName}.fields`), { 'name': field.name });
	                    lodash.set(schemaInfo, `${typeName}.fields[${fieldIndex}].metadata`, lodash.omit(field, ['type', 'description', 'args', 'deprecationReason', 'astNode', 'isDeprecated', 'name']));
	                });
	                // add unions to types
	                if (type.kind === 'UNION') {
	                    lodash.each(type.possibleTypes, possibleType => {
	                        schemaInfo[possibleType.name].unions = schemaInfo[possibleType.name].unions ? schemaInfo[possibleType.name].unions : [];
	                        schemaInfo[possibleType.name].unions = lodash.concat(schemaInfo[possibleType.name].unions, [{ kind: type.kind, name: type.name, ofType: type.ofType }]);
	                    });
	                }
	            });
	            return schemaInfo;
	        });
	    }
	}

	class GraphQLGenie {
	    constructor(options) {
	        this.config = {
	            generateGetAll: true,
	            generateCreate: true,
	            generateUpdate: true,
	            generateDelete: true,
	            generateUpsert: true,
	            generateConnections: true,
	            generateSubscriptions: true
	        };
	        this.validate = () => {
	            const typeMap = this.schema.getTypeMap();
	            Object.keys(typeMap).forEach(name => {
	                const type = typeMap[name];
	                if (graphql_1.isObjectType(type) && !type.name.includes('__') && !(type.name.toLowerCase() === 'query') && !(type.name.toLowerCase() === 'mutation') && !(type.name.toLowerCase() === 'subscription')) {
	                    if (type.name.endsWith('Connection')) {
	                        throw new Error(`${type.name} is invalid because it ends with Connection which could intefere with necessary generated types and genie logic`);
	                    }
	                    else if (type.name.endsWith('Edge')) {
	                        throw new Error(`${type.name} is invalid because it ends with Edge which could intefere with necessary generated types and genie logic`);
	                    }
	                    else if (this.config.generateConnections && type.name === 'PageInfo') {
	                        throw new Error(`${type.name} is invalid. PageInfo type is auto generated for connections`);
	                    }
	                }
	            });
	        };
	        this.init = () => __awaiter(this, void 0, void 0, function* () {
	            this.generators = [];
	            this.schemaInfoBuilder = new SchemaInfoBuilder(this.schema);
	            this.schemaInfo = yield this.schemaInfoBuilder.getSchemaInfo();
	            this.relations = computeRelations(this.schemaInfo);
	            this.graphQLFortune = new FortuneGraph(this.fortuneOptions, this.schemaInfo);
	            yield this.buildQueries();
	            yield this.buildResolvers();
	            window['graphql'] = graphql_1.graphql;
	            window['schema'] = this.schema;
	            return true;
	        });
	        this.buildResolvers = () => __awaiter(this, void 0, void 0, function* () {
	            const queryTypeFields = this.schema.getType('Query').getFields();
	            const queryField = queryTypeFields[Object.keys(queryTypeFields)[0]];
	            const fullArgs = queryField.args;
	            const filterArg = lodash.find(fullArgs, ['name', 'filter']);
	            lodash.forOwn(this.schemaInfo, (type, name) => {
	                const fieldResolvers = new Map();
	                const schemaType = this.schema.getType(type.name);
	                if (graphql_1.isObjectType(schemaType) && name !== 'Query' && name !== 'Mutation' && name !== 'Subscription') {
	                    const fieldMap = schemaType.getFields();
	                    lodash.forOwn(type.fields, (field) => {
	                        const graphQLfield = fieldMap[field.name];
	                        graphQLfield.args = graphQLfield.args ? graphQLfield.args : [];
	                        if (typeIsList(graphQLfield.type)) {
	                            graphQLfield.args = graphQLfield.args.concat(fullArgs);
	                        }
	                        else {
	                            graphQLfield.args.push(filterArg);
	                        }
	                        const returnConnection = getReturnType(graphQLfield.type).endsWith('Connection');
	                        fieldResolvers.set(field.name, getTypeResolver(this.graphQLFortune, this.schema, field, returnConnection));
	                    });
	                    this.schema = this.schemaBuilder.addResolvers(name, fieldResolvers);
	                }
	            });
	        });
	        this.buildQueries = () => __awaiter(this, void 0, void 0, function* () {
	            const nodesResult = yield graphql_1.graphql(this.schema, `{
			__type(name: "Node") {
				possibleTypes {
					name
				}
			}
		}`);
	            const nodeNames = nodesResult.data.__type.possibleTypes;
	            const nodeTypes = [];
	            nodeNames.forEach(result => {
	                nodeTypes.push(this.schemaInfo[result.name]);
	            });
	            const currInputObjectTypes = new Map();
	            const currOutputObjectTypeDefs = new Set();
	            if (this.config.generateGetAll) {
	                this.generators.push(new GenerateGetAll(this.graphQLFortune, 'Query', nodeTypes, this.schema, currInputObjectTypes, this.schemaInfo, this.relations));
	            }
	            if (this.config.generateConnections) {
	                this.generators.push(new GenerateConnections(this.graphQLFortune, 'Query', nodeTypes, this.schema, currOutputObjectTypeDefs, currInputObjectTypes, this.schemaInfo, this.relations));
	            }
	            if (this.config.generateCreate) {
	                this.generators.push(new GenerateCreate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
	            }
	            if (this.config.generateUpdate) {
	                this.generators.push(new GenerateUpdate(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
	            }
	            if (this.config.generateUpsert) {
	                this.generators.push(new GenerateUpsert(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
	            }
	            if (this.config.generateDelete) {
	                this.generators.push(new GenerateDelete(this.graphQLFortune, 'Mutation', nodeTypes, this.config, currInputObjectTypes, currOutputObjectTypeDefs, this.schemaInfo, this.schema, this.relations));
	            }
	            let newTypes = '';
	            currInputObjectTypes.forEach(inputObjectType => {
	                // console.log(printType(inputObjectType));
	                newTypes += graphql_1.printType(inputObjectType) + '\n';
	            });
	            currOutputObjectTypeDefs.forEach(newType => {
	                newTypes += newType + '\n';
	            });
	            const fieldsOnObject = new Map();
	            const resolvers = new Map();
	            // merge maps and compute new input types
	            this.generators.forEach(generator => {
	                generator.getFieldsOnObject().forEach((fields, objectName) => {
	                    fieldsOnObject.set(objectName, lodash.assign({}, fieldsOnObject.get(objectName), fields));
	                });
	                const generatorResolvers = generator.getResolvers();
	                generatorResolvers.forEach((resolver, name) => {
	                    if (!resolvers.has(name)) {
	                        resolvers.set(name, new Map());
	                    }
	                    resolvers.set(name, new Map([...resolvers.get(name), ...resolver]));
	                });
	            });
	            fieldsOnObject.forEach((fields, objName) => {
	                newTypes += graphql_1.printType(new graphql_1.GraphQLObjectType({ name: objName, fields: fields })) + '\n';
	            });
	            // console.log(newTypes);
	            this.schema = this.schemaBuilder.addTypeDefsToSchema(newTypes);
	            resolvers.forEach((resolverMap, name) => {
	                this.schemaBuilder.addResolvers(name, resolverMap);
	            });
	            this.schema = this.schemaBuilder.getSchema();
	        });
	        this.getSchema = () => __awaiter(this, void 0, void 0, function* () {
	            yield this.initialized;
	            return this.schema;
	        });
	        this.getDataResolver = () => __awaiter(this, void 0, void 0, function* () {
	            yield this.initialized;
	            return this.graphQLFortune;
	        });
	        this.getFragmentTypes = () => __awaiter(this, void 0, void 0, function* () {
	            yield this.initialized;
	            const result = yield graphql_1.graphql(this.schema, `{
			__schema {
				types {
					kind
					name
					possibleTypes {
						name
					}
				}
			}
		}`);
	            // here we're filtering out any type information unrelated to unions or interfaces
	            const types = lodash.get(result, 'data.__schema.types');
	            if (types) {
	                const filteredData = result.data.__schema.types.filter(type => type.possibleTypes !== null);
	                result.data.__schema.types = filteredData;
	            }
	            return result.data;
	        });
	        if (!options.fortuneOptions) {
	            throw new Error('Fortune Options is required');
	        }
	        else {
	            this.fortuneOptions = options.fortuneOptions;
	        }
	        if (options.generatorOptions) {
	            this.config = Object.assign(this.config, options.generatorOptions);
	        }
	        if (options.schemaBuilder) {
	            this.schemaBuilder = options.schemaBuilder;
	        }
	        else if (options.typeDefs) {
	            this.schemaBuilder = new GraphQLSchemaBuilder(options.typeDefs, this.config);
	        }
	        else {
	            throw new Error('Need a schemaBuilder or typeDefs');
	        }
	        this.schema = this.schemaBuilder.getSchema();
	        this.validate();
	        this.initialized = this.init();
	    }
	}
	// cache.writeData({ data });
	// cache.writeData({
	// 	id: 'ROOT_QUERY.objects.1',
	// 	data: {
	// 		field: 'hi'
	// 	}
	// });
	// window['gql'] = gql;
	// window['cache'] = cache;
	// console.info(cache.readQuery({
	// 	query: gql`
	//   query {
	//     objects {
	//       name
	//     }
	//   }
	// `}));
	// mutation {
	//   createGraphQLField(name: "test new field", type:{list:true, type:""}) {
	//     id
	//     name
	//     description
	//   }
	// }
	// {
	//   allGraphQLDirectives {
	//     id
	//     name
	//     description
	//     args {
	//       id
	//       type {
	//         ... on GraphQLScalarType {
	//           id
	//         }
	//       }
	//     }
	//   }
	// }

	exports.GraphQLSchemaBuilder = GraphQLSchemaBuilder;
	exports.Connection = Connection;
	exports.GraphQLGenie = GraphQLGenie;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
